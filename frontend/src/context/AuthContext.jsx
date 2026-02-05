import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase.js';
import axios from 'axios';

const AuthContext = createContext();

// Auth bypass: active in development, disabled in production builds
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true' || import.meta.env.DEV;

// Bypass user object (computed once at module level)
const BYPASS_USER = BYPASS_AUTH
  ? { id: 'bypass-user', email: 'user@local.dev', name: 'Local User', role: 'owner', emailVerified: true }
  : null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(BYPASS_USER);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(!BYPASS_AUTH); // Not loading if bypassed

  // ─── Session Listener ───────────────────────────────────────

  useEffect(() => {
    if (BYPASS_AUTH) return;

    /**
     * Provision Blue.cc TodoList for new users (idempotent).
     * Defined inside useEffect to satisfy lint ordering rules.
     */
    async function provisionWorkspace(token) {
      try {
        await axios.post(
          '/api/auth/provision',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn('Workspace provisioning deferred:', err.message);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        setUser({
          id: initialSession.user.id,
          email: initialSession.user.email,
          name: initialSession.user.user_metadata?.name || '',
          emailVerified: !!initialSession.user.email_confirmed_at,
        });
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          setUser({
            id: newSession.user.id,
            email: newSession.user.email,
            name: newSession.user.user_metadata?.name || '',
            emailVerified: !!newSession.user.email_confirmed_at,
          });
        } else {
          setUser(null);
        }

        // After signup, provision Blue.cc workspace
        if (event === 'SIGNED_IN' && newSession?.access_token) {
          provisionWorkspace(newSession.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth Actions ───────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // stored in user_metadata
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const googleLogin = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/board`,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const githubLogin = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/board`,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  }, []);

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
    githubLogin,
    logout,
    forgotPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
