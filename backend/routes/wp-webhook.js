import express from 'express';
import crypto from 'crypto';
import supabase from '../services/supabase.js';
import coreClient from '../services/bluecc/core.js';
import { clearProfileCache } from '../middleware/auth.js';

const router = express.Router();

// ─── Signature Verification Middleware ───────────────────────

/**
 * Verifies the WooCommerce webhook HMAC-SHA256 signature.
 * WooCommerce sends the signature in the X-WC-Webhook-Signature header.
 */
function verifyWooCommerceSignature(req, res, next) {
  const signature = req.headers['x-wc-webhook-signature'];
  const secret = process.env.WP_WEBHOOK_SECRET;

  if (!secret) {
    console.error('WP_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Use raw body if available (preserves original JSON formatting for correct HMAC),
  // otherwise fall back to re-serialized body
  const payload = req.rawBody || JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  if (hash !== signature) {
    console.warn('Invalid WooCommerce webhook signature');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}

// ─── WooCommerce Order Webhook ──────────────────────────────

/**
 * POST /api/webhooks/woocommerce
 *
 * Handles WooCommerce order.completed webhook:
 * 1. Verifies HMAC signature
 * 2. Creates Supabase user (or finds existing)
 * 3. Upserts profile row
 * 4. Provisions Blue.cc TodoList
 * 5. Upserts subscription record
 * 6. Generates magic link for passwordless login
 *
 * Always returns 200 to prevent WooCommerce retry storms.
 */
router.post('/', verifyWooCommerceSignature, async (req, res) => {
  const order = req.body;

  // WooCommerce sends a ping on webhook creation — respond 200
  if (!order?.billing?.email) {
    return res.json({ received: true, action: 'ping' });
  }

  const email = order.billing.email.toLowerCase().trim();
  const name = `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim();
  const orderId = order.id;

  console.log(`[WP Webhook] Processing order ${orderId} for ${email}`);

  try {
    // ─── Step 1: Create or find Supabase user ───────────────
    let userId;

    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name,
          source: 'wordpress',
          wp_order_id: orderId,
        },
      });

    if (createError) {
      if (createError.message?.includes('already been registered')) {
        // User already exists — look up by email
        const { data: { users }, error: listError } =
          await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(`[WP Webhook] Failed to list users:`, listError);
          return res.json({ received: true, error: 'User lookup failed' });
        }

        const existing = users.find((u) => u.email === email);
        if (!existing) {
          console.error(`[WP Webhook] User registered but not found: ${email}`);
          return res.json({ received: true, error: 'User lookup failed' });
        }
        userId = existing.id;
        console.log(`[WP Webhook] Found existing user: ${userId}`);
      } else {
        console.error(`[WP Webhook] Failed to create user:`, createError);
        return res.json({ received: true, error: 'User creation failed' });
      }
    } else {
      userId = createData.user.id;
      console.log(`[WP Webhook] Created new user: ${userId}`);
    }

    // ─── Step 2: Upsert profile ─────────────────────────────
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      name,
      role: 'owner',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error(`[WP Webhook] Profile upsert error:`, profileError);
    }

    // ─── Step 3: Provision Blue.cc TodoList (if needed) ─────
    const { data: profile } = await supabase
      .from('profiles')
      .select('blue_cc_todo_list_id')
      .eq('id', userId)
      .single();

    let todoListId = profile?.blue_cc_todo_list_id;

    if (!todoListId) {
      const title = `pmt_user_${email.replace(/[^a-z0-9]/g, '_')}`;
      todoListId = await coreClient.createTodoList(title);

      if (todoListId) {
        await supabase
          .from('profiles')
          .update({
            blue_cc_todo_list_id: todoListId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        console.log(`[WP Webhook] Provisioned TodoList: ${todoListId}`);
      } else {
        console.error(`[WP Webhook] Failed to create Blue.cc TodoList for ${email}`);
      }
    }

    // ─── Step 4: Upsert subscription ────────────────────────
    const plan = mapProductToPlan(order.line_items);

    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          status: 'active',
          plan,
          wp_order_id: String(orderId),
        },
        { onConflict: 'user_id' }
      );

    if (subError) {
      console.error(`[WP Webhook] Subscription upsert error:`, subError);
    }

    // ─── Step 5: Generate magic link ────────────────────────
    const appUrl = process.env.APP_URL || 'http://localhost:3002';
    let magicLink = null;

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${appUrl}/board` },
      });

    if (linkError) {
      console.error(`[WP Webhook] Magic link generation error:`, linkError);
    } else {
      magicLink = linkData?.properties?.action_link || null;
    }

    // ─── Step 6: Invalidate profile cache ───────────────────
    clearProfileCache(userId);

    // ─── Response ───────────────────────────────────────────
    console.log(`[WP Webhook] Successfully provisioned ${email} (plan: ${plan})`);

    res.json({
      received: true,
      userId,
      todoListId,
      plan,
      magic_link: magicLink,
    });
  } catch (err) {
    console.error(`[WP Webhook] Unhandled error:`, err);
    // Always return 200 to prevent WooCommerce retry storms
    res.json({ received: true, error: err.message });
  }
});

// ─── Helpers ────────────────────────────────────────────────

/**
 * Map WooCommerce line items to a PMT subscription plan.
 * Customize product ID/name mappings based on actual WooCommerce store setup.
 */
function mapProductToPlan(lineItems) {
  if (!lineItems || lineItems.length === 0) return 'starter';

  const productName = (lineItems[0].name || '').toLowerCase();
  if (productName.includes('enterprise')) return 'enterprise';
  if (productName.includes('pro')) return 'pro';
  return 'starter';
}

export default router;
