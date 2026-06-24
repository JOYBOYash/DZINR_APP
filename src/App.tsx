import React, { useState, useEffect, FormEvent } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { authService } from './services/auth.service';
import { userService } from './services/user.service';
import { useAuthStore } from './stores/auth.store';
import { useOnboardingStore } from './stores/onboarding.store';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { LoadingState } from './components/LoadingState';
import { 
  Globe, 
  LogOut, 
  CheckCircle2, 
  Moon, 
  Sun, 
  ArrowRight, 
  UserCheck, 
  Mail, 
  Shield, 
  Smartphone, 
  Sparkles, 
  Zap, 
  ChevronLeft,
  User,
  Check,
  Compass,
  Award,
  TrendingUp,
  Heart
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
      setActionLoading(true);
      setLoadingMessage("Connecting to Google");
      setLoading(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyAuthError(err));
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
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 py-4"
          >
            {/* COLUMN 1: Profile & System Info */}
            <div className={`p-6 md:p-8 border rounded-sm flex flex-col justify-between ${
              theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'
            }`}>
              <div>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-3 flex justify-center">
                    <img 
                      id="user-avatar-image"
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} 
                      alt="My Identicon Avatar" 
                      className="w-20 h-20 bg-[#ff2d51] border-2 border-[#ff2d51]/45 rounded-full shadow-md object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Verified Designer</span>
                  <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-tight mt-1 break-all max-w-full">
                    @{user.username}
                  </h2>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Role Classification</div>
                    <div className="text-sm font-bold uppercase font-space mt-1 text-[#ff2d51]">{user.role}</div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Discovery Vector</div>
                    <div className="text-xs font-mono font-bold mt-1 opacity-85">{user.discoverySource}</div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Account Registry</div>
                    <div className="text-xs font-mono opacity-65 mt-1">{user.email}</div>
                  </div>
                </div>
              </div>

              {deferredPrompt && (
                <div className="mt-8 p-4 border border-[#ff2d51]/20 bg-[#ff2d51]/5 flex flex-col gap-3 rounded-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ff2d51] uppercase tracking-wider">
                    <Smartphone size={14} className="animate-bounce" />
                    PWA App Install Available
                  </div>
                  <p className="text-[10px] opacity-75">Install Dzinr directly onto your home screen for immersive native-like mobile fidelity.</p>
                  <Button 
                    id="dashboard-pwa-install-trigger" 
                    variant="accent-outline" 
                    onClick={installApp}
                    className="py-2 text-[10px]"
                  >
                    Install Application
                  </Button>
                </div>
              )}
            </div>

            {/* COLUMN 2: Recommendation Engine Preferences */}
            <div className={`p-6 md:p-8 border rounded-sm lg:col-span-2 flex flex-col justify-between ${
              theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'
            }`}>
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Aesthetic Intel</span>
                  <h2 className="text-2xl font-black font-space uppercase tracking-tight mt-1">Recommendation Preferences</h2>
                  <p className="text-xs opacity-60 mt-1">These preferences are active and used for query rankings in Firestore.</p>
                </div>

                {/* Sub-grid of selections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  {/* Inspiration Styles */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold font-space uppercase tracking-wider text-gray-400">Inspiration Styles</h3>
                    <div className="flex flex-wrap gap-2">
                      {(user?.inspirationStyles || []).map((style) => (
                        <span 
                          key={style}
                          className="px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider bg-[#ff2d51]/10 text-[#ff2d51] border border-[#ff2d51]/20 rounded-sm"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Formats */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold font-space uppercase tracking-wider text-gray-400">Preferred Formats</h3>
                    <div className="flex flex-wrap gap-2">
                      {(user?.preferredFormats || []).map((fmt) => (
                        <span 
                          key={fmt}
                          className="px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-sm"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="space-y-2 md:col-span-2 pt-2 border-t border-white/5">
                    <h3 className="text-xs font-bold font-space uppercase tracking-wider text-gray-400">Creative Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {(user?.goals || []).map((goal) => (
                        <span 
                          key={goal}
                          className="px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider bg-[#ff2d51] text-white rounded-sm"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row items-center gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#ff2d51]">
                  <CheckCircle2 size={16} />
                  Cold-Start Complete
                </div>
                <p className="text-[10px] opacity-50 flex-1 text-center md:text-left">
                  We are parsing your 100dvh metrics to pre-rank feed modules for discovery algorithm models.
                </p>
              </div>
            </div>
          </motion.div>
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
                  // IMPROVED MOBILE-FIRST NATIVE AUTHENTICATION SCREEN (With zero scroll on mobile, back to onboarding etc)
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
                        onClick={() => {
                          setShowAuthForm(false);
                          setFormError(null);
                        }}
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
                        <div className="p-3 bg-[#ff2d51]/10 border border-[#ff2d51]/20 text-[10px] font-semibold uppercase tracking-wider text-[#ff2d51] rounded-sm">
                          {error}
                        </div>
                      )}

                      {formError && (
                        <div className="p-3 bg-[#ff2d51]/10 border border-[#ff2d51]/20 text-[10px] font-semibold uppercase tracking-wider text-[#ff2d51] rounded-sm">
                          {formError}
                        </div>
                      )}

                      {/* Continue as feature on login panel */}
                      {lastUser && (
                        <button
                          type="button"
                          id="gateway-continue-as-btn"
                          disabled={actionLoading}
                          onClick={async () => {
                            if (lastUser.providerId === 'google.com') {
                              await handleGoogleSignIn();
                            } else {
                              setEmail(lastUser.email);
                              setIsSignUp(false);
                              setFormError(null);
                            }
                          }}
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
                        onClick={() => {
                          setShowAuthForm(false);
                          setFormError(null);
                        }}
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
      </AnimatePresence>
    </div>
  );
}
