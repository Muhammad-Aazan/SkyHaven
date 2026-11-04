import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, Lock, User as UserIcon, Eye, EyeOff,
  ArrowRight, ShieldCheck, RefreshCw, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { OtpInput } from './OtpInput';
import { authApi } from '../../api/client';

export type AuthView = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  onAuthSuccess?: (mode: 'login' | 'signup') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
  onAuthSuccess
}) => {
  const { login, signup, verifyOtp, completeSignup } = useAuth();
  const [view, setView] = useState<AuthView>(initialView);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setView(initialView);
    setErrorMessage('');
    setSuccessMessage('');
  }, [initialView, isOpen]);

  // Cooldown timer countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email, password);
      onClose();
      onAuthSuccess?.('login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await signup(name, email, password);
      setTempToken(res.tempToken);
      setCooldown(60);
      setView('verify');
      if (res.otpResent) {
        setSuccessMessage(`⚠️ This email already has a pending signup. A new verification code was sent to ${email}. Check your inbox & spam.`);
      } else {
        setSuccessMessage(`A 6-digit verification code was dispatched to ${email}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await verifyOtp(email, otp);
      if (result.verified) {
        // Use the real verificationToken from the backend; fall back to the tempToken we got at signup
        const tokenToUse = result.verificationToken || tempToken;
        await completeSignup(name, email, tokenToUse);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onClose();
        onAuthSuccess?.('signup');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      await authApi.resendOtp(email);
      setCooldown(60);
      setSuccessMessage('Fresh code sent to your inbox');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.forgotPassword(email);
      setSuccessMessage(res.message || `Password reset code sent to ${email}`);
      setView('reset');
      setCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit code sent to your email');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.resetPassword({ email, otp: resetOtp, newPassword });
      setSuccessMessage(res.message || 'Password updated successfully! Please log in.');
      setView('login');
      setPassword('');
      setResetOtp('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed. Please check your code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      await authApi.forgotPassword(email);
      setSuccessMessage(`Fresh reset code sent to ${email}`);
      setCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm"
        />

        {/* Modal Dialog (Figma 2-Column Split: Form on Left, Brand Testimonial on Right) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl bg-white border border-[#CBD5E1] rounded-3xl shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 min-h-[580px]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-slate-100 rounded-full text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Form Area (7 cols on desktop) */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header brand */}
              <div className="flex items-center mb-6">
                <img src="/logo.png" alt="SkyHeaven" className="h-12 w-auto object-contain" />
              </div>

              {/* Feedback Alert */}
              {errorMessage && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl space-y-1.5">
                  <div className="font-semibold">{errorMessage}</div>
                  {(errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exists')) && (
                    <div className="flex items-center gap-3 pt-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => { setView('login'); setErrorMessage(''); }}
                        className="text-[#0061FE] hover:underline"
                      >
                        Log in now →
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setErrorMessage(''); }}
                        className="text-slate-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 rounded-xl">
                  {successMessage}
                </div>
              )}

              {/* 1. VIEW: LOG IN */}
              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
                      Welcome back.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Good to see you. Your workspace is waiting.
                    </p>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Google sign-in is coming soon. Please use your email and password.');
                    }}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] transition-colors flex items-center justify-center gap-2.5 shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center my-3 text-[11px] text-[#94A3B8]">
                    <div className="flex-1 border-t border-[#E2E8F0]" />
                    <span className="px-3">or continue with email</span>
                    <div className="flex-1 border-t border-[#E2E8F0]" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-[#334155]">Password</label>
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-xs font-semibold text-[#0061FE] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 pr-10 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-[#94A3B8] hover:text-[#475569] absolute right-2.5 top-2"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
                  >
                    {isLoading ? 'Signing in...' : 'Log in'}
                  </button>

                  <p className="text-center text-xs text-[#64748B] pt-2">
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => setView('signup')}
                      className="text-[#0061FE] font-semibold hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              )}

              {/* 2. VIEW: SIGN UP */}
              {view === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
                      A fresh start for your files.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Create your account. Get 25 GB of breathing room.
                    </p>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('Google sign-up is coming soon. Please enter your name, email, and password below.');
                    }}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] transition-colors flex items-center justify-center gap-2.5 shadow-xs"
                  >
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center my-3 text-[11px] text-[#94A3B8]">
                    <div className="flex-1 border-t border-[#E2E8F0]" />
                    <span className="px-3">or continue with email</span>
                    <div className="flex-1 border-t border-[#E2E8F0]" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muhammad Aazan"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 pr-10 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-[#94A3B8] hover:text-[#475569] absolute right-2.5 top-2"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-1">
                      Strong password · 12+ characters, a number, and a symbol
                    </p>
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
                  >
                    {isLoading ? 'Sending verification code...' : 'Create free account'}
                  </button>

                  <p className="text-center text-xs text-[#64748B] pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-[#0061FE] font-semibold hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </form>
              )}

              {/* 3. VIEW: VERIFY OTP */}
              {view === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
                      Check your inbox.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Enter the 6-digit code we sent to <span className="font-semibold text-[#0F172A]">{email}</span>.
                    </p>
                  </div>

                  <div className="py-2">
                    <OtpInput value={otp} onChange={setOtp} />
                  </div>

                  <p className="text-xs text-[#64748B]">
                    Code expires in 09:42. Keep this window open.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full py-3 px-4 bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
                  >
                    {isLoading ? 'Verifying...' : 'Verify email'}
                  </button>

                  <div className="text-xs text-[#64748B] space-y-1.5 pt-2">
                    <p>
                      Didn’t get a code?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={cooldown > 0}
                        className="text-[#0061FE] font-semibold hover:underline disabled:opacity-50"
                      >
                        {cooldown > 0 ? `Resend in 00:${cooldown.toString().padStart(2, '0')}` : 'Resend code'}
                      </button>
                    </p>
                    <p>
                      Wrong email?{' '}
                      <button
                        type="button"
                        onClick={() => setView('signup')}
                        className="text-[#0061FE] font-semibold hover:underline"
                      >
                        Change email address
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* 4. VIEW: FORGOT PASSWORD */}
              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
                      Let’s get you back in.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Enter your email and we’ll send a secure reset link.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
                  >
                    {isLoading ? 'Sending link...' : 'Send reset code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-xs font-semibold text-[#0061FE] hover:underline block pt-2"
                  >
                    ← Back to log in
                  </button>
                </form>
              )}

              {/* 5. VIEW: RESET PASSWORD (ENTER OTP + NEW PASSWORD) */}
              {view === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
                      Create new password
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong> and your new password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-2">6-Digit Reset Code</label>
                    <OtpInput value={resetOtp} onChange={setResetOtp} length={6} disabled={isLoading} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0061FE]/20 focus:border-[#0061FE] transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || resetOtp.length < 6}
                    className="w-full py-3 px-4 bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating password...' : 'Set New Password'}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      disabled={cooldown > 0 || isLoading}
                      onClick={handleResendResetOtp}
                      className="text-xs font-semibold text-[#0061FE] hover:underline disabled:text-slate-400"
                    >
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-xs font-semibold text-[#64748B] hover:underline"
                    >
                      ← Back to log in
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom mini footer in form */}
            <div className="pt-6 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>© 2026 Skyhaven</span>
              <div className="flex gap-3">
                <a href="#" className="hover:underline">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:underline">Help</a>
              </div>
            </div>
          </div>

          {/* Right Brand & Testimonial Column in Figma (5 cols on desktop) */}
          <div className="md:col-span-5 bg-[#0F172A] p-8 sm:p-10 text-white flex flex-col justify-between hidden md:flex border-l border-slate-800">
            <div className="space-y-4">
              <span className="text-[11px] font-semibold text-[#60A5FA] uppercase tracking-wider">
                SPACE TO DO YOUR BEST WORK
              </span>
              <h3 className="text-3xl font-bold tracking-tight text-white leading-tight">
                Less searching.<br />More making.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The files you need, the people you trust, and the space to bring your next idea to life.
              </p>
            </div>

            {/* Jordan Lee Testimonial in Figma */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <p className="text-sm font-medium text-slate-200 leading-snug">
                “Skyhaven gives our small team the clarity to do big things.”
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0061FE] text-white font-bold text-xs flex items-center justify-center">
                  JL
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Jordan Lee</p>
                  <p className="text-[10px] text-slate-400">Creative director, Northline Studio</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Trusted by 25,000+ teams who care about their work.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
