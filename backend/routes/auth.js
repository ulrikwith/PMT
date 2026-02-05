import express from 'express';
import supabase from '../services/supabase.js';
import coreClient from '../services/bluecc/core.js';

const router = express.Router();

// ─── Routes ───────────────────────────────────────────────────
// Most auth (register, login, Google, password reset) is handled
// client-side by Supabase JS. These backend routes handle only
// what requires server-side logic.

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile + subscription.
 * Requires Supabase JWT in Authorization header.
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Validate token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json({
      id: user.id,
      email: user.email,
      name: profile.name || user.user_metadata?.name || '',
      role: profile.role || 'owner',
      emailVerified: !!user.email_confirmed_at,
      todoListId: profile.blue_cc_todo_list_id,
      subscription: subscription || { status: 'trial', plan: 'starter' },
      createdAt: profile.created_at,
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/auth/provision
 * Called by the frontend after a user signs up.
 * Creates a Blue.cc TodoList and stores the ID in the profile.
 * Requires Supabase JWT in Authorization header.
 */
router.post('/provision', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Validate token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if already provisioned
    const { data: profile } = await supabase
      .from('profiles')
      .select('blue_cc_todo_list_id')
      .eq('id', user.id)
      .single();

    if (profile?.blue_cc_todo_list_id) {
      return res.json({
        message: 'Already provisioned',
        todoListId: profile.blue_cc_todo_list_id,
      });
    }

    // Create Blue.cc TodoList
    const title = `pmt_user_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const todoListId = await coreClient.createTodoList(title);

    if (!todoListId) {
      return res.status(500).json({ error: 'Failed to create Blue.cc workspace' });
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        blue_cc_todo_list_id: todoListId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to save workspace' });
    }

    // Create default subscription
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      status: 'trial',
      plan: 'starter',
    });

    res.json({
      message: 'Workspace provisioned',
      todoListId,
    });
  } catch (err) {
    console.error('Provision error:', err);
    res.status(500).json({ error: 'Provisioning failed' });
  }
});

export default router;
