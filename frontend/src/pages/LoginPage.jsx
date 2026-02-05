import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, Github, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, register, googleLogin, githubLogin, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Show verification success message if redirected from email confirmation
  const verified = searchParams.get('verified') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await forgotPassword(formData.email);
        setSuccess('Password reset link sent to your email.');
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        const data = await register(formData.email, formData.password, formData.name);
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists.');
        } else {
          setSuccess('Account created! Check your email to verify, then sign in.');
          setMode('login');
        }
      } else {
        await login(formData.email, formData.password);
        navigate('/board');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError('');
    try {
      if (provider === 'google') {
        await googleLogin();
      } else if (provider === 'github') {
        await githubLogin();
      }
      // OAuth redirects away — no need to navigate
    } catch (err) {
      setError(err.message || `${provider} login failed`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400">Process-Oriented Project Management</p>
        </div>

        {/* Verification Success */}
        {verified && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            Email verified! You can now sign in.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder={mode === 'register' ? 'Password (min 6 characters)' : 'Password'}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={mode === 'register' ? 6 : undefined}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            {loading
              ? 'Please wait...'
              : mode === 'register'
                ? 'Create Account'
                : mode === 'forgot'
                  ? 'Send Reset Link'
                  : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password Link */}
        {mode === 'login' && (
          <div className="mt-3 text-center">
            <button
              onClick={() => {
                setMode('forgot');
                setError('');
                setSuccess('');
              }}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* OAuth Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-slate-500 text-xs uppercase font-medium">Or continue with</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* OAuth Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleOAuth('github')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-all border border-white/5"
              >
                <Github size={18} />
                <span className="text-sm font-medium">GitHub</span>
              </button>
              <button
                onClick={() => handleOAuth('google')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-all border border-white/5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
            </div>
          </>
        )}

        {/* Mode Toggle */}
        <div className="mt-8 text-center">
          {mode === 'forgot' ? (
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Back to Sign In
            </button>
          ) : (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {mode === 'login'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
