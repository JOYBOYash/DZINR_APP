import React, { useState, useEffect, FormEvent } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from './services/firebase';
import { authService } from './services/auth.service';
import { userService } from './services/user.service';
import { useAuthStore } from './stores/auth.store';
import { useOnboardingStore } from './stores/onboarding.store';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Button } from './components/Button';
import { LoadingState } from './components/LoadingState';
import { DashboardView } from './components/DashboardView';
import { AuthView } from './components/AuthView';
import { 
  Globe, 
  LogOut, 
  Moon, 
  Sun, 
  UserCheck, 
  Mail, 
  Shield, 
  Sparkles, 
  Zap, 
  User,
  Check,
  Compass,
  Award,
  TrendingUp,
  Heart,
  Smartphone,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOGO_URL = "https://dl.dropboxusercontent.com/scl/fi/3i6qc0yyzfvon6amb9md2/DZINR_LOGO.svg?rlkey=yjbgnkegl1ypfa6fr79usjol1";

const getFriendlyAuthError = (err: any): string => {
  const code = err?.code || err?.message || '';
  if (code.includes('auth/email-already-in-use')) {
    return "This email address is already registered with another profile.";
  }
  if (code.includes('auth/invalid-email')) {
    return "The email address format is invalid. Please check and try again.";
  }
  if (code.includes('auth/operation-not-allowed')) {
    return "Email & Password login is not enabled in Firebase Authentication. Please enable 'Email/Password' in your Firebase Console > Authentication > Sign-In Method.";
  }
  if (code.includes('auth/weak-password')) {
    return "The password is too weak. Please use at least 6 characters.";
  }
  if (code.includes('auth/user-disabled')) {
    return "This designer account has been disabled. Contact support.";
  }
  if (code.includes('auth/user-not-found')) {
    return "No profile exists with this email address. Please sign up.";
  }
  if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
    return "Incorrect email or password. Please try again.";
  }
  if (code.includes('popup-closed-by-user')) {
    return "The sign-in popup was closed before completing authentication.";
  }
  if (code.includes('cancelled-popup-request')) {
    return "Another sign-in request was started. Please try again.";
  }
  return err?.message || "Authentication failed. Please check your credentials.";
};

export default function App() {
  const {
    user,
    firebaseUser,
    loading,
    onboardingRequired,
    error,
    setUser,
    setFirebaseUser,
    setLoading,
    setOnboardingRequired,
    setError,
    reset
  } = useAuthStore();

  const onboardingStore = useOnboardingStore();

  // Navigation states
  const [showSplash, setShowSplash] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  // Credentials states
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Authenticating");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Theme settings ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dzinr_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Persisted last logged-in user state
  const [lastUser, setLastUser] = useState<any>(() => {
    const saved = localStorage.getItem('dzinr_last_user');
    return saved ? JSON.parse(saved) : null;
  });

  // PWA Prompt status
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showPostLoginInstallPopup, setShowPostLoginInstallPopup] = useState(false);
  const [showRetryLoginPopup, setShowRetryLoginPopup] = useState(false);
  const [retryLoginErrorMessage, setRetryLoginErrorMessage] = useState<string | null>(null);

  // Splash Screen Timeout (lasting 6.5 seconds with animation)
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 6500);
    return () => clearTimeout(splashTimer);
  }, []);

  // Monitor Auth Status changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setLoadingMessage(`Logging in as ${fbUser.displayName || fbUser.email || 'User'}`);
          setLoading(true);
          setFirebaseUser(fbUser);
          
          // Look up user document in Firestore users collection
          const profile = await userService.getUserProfile(fbUser.uid);
          if (profile) {
            setUser(profile);
            setOnboardingRequired(false);
            onboardingStore.clearOnboarding();

            const profileToSave = {
              username: profile.username,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
              id: profile.id,
              providerId: fbUser.providerData[0]?.providerId || 'password'
            };
            localStorage.setItem('dzinr_last_user', JSON.stringify(profileToSave));
            setLastUser(profileToSave);
          } else {
            // Profile does not exist yet. Create a profile using onboarding store answers or sensible defaults!
            const oStore = useOnboardingStore.getState();
            await handleSyncOnboardingWithFirestore(fbUser, oStore);
          }
        } else {
          reset();
        }
      } catch (err: any) {
        console.error("Auth status listener check error:", err);
        setError(getFriendlyAuthError(err));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Monitor Google redirect results for errors/successes
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Successfully authenticated via Google redirect:", result.user);
        }
      })
      .catch((err) => {
        console.warn("Google Redirect auth error or cancellation detected:", err);
        // User clicked off, closed, or redirect failed:
        // 1. Transfer to login page safely
        setShowAuthForm(true);
        setIsSignUp(false);
        // 2. Clear any loading states
        setLoading(false);
        setActionLoading(false);
        // 3. Trigger the retry login popup
        setRetryLoginErrorMessage(getFriendlyAuthError(err));
        setShowRetryLoginPopup(true);
      });
  }, []);

  // Monitor PWA installation hooks
  useEffect(() => {
    const catchPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', catchPrompt);

    const onAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', catchPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // Trigger PWA install popup after logging in if they haven't installed yet
  useEffect(() => {
    const isUserAuth = !!firebaseUser && !!user && !onboardingRequired;
    if (isUserAuth && !isPwaInstalled) {
      const dismissed = localStorage.getItem('dzinr_pwa_install_popup_dismissed') === 'true';
      if (!dismissed) {
        const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (deferredPrompt || isMobile) {
          const timer = setTimeout(() => {
            setShowPostLoginInstallPopup(true);
          }, 1500); // 1.5 seconds delay so they land on dashboard nicely first
          return () => clearTimeout(timer);
        }
      }
    } else {
      setShowPostLoginInstallPopup(false);
    }
  }, [firebaseUser, user, onboardingRequired, isPwaInstalled, deferredPrompt]);

  // Create profile and save onboarding options to Firestore
  const handleSyncOnboardingWithFirestore = async (fbUser: any, oStore: any) => {
    try {
      setActionLoading(true);
      const cleanUsername = (fbUser.displayName || fbUser.email?.split('@')[0] || 'designer')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 25);
      
      // Ensure unique username
      let usernameToCheck = cleanUsername;
      const isTaken = await userService.isUsernameTaken(usernameToCheck);
      if (isTaken) {
        usernameToCheck = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const newProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        username: usernameToCheck,
        bio: '',
        avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
        role: oStore.role || 'Brand Designer',
        inspirationStyles: oStore.inspirationStyles || [],
        preferredFormats: oStore.preferredFormats || [],
        goals: oStore.goals || [],
        discoverySource: oStore.discoverySource || 'Google Search',
        onboardingCompleted: true,
        createdAt: new Date().toISOString()
      };

      await userService.createUserProfile(newProfile);
      setUser(newProfile);
      setOnboardingRequired(false);
      oStore.clearOnboarding();

      const profileToSave = {
        username: newProfile.username,
        email: newProfile.email,
        avatarUrl: newProfile.avatarUrl,
        id: newProfile.id,
        providerId: fbUser.providerData[0]?.providerId || 'password'
      };
      localStorage.setItem('dzinr_last_user', JSON.stringify(profileToSave));
      setLastUser(profileToSave);
    } catch (err: any) {
      console.error("Onboarding profile write failed:", err);
      setError(getFriendlyAuthError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('dzinr_theme', next);
      return next;
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setFormError(null);
      setActionLoading(true);
      setLoadingMessage("Connecting to Google");
      setLoading(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      console.error("Popup login error caught:", err);
      // Transfer safely to login page
      setShowAuthForm(true);
      setIsSignUp(false);
      // Trigger the retry login popup modal
      setRetryLoginErrorMessage(getFriendlyAuthError(err));
      setShowRetryLoginPopup(true);
      setLoading(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!email.trim() || !password) {
      setFormError('All authentication credentials are required.');
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setFormError('Authentication passwords require a minimum of 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Password fields do not match.');
        return;
      }
    }

    try {
      setActionLoading(true);
      if (isSignUp) {
        setLoadingMessage(`Creating account for ${email.trim()}`);
      } else {
        setLoadingMessage(`Logging in as ${email.trim()}`);
      }
      setLoading(true);
      if (isSignUp) {
        await authService.signUpWithEmail(email.trim(), password);
      } else {
        await authService.signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(getFriendlyAuthError(err));
      setLoading(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoadingMessage(`Logging out as ${user?.username || firebaseUser?.email || 'User'}`);
      setLoading(true);
      await authService.logout();
      setShowAuthForm(false);
    } catch (err: any) {
      console.error("Logout runtime failure:", err);
    } finally {
      setLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // 1. SPLASH SCREEN (Lasts for 5-8 seconds with high-fidelity animation)
  if (showSplash) {
    return (
      <div 
        id="splash-screen-container"
        className="fixed inset-0 bg-[#2b313f] flex flex-col items-center justify-center z-50 text-[#F8FAFC] overflow-hidden"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 max-w-sm"
        >
          {/* Logo Frame with blinking logo and no background circle */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <motion.div 
              id="splash-logo-image"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              style={{
                maskImage: `url(${LOGO_URL})`,
                WebkitMaskImage: `url(${LOGO_URL})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center'
              }}
              className="w-24 h-24 bg-[#ff2d51] accent-glow relative z-10"
            />
          </div>

          <div className="flex flex-col gap-2 text-center">
            <motion.h1 
              initial={{ tracking: "0.1em", opacity: 0 }}
              animate={{ tracking: "0.3em", opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-2xl font-black font-space uppercase text-[#F8FAFC]"
            >
              DZINR
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="text-[10px] font-mono uppercase tracking-[0.2em]"
            >
              Curating Aesthetic Intelligence
            </motion.div>
          </div>

          {/* Loading status bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden relative">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-[#ff2d51]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5.5, ease: "easeInOut" }}
            />
          </div>

          {/* Infinity symbol loading below the loading bar */}
          <div className="mt-1 flex justify-center items-center h-8">
            <svg width="28" height="28" viewBox="0 0 24 24" className="text-[#ff2d51]/70" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <motion.path
                d="M12 12 C9 7.5, 4 7.5, 4 12 C4 16.5, 9 16.5, 12 12 C15 7.5, 20 7.5, 20 12 C20 16.5, 15 16.5, 12 12 Z"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ 
                  pathLength: [0.15, 0.45, 0.15],
                  pathOffset: [0, 1, 2]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
              />
            </svg>
          </div>
        </motion.div>
      </div>
    );
  }

  // Pre-load verification loader
  if (loading) {
    return <LoadingState id="application-preflight-loader" message={loadingMessage} />;
  }

  // DETERMINING WORKSPACE SCREEN VIEW
  const isAuthenticated = !!firebaseUser && !!user && !onboardingRequired;

  return (
    <div 
      id="app-root-theme-container"
      className={`min-h-screen relative flex flex-col justify-between transition-colors duration-500 font-sans ${
        theme === 'dark' 
          ? 'bg-[#2b313f] text-[#F8FAFC]' 
          : 'bg-[#e4efff] text-[#2b313f]'
      }`}
    >
      {/* 1. HEADER Segment */}
      <nav 
        id="theme-header-navigator"
        className={`${isAuthenticated ? 'flex' : 'hidden md:flex'} w-full px-6 md:px-12 py-5 justify-between items-center z-20 border-b ${
          theme === 'dark' ? 'border-white/5 bg-[#2b313f]/80' : 'border-black/5 bg-[#e4efff]/80'
        } backdrop-blur-md sticky top-0`}
      >
        <div className="flex items-center gap-3">
          <div 
            style={{
              maskImage: `url(${LOGO_URL})`,
              WebkitMaskImage: `url(${LOGO_URL})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center'
            }}
            className={`w-8 h-8 transition-all duration-300 ${theme === 'dark' ? 'bg-white' : 'bg-[#ff2d51]'}`}
          />
          <span className="text-lg font-black tracking-tighter uppercase font-space select-none">Dzinr</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="theme-switch-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme color"
            className={`p-2.5 rounded-full border transition-all ${
              theme === 'dark' 
                ? 'border-white/10 text-[#F8FAFC] hover:bg-white/10' 
                : 'border-black/10 text-[#2b313f] hover:bg-black/5'
            }`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {firebaseUser && (
            <button
              id="logout-header-btn"
              onClick={() => setShowLogoutConfirm(true)}
              className={`flex items-center gap-2 px-3 py-1.5 border font-space font-semibold uppercase text-[10px] tracking-wider transition-all rounded-sm ${
                theme === 'dark'
                  ? 'border-white/10 text-[#F8FAFC] hover:bg-[#ff2d51] hover:text-white hover:border-[#ff2d51]'
                  : 'border-black/10 text-[#2b313f] hover:bg-[#ff2d51] hover:text-white hover:border-[#ff2d51]'
              }`}
            >
              <LogOut size={11} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </nav>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <main className={`flex-1 w-full relative z-10 flex flex-col items-center justify-center ${
        isAuthenticated 
          ? 'max-w-7xl mx-auto px-4 md:px-12 py-6' 
          : 'px-0 py-0 md:px-12 md:py-6 md:max-w-7xl md:mx-auto'
      }`}>
        
        {/* VIEW A: AUTHENTICATED USER HOME DASHBOARD */}
        {isAuthenticated && (
          <DashboardView
            user={user}
            firebaseUser={firebaseUser}
            theme={theme}
            deferredPrompt={deferredPrompt}
            installApp={installApp}
          />
        )}

        {/* VIEW B: NON-AUTHENTICATED OR INTERRUPTED SYSTEM ONBOARDING FLOW */}
        {!isAuthenticated && (
          <div className="w-full flex flex-col items-center justify-center">
            {/* Interactive Workspace Area: Shows Onboarding OR improved credentials entry */}
            <div 
              id="interactive-workspace-column" 
              className="w-full flex justify-center"
            >
              <AnimatePresence mode="wait">
                {!showAuthForm ? (
                  <OnboardingFlow 
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
                        setFormError(null);
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
                    theme={theme}
                    isSignUp={isSignUp}
                    setIsSignUp={setIsSignUp}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    error={error}
                    formError={formError}
                    setFormError={setFormError}
                    actionLoading={actionLoading}
                    lastUser={lastUser}
                    handleAuthSubmit={handleAuthSubmit}
                    handleGoogleSignIn={handleGoogleSignIn}
                    onCancel={() => {
                      setShowAuthForm(false);
                      setFormError(null);
                    }}
                    onContinueAs={async () => {
                      if (lastUser?.providerId === 'google.com') {
                        await handleGoogleSignIn();
                      } else if (lastUser) {
                        setEmail(lastUser.email);
                        setIsSignUp(false);
                        setFormError(null);
                      }
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

      </main>

      {/* 3. LOGOUT CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div 
            id="logout-confirmation-modal-overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-[#000000]/70 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative z-10 w-full max-w-sm p-6 md:p-8 border-[1.5px] rounded-sm shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#2b313f] border-white/15 text-[#F8FAFC]'
                  : 'bg-[#fcf5e2] border-[#2b313f]/25 text-[#2b313f]'
              }`}
            >
              <div className="flex flex-col items-center text-center gap-5">
                {/* Visual Icon Alert Accent */}
                <div className="w-14 h-14 rounded-full bg-[#ff2d51]/10 flex items-center justify-center text-[#ff2d51] mb-1">
                  <LogOut size={24} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-space font-black uppercase text-base tracking-[0.15em]">
                    Confirm Sign Out
                  </h3>
                  <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-60">
                    Are you sure you want to end your DZINR curating session?
                  </p>
                  {user && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ff2d51]/5 text-[#ff2d51] text-[10px] font-mono rounded-full border border-[#ff2d51]/10 uppercase tracking-widest font-bold mt-1">
                      As {user.username}
                    </div>
                  )}
                </div>

                {/* Confirm / Cancel Button Layout */}
                <div className="flex flex-col w-full gap-2 mt-2">
                  <button
                    id="logout-modal-confirm-btn"
                    onClick={handleLogout}
                    className="w-full h-12 flex items-center justify-center text-[11px] font-space font-black uppercase tracking-widest bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 active:scale-[0.98] duration-150 rounded-sm cursor-pointer"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    id="logout-modal-cancel-btn"
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`w-full h-12 flex items-center justify-center text-[11px] font-space font-black uppercase tracking-widest border-[1.5px] active:scale-[0.98] duration-150 rounded-sm cursor-pointer ${
                      theme === 'dark'
                        ? 'border-white/10 text-[#F8FAFC] hover:bg-white/5'
                        : 'border-[#2b313f]/15 text-[#2b313f] hover:bg-black/5'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showPostLoginInstallPopup && (
          <div 
            id="pwa-install-popup-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop with standard DZINR styling */}
            <div 
              id="pwa-install-popup-backdrop"
              onClick={() => {
                setShowPostLoginInstallPopup(false);
                localStorage.setItem('dzinr_pwa_install_popup_dismissed', 'true');
              }}
              className="absolute inset-0 bg-[#000000]/70 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative z-10 w-full max-w-sm p-6 md:p-8 border-[1.5px] rounded-sm shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#2b313f] border-white/15 text-[#F8FAFC]'
                  : 'bg-[#fcf5e2] border-[#2b313f]/25 text-[#2b313f]'
              }`}
            >
              {/* Close Button */}
              <button
                id="pwa-install-popup-close-btn"
                type="button"
                onClick={() => {
                  setShowPostLoginInstallPopup(false);
                  localStorage.setItem('dzinr_pwa_install_popup_dismissed', 'true');
                }}
                className={`absolute top-4 right-4 p-1.5 rounded-full border transition-all active:scale-95 flex items-center justify-center ${
                  theme === 'dark'
                    ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/10 bg-white/5'
                    : 'border-black/10 text-[#2b313f]/60 hover:text-[#2b313f] hover:bg-black/5 bg-black/5'
                }`}
              >
                <X size={14} />
              </button>

              <div className="flex flex-col items-center text-center gap-5">
                {/* Visual Icon Badge */}
                <div className="w-14 h-14 rounded-full bg-[#ff2d51]/10 flex items-center justify-center text-[#ff2d51] mb-1">
                  <Smartphone size={24} className="animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-space font-black uppercase text-base tracking-[0.15em] text-[#ff2d51]">
                    Install Dzinr PWA
                  </h3>
                  <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-75">
                    Synchronize your curated feedback feed with a premium, home-screen-docked desktop & mobile experience.
                  </p>
                </div>

                <div className="w-full text-left p-3.5 border border-[#ff2d51]/10 bg-[#ff2d51]/5 rounded-sm">
                  <p className="text-[10px] font-space font-black uppercase tracking-wider text-[#ff2d51] mb-1">
                    How to Install:
                  </p>
                  <p className="text-[10px] opacity-80 leading-normal">
                    {typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
                      ? "iOS Safari: Tap the Share icon in your browser toolbar, then select 'Add to Home Screen'."
                      : "Click 'Install App' below to prompt your browser to install Dzinr as a desktop/mobile app."}
                  </p>
                </div>

                {/* Install / Dismiss Options */}
                <div className="flex flex-col w-full gap-2 mt-2">
                  {deferredPrompt && (
                    <button
                      id="pwa-install-popup-actuate-btn"
                      onClick={() => {
                        installApp();
                        setShowPostLoginInstallPopup(false);
                      }}
                      className="w-full h-12 flex items-center justify-center text-[11px] font-space font-black uppercase tracking-widest bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 active:scale-[0.98] duration-150 rounded-sm cursor-pointer"
                    >
                      Install App Now
                    </button>
                  )}
                  <button
                    id="pwa-install-popup-dismiss-btn"
                    onClick={() => {
                      setShowPostLoginInstallPopup(false);
                      localStorage.setItem('dzinr_pwa_install_popup_dismissed', 'true');
                    }}
                    className={`w-full h-12 flex items-center justify-center text-[11px] font-space font-black uppercase tracking-widest border-[1.5px] active:scale-[0.98] duration-150 rounded-sm cursor-pointer ${
                      theme === 'dark'
                        ? 'border-white/10 text-[#F8FAFC]/75 hover:bg-white/5'
                        : 'border-[#2b313f]/15 text-[#2b313f]/75 hover:bg-black/5'
                    }`}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

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
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative z-10 w-full max-w-sm p-6 md:p-8 border-[1.5px] rounded-sm shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#2b313f] border-white/15 text-[#F8FAFC]'
                  : 'bg-[#fcf5e2] border-[#2b313f]/25 text-[#2b313f]'
              }`}
            >
              {/* Close Button */}
              <button
                id="pwa-retry-login-popup-close-btn"
                type="button"
                onClick={() => setShowRetryLoginPopup(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-full border transition-all active:scale-95 flex items-center justify-center ${
                  theme === 'dark'
                    ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/10 bg-white/5'
                    : 'border-black/10 text-[#2b313f]/60 hover:text-[#2b313f] hover:bg-black/5 bg-black/5'
                }`}
              >
                <X size={14} />
              </button>

              <div className="flex flex-col items-center text-center gap-5">
                {/* Warning Icon Badge */}
                <div className="w-14 h-14 rounded-full bg-[#ff2d51]/10 flex items-center justify-center text-[#ff2d51] mb-1">
                  <Shield size={24} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-space font-black uppercase text-base tracking-[0.15em] text-[#ff2d51]">
                    Sign-In Interrupted
                  </h3>
                  <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-75">
                    Your Google authentication was closed or cancelled before it could complete successfully.
                  </p>
                </div>

                {retryLoginErrorMessage && (
                  <div className="w-full p-3 border border-[#ff2d51]/20 bg-[#ff2d51]/5 text-[#ff2d51] text-[10px] font-space font-black uppercase tracking-wider text-left rounded-sm">
                    {retryLoginErrorMessage}
                  </div>
                )}

                {/* Retry Options */}
                <div className="flex flex-col w-full gap-2 mt-2">
                  <button
                    id="pwa-retry-google-btn"
                    onClick={() => {
                      setShowRetryLoginPopup(false);
                      handleGoogleSignIn();
                    }}
                    className="w-full h-12 flex items-center justify-center text-[11px] font-space font-black uppercase tracking-widest bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 active:scale-[0.98] duration-150 rounded-sm cursor-pointer"
                  >
                    Retry Google Login
                  </button>
                  <button
                    id="pwa-retry-dismiss-btn"
                    onClick={() => setShowRetryLoginPopup(false)}
                    className={`w-full h-12 flex items-center justify-center text-[11px] font-space font-black uppercase tracking-widest border-[1.5px] active:scale-[0.98] duration-150 rounded-sm cursor-pointer ${
                      theme === 'dark'
                        ? 'border-white/10 text-[#F8FAFC]/75 hover:bg-white/5'
                        : 'border-[#2b313f]/15 text-[#2b313f]/75 hover:bg-black/5'
                    }`}
                  >
                    Use Email Instead
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
