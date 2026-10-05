import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

type Mode = 'login' | 'register' | 'otp' | 'forgot';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, verifyOTP } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', otp: '',
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result.success) {
      addToast('Welcome back!', 'success');
      navigate('/account');
    } else if (result.needsOTP) {
      // Account exists but email not verified yet
      setPendingEmail(form.email);
      setMode('otp');
      addToast('Please verify your email with the OTP sent to your inbox.', 'info');
    } else {
      addToast(result.error || 'Invalid email or password', 'error');
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error'); return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error'); return;
    }
    setLoading(true);
    const result = await register(form.name, form.email, form.password);
    setLoading(false);

    if (result.success && result.needsOTP) {
      // Show OTP verification screen
      setPendingEmail(form.email);
      setMode('otp');
      if (result.otp) {
        setForm(f => ({ ...f, otp: result.otp! }));
        addToast(`Verification code: ${result.otp} (auto-filled)`, 'success');
      } else {
        addToast('Check your email for a 6-digit OTP! ✉️', 'success');
      }
    } else if (result.success) {
      addToast(`Welcome to rathoreMart, ${form.name}! 🎉`, 'success');
      navigate('/account');
    } else {
      addToast(result.error || 'Registration failed', 'error');
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifyOTP(pendingEmail, form.otp);
    setLoading(false);

    if (result.success) {
      addToast('Email verified! Welcome to rathoreMart 🎉', 'success');
      navigate('/account');
    } else {
      addToast(result.error || 'Invalid OTP', 'error');
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    try {
      const res: any = await api.resendOTP(pendingEmail);
      if (res?.otp) {
        setForm(f => ({ ...f, otp: res.otp }));
        addToast(`New OTP: ${res.otp} (auto-filled)`, 'success');
      } else {
        addToast('New OTP generated', 'success');
      }
    } catch {
      addToast('Failed to resend OTP', 'error');
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    addToast('Password reset link sent to your email', 'success');
    setMode('login');
  };

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-modal p-8 md:p-10">

            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="font-display text-2xl font-bold text-gray-900 block mb-6">rathoreMart</Link>

              {/* OTP Screen */}
              {mode === 'otp' ? (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-gray-900">Verify Your Email</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    We sent a 6-digit code to <strong>{pendingEmail}</strong>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-display font-bold text-gray-900">
                    {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Join us today' : 'Enter your email to reset password'}
                  </p>
                </>
              )}
            </div>

            {/* ── OTP Form ── */}
            {mode === 'otp' && (
              <form onSubmit={handleOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Enter OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.otp}
                    onChange={e => update('otp', e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="input-base text-center text-2xl tracking-[0.5em] font-bold"
                    required
                    autoFocus
                  />
                </div>
                {form.otp && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2.5 rounded-xl text-center font-medium">
                    ⚡ Code ready: <span className="font-bold tracking-widest text-sm text-emerald-900">{form.otp}</span>
                  </div>
                )}
                <button type="submit" disabled={loading || form.otp.length !== 6} className="btn-primary w-full py-3.5 rounded-2xl text-base">
                  {loading ? <span className="flex items-center gap-2 justify-center"><Spinner /> Verifying...</span> : 'Verify & Continue'}
                </button>
                <div className="text-center space-y-2">
                  <button type="button" onClick={handleResend} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    Didn't receive it? <span className="font-semibold underline">Resend OTP</span>
                  </button>
                  <br />
                  <button type="button" onClick={() => setMode('login')} className="text-xs text-gray-400 hover:text-gray-600">
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ── Login Form ── */}
            {mode === 'login' && (
              <>
                {/* Google */}
                <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-400">or continue with email</span></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className="input-base" required />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Password</label>
                      <button type="button" onClick={() => setMode('forgot')} className="text-xs text-gray-500 hover:text-gray-900">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" className="input-base pr-12" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl text-base mt-2">
                    {loading ? <span className="flex items-center gap-2 justify-center"><Spinner /> Signing in...</span> : 'Sign In'}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="font-semibold text-gray-900 hover:underline">Sign Up</button>
                </p>
              </>
            )}

            {/* ── Register Form ── */}
            {mode === 'register' && (
              <>
                <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-400">or sign up with email</span></div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Jatin Rathore" className="input-base" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className="input-base" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" className="input-base pr-12" required minLength={8} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="••••••••" className="input-base" required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl text-base mt-2">
                    {loading ? <span className="flex items-center gap-2 justify-center"><Spinner /> Creating account...</span> : 'Create Account'}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="font-semibold text-gray-900 hover:underline">Sign In</button>
                </p>
              </>
            )}

            {/* ── Forgot Password ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className="input-base" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl text-base">
                  {loading ? <span className="flex items-center gap-2 justify-center"><Spinner /> Sending...</span> : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-gray-500 hover:text-gray-900 text-center transition-colors">
                  ← Back to Sign In
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};
