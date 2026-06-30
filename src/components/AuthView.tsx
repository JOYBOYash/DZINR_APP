import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { USER_REVIEWS } from '../constants/reviews';

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
  actionLoading,
  lastUser,
  handleAuthSubmit,
  handleGoogleSignIn,
  onCancel,
  onContinueAs
}) => {
  const [activeField, setActiveField] = useState<'email' | 'password' | 'confirm'>('email');

  const columnsReviews = [
    [...USER_REVIEWS, ...USER_REVIEWS],
    [...USER_REVIEWS, ...USER_REVIEWS].reverse(),
    [...USER_REVIEWS, ...USER_REVIEWS],
    [...USER_REVIEWS, ...USER_REVIEWS].reverse(),
  ];

  return (
    <motion.div 
      key="credentials-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      id="auth-access-gateway-panel"
      className="relative flex flex-col items-center justify-center flex-1 w-full min-h-[100dvh] py-6 sm:py-8 px-4 overflow-y-auto overflow-x-hidden"
    >
      {/* IMMERSIVE BACKGROUND SCROLLING MARQUEE OF REVIEWS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute -top-36 -left-[15vw] -right-[15vw] w-[130vw] h-[130vh] rotate-[-12deg] scale-105 origin-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-6 pt-4 h-full w-full opacity-60 dark:opacity-50">
            {columnsReviews.map((colItems, colIdx) => {
              const isEven = colIdx % 2 === 0;
              const yAnimation = isEven ? ["0%", "-50%"] : ["-50%", "0%"];
              const duration = 38 + colIdx * 10;

              return (
                <motion.div
                  key={`rev-col-${colIdx}`}
                  className={`flex flex-col gap-4 shrink-0 ${
                    colIdx === 2 ? 'hidden sm:flex' : colIdx === 3 ? 'hidden md:flex' : 'flex'
                  }`}
                  animate={{ y: yAnimation }}
                  transition={{
                    ease: "linear",
                    duration: duration,
                    repeat: Infinity,
                  }}
                >
                  {colItems.map((item, itemIdx) => (
                    <div
                      key={`rev-col-${colIdx}-item-${item.id}-${itemIdx}`}
                      className="p-4 bg-white dark:bg-surface-dark border border-[#ECECEC]/30 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col gap-2.5 shrink-0"
                    >
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <span key={i} className="text-[10px]">★</span>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#171717]/80 dark:text-white/80 leading-relaxed italic">
                        "{item.comment}"
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-6 h-6 rounded-full object-cover border border-[#ECECEC]/50 dark:border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-[9px] font-bold font-space text-[#171717] dark:text-white leading-none">
                            {item.name}
                          </h4>
                          <p className="text-[8px] text-[#888888] dark:text-[#A9A9A9] leading-none mt-0.5">
                            {item.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* MASTER ULTRA-LUXE GRADIENT MASKS */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcf5e2] via-[#fcf5e2]/20 to-[#fcf5e2] dark:from-[#4A0517] dark:via-[#4A0517]/20 dark:to-[#4A0517] z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,#fcf5e2_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_45%,#4A0517_100%)] z-10 pointer-events-none opacity-80" />
      </div>

      {/* PRISTINE FOREGROUND LAYER - COMPLETELY CARDLESS / BOXLESS */}
      <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center justify-center text-center">
        {/* Logo Brand Identifier */}
        <div className="mb-1 sm:mb-4">
          <img 
            src="/wordmark-logo.svg" 
            className="h-7 sm:h-9 drop-shadow-md svg-theme-color" 
            alt="Dzinr" 
          />
        </div>

        <div className="w-full flex flex-col items-center gap-1.5 sm:gap-3">
          <div className="text-center space-y-0.5 sm:space-y-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight leading-tight select-none">
              {isSignUp ? "Create Profile" : "Secure Log In"}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed max-w-xs mx-auto">
              {isSignUp ? "Connect your credentials to lock-in onboarding styles." : "Welcome back. Authenticate to sync your curators feed."}
            </p>
          </div>

          {/* Last user memory shortcut */}
          {lastUser && (
            <button
              type="button"
              id="gateway-continue-as-btn"
              disabled={actionLoading}
              onClick={onContinueAs}
              className="w-full max-w-[320px] flex items-center justify-between p-2.5 sm:p-3 border border-[#ECECEC] dark:border-white/10 bg-white/90 dark:bg-surface-dark/95 text-[#171717] dark:text-white rounded-[18px] hover:opacity-90 transition-opacity text-left cursor-pointer shadow-md backdrop-blur-sm animate-pulse-subtle"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#ECECEC] dark:border-white/10 bg-white/10 dark:bg-black/5 flex items-center justify-center shrink-0">
                  <img
                    src={lastUser.avatarUrl || (theme === 'dark' ? '/avatar-d.svg' : '/avatar-l.svg')}
                    alt={lastUser.username}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-[8px] font-mono uppercase tracking-wider opacity-60">Continue as</div>
                  <div className="text-xs font-sans font-medium">@{lastUser.username}</div>
                </div>
              </div>
              <span className="text-xs font-bold tracking-tight flex items-center gap-0.5 shrink-0">
                Go <ArrowRight size={12} />
              </span>
            </button>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-2 w-full max-w-[320px] text-left">
            {/* Email Field */}
            <div className="w-full">
              {activeField === 'email' ? (
                <Input
                  id="auth-email-field"
                  type="email"
                  label="Email Address"
                  placeholder="designer@dzinr.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === 'Tab') && email) {
                      e.preventDefault();
                      setActiveField('password');
                    }
                  }}
                  disabled={actionLoading}
                  className="bg-[#fcf5e2]/80 dark:bg-[#4A0517]/80 backdrop-blur-sm"
                  autoFocus
                />
              ) : (
                <button 
                  type="button" 
                  onClick={() => setActiveField('email')}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[#ECECEC] dark:border-white/10 rounded-[18px] flex items-center justify-between cursor-pointer backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/40 text-left transition-all"
                >
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-[10px] font-sans font-medium text-[#555555] dark:text-[#D7D7D7] mb-0.5">Email Address</span>
                    <span className="text-sm font-sans text-[#171717] dark:text-white truncate">
                      {email || "designer@dzinr.app"}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-accent shrink-0 font-bold bg-accent/10 px-2 py-0.5 rounded-full">Edit</span>
                </button>
              )}
            </div>

            {/* Password Field */}
            <div className="w-full">
              {activeField === 'password' ? (
                <Input
                  id="auth-password-field"
                  type="password"
                  label="Security Password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      if (isSignUp) {
                        e.preventDefault();
                        setActiveField('confirm');
                      }
                    } else if (e.key === 'Enter' && password && password.length >= 6) {
                      if (isSignUp) {
                        e.preventDefault();
                        setActiveField('confirm');
                      } else {
                        // Let the form submit handle it if it's sign in
                      }
                    }
                  }}
                  disabled={actionLoading}
                  onPaste={(e) => e.preventDefault()}
                  error={password && password.length > 0 && password.length < 6 ? "Password must be at least 6 characters" : undefined}
                  className="bg-[#fcf5e2]/80 dark:bg-[#4A0517]/80 backdrop-blur-sm"
                  autoFocus
                />
              ) : (
                <button 
                  type="button" 
                  onClick={() => setActiveField('password')}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[#ECECEC] dark:border-white/10 rounded-[18px] flex items-center justify-between cursor-pointer backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/40 text-left transition-all"
                >
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-[10px] font-sans font-medium text-[#555555] dark:text-[#D7D7D7] mb-0.5">Security Password</span>
                    <span className="text-sm font-sans text-[#171717] dark:text-white truncate">
                      {password ? "••••••••" : "Min. 6 characters"}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-accent shrink-0 font-bold bg-accent/10 px-2 py-0.5 rounded-full">Edit</span>
                </button>
              )}
            </div>

            {/* Confirm Password Field */}
            {isSignUp && (
              <div className="w-full">
                {activeField === 'confirm' ? (
                  <Input
                    id="auth-confirm-password-field"
                    type="password"
                    label="Confirm Password"
                    placeholder="Confirm security password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={actionLoading}
                    onPaste={(e) => e.preventDefault()}
                    error={confirmPassword && confirmPassword.length > 0 && password !== confirmPassword ? "Passwords do not match" : undefined}
                    className="bg-[#fcf5e2]/80 dark:bg-[#4A0517]/80 backdrop-blur-sm"
                    autoFocus
                  />
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setActiveField('confirm')}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-[#ECECEC] dark:border-white/10 rounded-[18px] flex items-center justify-between cursor-pointer backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/40 text-left transition-all"
                  >
                    <div className="flex flex-col overflow-hidden mr-2">
                      <span className="text-[10px] font-sans font-medium text-[#555555] dark:text-[#D7D7D7] mb-0.5">Confirm Password</span>
                      <span className="text-sm font-sans text-[#171717] dark:text-white truncate">
                        {confirmPassword ? "••••••••" : "Confirm security password"}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-accent shrink-0 font-bold bg-accent/10 px-2 py-0.5 rounded-full">Edit</span>
                  </button>
                )}
              </div>
            )}

            <Button 
              id="credentials-auth-actuator" 
              variant="primary" 
              type="submit" 
              loading={actionLoading}
              className="w-full mt-4 shadow-lg shadow-accent/10"
            >
              {isSignUp ? "Sign Up & Sync Profile" : "Log In & Proceed"}
            </Button>
          </form>

          <div className="relative flex items-center py-1 w-full max-w-[320px]">
            <div className="flex-grow border-t border-[#ECECEC] dark:border-white/10"></div>
            <span className="flex-shrink-0 mx-3.5 text-[#888888] dark:text-[#A9A9A9] text-xs font-mono uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-[#ECECEC] dark:border-white/10"></div>
          </div>

          <button
            id="auth-google-alternate-btn"
            type="button"
            disabled={actionLoading}
            onClick={handleGoogleSignIn}
            className="w-full max-w-[320px] flex items-center justify-center gap-3 py-3.5 border border-[#ECECEC] dark:border-white/10 bg-white/90 dark:bg-surface-dark/95 text-[#171717] dark:text-white hover:bg-[#ECECEC] dark:hover:bg-white/5 rounded-[18px] font-sans font-medium text-sm transition-all duration-200 cursor-pointer shadow-md backdrop-blur-sm disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="w-full text-center">
            {isSignUp ? (
              <p className="text-xs font-sans text-[#555555] dark:text-[#D7D7D7]">
                Already registered?{' '}
                <button 
                  id="toggle-to-login-view"
                  onClick={() => { setIsSignUp(false); }}
                  className="text-accent hover:text-accent-hover font-semibold underline underline-offset-4 ml-1 cursor-pointer"
                >
                  Log In Here
                </button>
              </p>
            ) : (
              <p className="text-xs font-sans text-[#555555] dark:text-[#D7D7D7]">
                New Designer?{' '}
                <button 
                  id="toggle-to-signup-view"
                  onClick={() => { setIsSignUp(true); }}
                  className="text-accent hover:text-accent-hover font-semibold underline underline-offset-4 ml-1 cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

          <button
            id="auth-credentials-cancel-btn"
            type="button"
            onClick={onCancel}
            className="text-xs font-space font-semibold tracking-wider text-[#888888] dark:text-[#A9A9A9] hover:text-accent transition-colors mt-2.5 mx-auto block py-2 cursor-pointer"
          >
            ← CANCEL & GO BACK
          </button>
        </div>
      </div>
    </motion.div>
  );
};
