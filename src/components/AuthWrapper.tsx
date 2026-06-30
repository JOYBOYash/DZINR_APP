import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { OnboardingFlow } from './OnboardingFlow';
import { AuthView } from './AuthView';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useToastStore } from '../stores/toast.store';
import { Shield, X } from 'lucide-react';
import { Button } from './Button';

interface AuthWrapperProps {
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  lastUser: any;
  toggleTheme: () => void;
  deferredPrompt: any;
  isPwaInstalled: boolean;
  installApp: () => void;
  children: React.ReactNode;
}

const getFriendlyAuthError = (err: any): string => {
  const code = err?.code || err?.message || '';
  if (code.includes('auth/email-already-in-use')) return "This email address is already registered with another profile.";
  if (code.includes('auth/invalid-email')) return "The email address format is invalid. Please check and try again.";
  if (code.includes('auth/operation-not-allowed')) return "Email & Password login is not enabled in Firebase Authentication.";
  if (code.includes('auth/weak-password')) return "The password is too weak. Please use at least 6 characters.";
  if (code.includes('auth/user-disabled')) return "This designer account has been disabled. Contact support.";
  if (code.includes('auth/user-not-found')) return "No profile exists with this email address. Please sign up.";
  if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) return "Incorrect email or password. Please try again.";
  if (code.includes('popup-closed-by-user')) return "The sign-in popup was closed before completing authentication.";
  if (code.includes('cancelled-popup-request')) return "Another sign-in request was started. Please try again.";
  return err?.message || "Authentication failed. Please check your credentials.";
};

export const AuthWrapper: React.FC<AuthWrapperProps> = ({
  isAuthenticated,
  theme,
  lastUser,
  toggleTheme,
  deferredPrompt,
  isPwaInstalled,
  installApp,
  children
}) => {
  const { setError, setFirebaseUser, setLoading } = useAuthStore();
  const { showToast } = useToastStore();
  
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showRetryLoginPopup, setShowRetryLoginPopup] = useState(false);
  const [retryLoginErrorMessage, setRetryLoginErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setActionLoading(true);
      setLoading(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setShowAuthForm(true);
      setIsSignUp(false);
      setRetryLoginErrorMessage(getFriendlyAuthError(err));
      setShowRetryLoginPopup(true);
      setLoading(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (isSignUp && password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      if (isSignUp) {
        const user = await authService.signUpWithEmail(email, password);
        if (user && user.email) {
          await authService.sendCustomVerificationEmail(user.email).catch((e) => {
            console.warn("Failed to send signup verification email:", e);
          });
        }
        setFirebaseUser(user);
      } else {
        const { userService } = await import('../services/user.service');
        const emailExists = await userService.checkEmailExists(email);
        if (!emailExists) {
          showToast('No profile exists with this email address. Please sign up.', 'error');
          return;
        }
        const user = await authService.signInWithEmail(email, password);
        if (user && !user.emailVerified && user.email) {
          await authService.sendCustomVerificationEmail(user.email).catch((e) => {
            console.warn("Failed to send login verification email:", e);
          });
        }
        setFirebaseUser(user);
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err.code || err);
      showToast(getFriendlyAuthError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="w-full flex items-center justify-center">
        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {!showAuthForm ? (
              <OnboardingFlow 
                key="onboarding"
                theme={theme}
                lastUser={lastUser}
                onToggleTheme={toggleTheme}
                deferredPrompt={deferredPrompt}
                isPwaInstalled={isPwaInstalled}
                onInstallPwa={installApp}
                onContinueAs={async () => {
                  if (lastUser?.providerId === 'google.com') {
                    await handleGoogleSignIn();
                  } else if (lastUser) {
                    setEmail(lastUser.email);
                    setIsSignUp(false);
                    setShowAuthForm(true);
                  }
                }}
                onGoToLogin={() => {
                  setIsSignUp(false);
                  setShowAuthForm(true);
                }}
                onSelectAuth={(method) => {
                  if (method === 'google') {
                    handleGoogleSignIn();
                  } else {
                    setIsSignUp(true);
                    setShowAuthForm(true);
                  }
                }}
              />
            ) : (
              <AuthView
                key="auth-view"
                theme={theme}
                isSignUp={isSignUp}
                setIsSignUp={setIsSignUp}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                error={null}
                actionLoading={actionLoading}
                lastUser={lastUser}
                handleAuthSubmit={handleAuthSubmit}
                handleGoogleSignIn={handleGoogleSignIn}
                onCancel={() => {
                  setShowAuthForm(false);
                }}
                onContinueAs={async () => {
                  if (lastUser?.providerId === 'google.com') {
                    await handleGoogleSignIn();
                  } else if (lastUser) {
                    setEmail(lastUser.email);
                    setIsSignUp(false);
                  }
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showRetryLoginPopup && (
          <div 
            id="pwa-retry-login-popup-overlay"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div 
              id="pwa-retry-login-popup-backdrop"
              onClick={() => setShowRetryLoginPopup(false)}
              className="absolute inset-0 bg-[#000000]/75 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative z-10 w-full max-w-sm p-6 sm:p-8 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-2xl text-left"
            >
              {/* Close Button */}
              <button
                id="pwa-retry-login-popup-close-btn"
                type="button"
                onClick={() => setShowRetryLoginPopup(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full border border-[#ECECEC] dark:border-white/10 text-[#888888] hover:text-accent dark:hover:text-white bg-white/5 cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="flex flex-col items-center text-center gap-5">
                {/* Broken Error Image */}
                <div className="w-48 h-auto mb-2 flex items-center justify-center">
                  <img 
                    src={theme === 'dark' ? '/broken-error-d.svg' : '/broken-error-l.svg'} 
                    alt="Authentication interrupted"
                    className="w-full h-auto object-contain drop-shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-space font-bold text-base uppercase tracking-wider text-accent">
                    Sign-In Interrupted
                  </h3>
                  <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                    Your Google authentication was closed or cancelled before it could complete successfully.
                  </p>
                </div>

                {retryLoginErrorMessage && (
                  <div className="w-full p-3 border border-accent/20 bg-accent/5 text-accent text-xs font-mono text-left rounded-[18px]">
                    {retryLoginErrorMessage}
                  </div>
                )}

                {/* Retry Options */}
                <div className="flex flex-col w-full gap-2.5 mt-2">
                  <Button
                    id="pwa-retry-google-btn"
                    onClick={() => {
                      setShowRetryLoginPopup(false);
                      handleGoogleSignIn();
                    }}
                    variant="primary"
                    className="w-full h-11"
                  >
                    Retry Google Login
                  </Button>
                  <Button
                    id="pwa-retry-dismiss-btn"
                    onClick={() => setShowRetryLoginPopup(false)}
                    variant="secondary"
                    className="w-full h-11"
                  >
                    Use Email Instead
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
