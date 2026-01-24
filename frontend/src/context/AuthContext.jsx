import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = '/api/auth';

// Google Client ID should be in env, using placeholder or passed from config
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // User needs to provide this

// 🚧 TEMPORARY BYPASS - Set to true to disable authentication
const BYPASS_AUTH = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pmt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚧 BYPASS: Skip authentication when BYPASS_AUTH is enabled
    if (BYPASS_AUTH) {
      setUser({ id: 'bypass-user', email: 'user@local.dev', name: 'Local User' });
      setLoading(false);
      return;
    }

    if (token) {
      // Decode token to get user info (simple version)
      // Ideally call /api/auth/me
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, email: payload.email });
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    setToken(res.data.token);
    localStorage.setItem('pmt_token', res.data.token);
    setUser(res.data.user);
  };

  const register = async (email, password, name) => {
    const res = await axios.post(`${API_URL}/register`, { email, password, name });
    setToken(res.data.token);
    localStorage.setItem('pmt_token', res.data.token);
    setUser(res.data.user);
  };

  const googleLogin = async (credentialResponse) => {
    const res = await axios.post(`${API_URL}/google`, {
      credential: credentialResponse.credential,
    });
    setToken(res.data.token);
    localStorage.setItem('pmt_token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pmt_token');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ user, token, login, register, googleLogin, logout, loading }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
