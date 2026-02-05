import supabase from '../services/supabase.js';
import coreClient from '../services/bluecc/core.js';

// Auth bypass: active in development, disabled in production
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV !== 'production';

// ─── Profile Cache ────────────────────────────────────────────
// In-memory cache to avoid hitting Supabase on every request.
// Key: user UUID, Value: { profile, expiresAt }
const profileCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(userId) {
  const entry = profileCache.get(userId);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.profile;
  }
  profileCache.delete(userId);
  return null;
}

function setCachedProfile(userId, profile) {
  profileCache.set(userId, {
    profile,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ─── Blue.cc TodoList Provisioning ────────────────────────────

/**
 * Lazy-provision a Blue.cc TodoList for a user who doesn't have one yet.
 * This happens on first authenticated request after signup.
 */
async function provisionTodoList(userId, email) {
  const title = `pmt_user_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const todoListId = await coreClient.createTodoList(title);

  if (todoListId) {
    // Store in Supabase profile
    const { error } = await supabase
      .from('profiles')
      .update({ blue_cc_todo_list_id: todoListId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Failed to store todoListId in profile:', error);
    }
  }

  return todoListId;
}

// ─── Middleware ────────────────────────────────────────────────

/**
 * Supabase JWT authentication middleware.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate with Supabase auth.getUser() (confirms session is active)
 * 3. Look up profile (with Blue.cc todoListId) from cache or Supabase
 * 4. Lazy-provision Blue.cc TodoList if needed
 * 5. Attach req.user = { id, email, todoListId, role }
 */
export const authenticateToken = async (req, res, next) => {
  // ─── Bypass Mode (development) ────────────────────────────
  if (BYPASS_AUTH) {
    req.user = {
      id: 'bypass-user',
      email: 'user@local.dev',
      todoListId: process.env.BLUE_TODO_LIST_ID || null,
      role: 'owner',
    };
    return next();
  }

  // ─── Extract Token ────────────────────────────────────────
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    // ─── Validate with Supabase ──────────────────────────────
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // ─── Get Profile (cached or fresh) ───────────────────────
    let profile = getCachedProfile(authUser.id);

    if (!profile) {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, blue_cc_todo_list_id')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        // Profile might not exist yet if trigger hasn't fired
        // Create it manually
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            name: authUser.user_metadata?.name || '',
            role: 'owner',
          })
          .select('role, blue_cc_todo_list_id')
          .single();

        if (createError) {
          console.error('Failed to create profile:', createError);
          return res.status(500).json({ error: 'Failed to initialize user profile' });
        }
        profile = newProfile;
      } else {
        profile = data;
      }

      setCachedProfile(authUser.id, profile);
    }

    // ─── Lazy-Provision Blue.cc TodoList ─────────────────────
    let todoListId = profile.blue_cc_todo_list_id;

    if (!todoListId) {
      todoListId = await provisionTodoList(authUser.id, authUser.email);
      // Update cache
      if (todoListId) {
        profile.blue_cc_todo_list_id = todoListId;
        setCachedProfile(authUser.id, profile);
      }
    }

    // ─── Guard: require todoListId ─────────────────────────────
    if (!todoListId) {
      console.error(`User ${authUser.id} has no todoListId after provisioning attempt`);
      return res.status(503).json({ error: 'Workspace not ready. Please try again.' });
    }

    // ─── Attach User to Request ──────────────────────────────
    req.user = {
      id: authUser.id,
      email: authUser.email,
      todoListId: todoListId,
      role: profile.role || 'owner',
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export default authenticateToken;
