import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface AuthViewProps {
  theme: 'dark' | 'light';
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  error: string | null;
  formError: string | null;
  setFormError: (error: string | null) => void;
  actionLoading: boolean;
  lastUser: any;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleGoogleSignIn: () => void;
  onCancel: () => void;
  onContinueAs: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  theme,
  isSignUp,
  setIsSignUp,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  formError,
  setFormError,
  actionLoading,
  lastUser,
  handleAuthSubmit,
  handleGoogleSignIn,
  onCancel,
  onContinueAs
}) => {
  return (
    <motion.div 
      key="credentials-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      id="auth-access-gateway-panel"
      className={`w-full h-[100dvh] md:h-auto md:max-w-[450px] p-6 md:p-10 flex flex-col justify-between md:justify-center ${
        theme === 'dark' 
          ? 'text-[#F8FAFC]' 
          : 'text-[#2b313f]'
      }`}
    >
      {/* Header Controls (Mobile back-to-onboarding action) */}
      <div className="flex items-center justify-between border-b border-[#ff2d51]/5 pb-3 mb-4 shrink-0">
        <button
          id="auth-form-back-btn"
          onClick={onCancel}
          className="flex items-center gap-1 text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]"
        >
          <ChevronLeft size={16} />
          Onboarding
        </button>
        <span className="text-[10px] font-space font-black opacity-30 uppercase tracking-[0.2em]">Registry</span>
        <div className="w-8"></div>
      </div>

      {/* Middle Scroll-Free Credentials Entry Form */}
      <div className="flex-1 flex flex-col justify-center gap-5 my-2">
        <div className="text-left space-y-1.5">
          <span className="text-[10px] font-space font-bold uppercase tracking-[0.25em] text-[#ff2d51]">
            Access Gateway
          </span>
          <h2 className="text-2xl md:text-3xl font-black font-space uppercase tracking-tight mt-0.5 select-none">
            {isSignUp ? "Create Profile" : "Secure Log In"}
          </h2>
          <p className="text-xs opacity-65 leading-snug">
            {isSignUp ? "Connect your credentials to lock-in onboarding styles." : "Welcome back. Authenticate to sync your curators feed."}
          </p>
        </div>

        {/* Display validation errors clearly */}
        {error && (
          <div className="p-3 bg-[#ff2d51]/10 border border-[#ff2d51]/20 text-[10px] font-semibold uppercase tracking-wider text-[#ff2d51] rounded-sm text-left">
            {error}
          </div>
        )}

        {formError && (
          <div className="p-3 bg-[#ff2d51]/10 border border-[#ff2d51]/20 text-[10px] font-semibold uppercase tracking-wider text-[#ff2d51] rounded-sm text-left">
            {formError}
          </div>
        )}

        {/* Continue as feature on login panel */}
        {lastUser && (
          <button
            type="button"
            id="gateway-continue-as-btn"
            disabled={actionLoading}
            onClick={onContinueAs}
            className="w-full flex items-center justify-between p-3 border border-[#ff2d51]/20 bg-[#ff2d51]/5 rounded-sm hover:bg-[#ff2d51]/10 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={lastUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${lastUser.id}`}
                alt={lastUser.username}
                className="w-8 h-8 rounded-sm bg-[#ff2d51]/10 border border-black/10 shrink-0"
              />
              <div>
                <div className="text-[9px] font-space font-bold uppercase tracking-wider text-[#ff2d51]">Continue as</div>
                <div className="text-xs font-space font-bold uppercase tracking-tight">@{lastUser.username}</div>
              </div>
            </div>
            <span className="text-[#ff2d51] text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              Go <ArrowRight size={14} />
            </span>
          </button>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
          <Input
            id="auth-email-field"
            type="email"
            placeholder="EMAIL ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={actionLoading}
            required
            className="py-3 px-4 text-xs h-14 md:h-12"
          />

          <Input
            id="auth-password-field"
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={actionLoading}
            required
            className="py-3 px-4 text-xs h-14 md:h-12"
          />

          {isSignUp && (
            <Input
              id="auth-confirm-password-field"
              type="password"
              placeholder="CONFIRM PASSWORD"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={actionLoading}
              required
              className="py-3 px-4 text-xs h-14 md:h-12"
            />
          )}

          <Button 
            id="credentials-auth-actuator" 
            variant="primary" 
            type="submit" 
            loading={actionLoading}
            className="py-3.5 mt-2 h-14 md:h-12 flex items-center justify-center font-bold text-xs"
          >
            {isSignUp ? "Sign Up & Sync Profile" : "Log In & Proceed"}
          </Button>
        </form>

        {/* Alternate Google Sign-in */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#ff2d51]/10"></div>
          <span className="flex-shrink mx-4 text-[9px] font-space font-bold uppercase tracking-widest opacity-40">Or Use Google</span>
          <div className="flex-grow border-t border-[#ff2d51]/10"></div>
        </div>

        <button
          id="auth-google-alternate-btn"
          type="button"
          disabled={actionLoading}
          onClick={handleGoogleSignIn}
          className={`w-full flex items-center justify-center gap-2.5 py-3 border-[1.5px] font-space font-bold uppercase text-[10px] tracking-widest transition-all h-14 md:h-12 rounded-sm active:scale-[0.98] duration-200 ${
            theme === 'dark'
              ? 'border-white/15 bg-white/5 text-[#F8FAFC] hover:bg-white/10'
              : 'border-[#2b313f]/15 bg-white text-[#2b313f] hover:bg-gray-100 hover:text-[#2b313f] shadow-sm'
          } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" className="inline align-middle shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button
          id="auth-credentials-cancel-btn"
          type="button"
          onClick={onCancel}
          className="text-[10px] uppercase font-space font-bold tracking-widest text-gray-400 hover:text-gray-300 transition-colors mt-1 mx-auto block"
        >
          ← Cancel & Go Back
        </button>
      </div>

      {/* Footer toggles for switching views */}
      <div className="pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 border-t border-[#ff2d51]/5 text-center shrink-0">
        {isSignUp ? (
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">
            Already registered?{' '}
            <button 
              id="toggle-to-login-view"
              onClick={() => { setIsSignUp(false); setFormError(null); }}
              className="text-[#ff2d51] underline underline-offset-4 hover:opacity-85 font-black shrink-0"
            >
              Log In Here
            </button>
          </p>
        ) : (
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">
            New Designer?{' '}
            <button 
              id="toggle-to-signup-view"
              onClick={() => { setIsSignUp(true); setFormError(null); }}
              className="text-[#ff2d51] underline underline-offset-4 hover:opacity-85 font-black shrink-0"
            >
              Create Account
            </button>
          </p>
        )}
      </div>
    </motion.div>
  );
};
