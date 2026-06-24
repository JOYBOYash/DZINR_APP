import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnboardingStore } from '../stores/onboarding.store';
import { Button } from './Button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Eye, 
  Rocket, 
  Search, 
  Award, 
  TrendingUp, 
  MousePointer, 
  Check, 
  Smartphone,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

interface OnboardingFlowProps {
  theme: 'dark' | 'light';
  onSelectAuth: (method: 'google' | 'email') => void;
  onGoToLogin: () => void;
  lastUser?: any;
  onContinueAs?: () => void;
  onToggleTheme?: () => void;
  deferredPrompt?: any;
  isPwaInstalled?: boolean;
  onInstallPwa?: () => void;
}

const LOGO_URL = "https://dl.dropboxusercontent.com/scl/fi/3i6qc0yyzfvon6amb9md2/DZINR_LOGO.svg?rlkey=yjbgnkegl1ypfa6fr79usjol1";

interface StyleOption {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'Minimal',
    name: 'Minimal',
    description: 'Clean, light, and focused on essential elements with generous negative space.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Brutalist',
    name: 'Brutalist',
    description: 'Raw, heavy, unpolished layouts that defy standard web design conventions.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Neo Brutalist',
    name: 'Neo Brutalist',
    description: 'High-contrast black borders, bold primary colors, and quirky asymmetric geometry.',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Luxury',
    name: 'Luxury',
    description: 'Sophisticated designs featuring deep contrasts, rich gold accents, and elegant serifs.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Editorial',
    name: 'Editorial',
    description: 'Print-inspired typography with structured serif hierarchy and heavy text layouts.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass layers, colorful blurred backdrops, and subtle interface depth.',
    imageUrl: 'https://images.unsplash.com/photo-1618005198143-e52834e57bf6?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Dark UI',
    name: 'Dark UI',
    description: 'High-performance dark interfaces designed for elite developer focus and modern tech vibes.',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Futuristic',
    name: 'Futuristic',
    description: 'Cyberpunk visuals, neon gradients, hologram styling, and interactive glows.',
    imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Experimental',
    name: 'Experimental',
    description: 'Avant-garde visual layouts, glitch styling, and unconventional layouts.',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'Corporate',
    name: 'Corporate',
    description: 'Polished, clean, enterprise-ready digital products with highly structured trust.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80'
  }
];

const ROLE_OPTIONS = [
  'UI Designer',
  'UX Designer',
  'Brand Designer',
  'Graphic Designer',
  'Product Designer',
  'Developer',
  'Student',
  'Other'
];

const FORMAT_OPTIONS = [
  'UI/UX',
  'Posters',
  'Brochures',
  'Logos',
  'Infographics',
  'Banners',
  'Hoardings',
  'Packaging',
  'Landing Pages',
  'Dashboards',
  'Presentations',
  'Motion Graphics',
  '3D'
];

const GOAL_OPTIONS = [
  { id: 'Get Feedback', label: 'Get Feedback', icon: <Eye size={16} /> },
  { id: 'Find Inspiration', label: 'Find Inspiration', icon: <Compass size={16} /> },
  { id: 'Improve My Skills', label: 'Improve My Skills', icon: <Award size={16} /> },
  { id: 'Build My Portfolio', label: 'Build My Portfolio', icon: <Rocket size={16} /> },
  { id: 'Learn Design', label: 'Learn Design', icon: <Sparkles size={16} /> },
  { id: 'Follow Trends', label: 'Follow Trends', icon: <TrendingUp size={16} /> }
];

const DISCOVERY_OPTIONS = [
  'Twitter/X',
  'Instagram',
  'YouTube',
  'Google Search',
  'Friend',
  'LinkedIn',
  'Discord',
  'Reddit',
  'Dribbble',
  'Behance',
  'Other'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  theme,
  onSelectAuth,
  onGoToLogin,
  lastUser,
  onContinueAs,
  onToggleTheme,
  deferredPrompt,
  isPwaInstalled = false,
  onInstallPwa
}) => {
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const {
    step,
    role,
    inspirationStyles,
    preferredFormats,
    goals,
    discoverySource,
    setStep,
    setRole,
    toggleInspirationStyle,
    togglePreferredFormat,
    toggleGoal,
    setDiscoverySource,
    loadFromLocalStorage
  } = useOnboardingStore();

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const totalSteps = 7;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isNextDisabled = () => {
    if (step === 2) return !role;
    if (step === 3) return inspirationStyles.length < 3 || inspirationStyles.length > 10;
    if (step === 4) return preferredFormats.length === 0;
    if (step === 5) return goals.length === 0;
    if (step === 6) return !discoverySource;
    return false;
  };

  const renderWelcomeScreen = () => {
    return (
      <motion.div
        key="welcome"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center text-center flex-1 py-8 px-4 relative w-full"
      >
        {/* Floating Theme Switcher inside Welcome screen */}
        {onToggleTheme && (
          <div className="absolute -top-4 right-4 z-50">
            <button
              type="button"
              id="welcome-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme color"
              className={`p-3 rounded-full border transition-all active:scale-95 flex items-center justify-center ${
                theme === 'dark' 
                  ? 'border-white/10 text-white hover:bg-white/10 bg-white/5' 
                  : 'border-black/10 text-[#2b313f] hover:bg-black/5 bg-black/5'
              }`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        )}

        <div className="relative mb-6">
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
            className={`w-24 h-24 transition-all duration-300 ${theme === 'dark' ? 'bg-white' : 'bg-[#ff2d51]'}`}
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-black font-space tracking-tight leading-tight uppercase mb-4 max-w-lg">
          Welcome to <span className="text-[#ff2d51]">Dzinr</span>
        </h1>
        
        <p className="text-sm md:text-base opacity-75 max-w-sm font-sans mb-8 leading-relaxed">
          Discover inspiration and get real feedback on your design work from a high-signal community of builders.
        </p>

        <div className="w-full max-w-xs space-y-4">
          {lastUser && onContinueAs && (
            <button
              type="button"
              id="welcome-continue-as-last-user-btn"
              onClick={onContinueAs}
              className="w-full flex items-center justify-between p-3 border border-[#ff2d51]/20 bg-[#ff2d51]/5 rounded-sm hover:bg-[#ff2d51]/10 transition-all text-left mb-2 shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={lastUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${lastUser.id}`}
                  alt={lastUser.username}
                  className="w-8 h-8 rounded-sm bg-[#ff2d51]/10 border border-black/10 shrink-0"
                />
                <div>
                  <div className="text-[9px] font-space font-bold uppercase tracking-wider text-[#ff2d51]">Continue as</div>
                  <div className="text-xs font-space font-bold uppercase tracking-tight text-[#ff2d51] dark:text-[#ff2d51]">@{lastUser.username}</div>
                </div>
              </div>
              <span className="text-[#ff2d51] text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                Go <ChevronRight size={14} />
              </span>
            </button>
          )}

          <Button
            id="welcome-get-started-btn"
            variant="primary"
            onClick={nextStep}
            className="w-full shadow-lg"
          >
            Get Started
            <ChevronRight size={16} />
          </Button>

          <button
            id="welcome-signin-link"
            onClick={onGoToLogin}
            className="text-xs uppercase font-space font-bold tracking-widest text-[#ff2d51] underline underline-offset-4 hover:opacity-85"
          >
            Already have an account? Sign In
          </button>
        </div>

        {/* PWA ONBOARDING INSTALL ACTION */}
        {!isPwaInstalled && (deferredPrompt || isMobile) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-xs mt-8 p-4 border-[1.5px] rounded-sm text-left shadow-md transition-all ${
              theme === 'dark' 
                ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC]' 
                : 'bg-[#fcf5e2]/80 border-[#2b313f]/15 text-[#2b313f]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff2d51]/10 flex items-center justify-center text-[#ff2d51] shrink-0 mt-0.5">
                <Smartphone size={16} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-space font-black uppercase tracking-wider text-[#ff2d51]">
                  Install Dzinr PWA
                </h4>
                <p className="text-[10px] font-space font-semibold uppercase tracking-wider opacity-75 mt-1 leading-normal">
                  {isIOS 
                    ? "Tap the Share button in Safari, then select 'Add to Home Screen'."
                    : "Add Dzinr directly to your mobile home screen for optimal fidelity."}
                </p>
                
                {!isIOS && deferredPrompt && onInstallPwa && (
                  <button
                    type="button"
                    onClick={onInstallPwa}
                    className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51] border-b-[1.5px] border-[#ff2d51] hover:opacity-80 pb-0.5 transition-all"
                  >
                    Install Now →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderRoleScreen = () => {
    return (
      <motion.div
        key="role"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col flex-1 px-6 py-10 md:px-10 md:py-14 gap-8"
      >
        <div className="mb-2 shrink-0 space-y-2">
          <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Step 02 / 06</span>
          <h2 className="text-3xl md:text-4xl font-black font-space uppercase tracking-tight leading-tight">What best describes you?</h2>
          <p className="text-xs opacity-60 leading-relaxed">Select one professional role context that defines your workflow.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-10">
          {ROLE_OPTIONS.map((item) => {
            const isSelected = role === item;
            return (
              <button
                key={item}
                id={`role-opt-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setRole(item)}
                className={`p-5 md:p-6 border text-left flex flex-col justify-center transition-all rounded-sm active:scale-[0.98] h-20 md:h-24 ${
                  isSelected
                    ? 'border-[#ff2d51] bg-[#ff2d51]/5 text-[#ff2d51]'
                    : theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-[#F8FAFC]/90 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 text-[#2b313f] hover:bg-black/10'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-space font-bold uppercase tracking-widest leading-tight">
                    {item}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#ff2d51] flex items-center justify-center text-white shrink-0 ml-2">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderInspirationScreen = () => {
    const minRequired = 3;
    const maxRequired = 10;
    const count = inspirationStyles.length;

    return (
      <motion.div
        key="inspiration"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col flex-1 px-6 py-10 md:px-10 md:py-14 gap-8"
      >
        <div className="mb-2 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Step 03 / 06</span>
            <h2 className="text-3xl md:text-4xl font-black font-space uppercase tracking-tight leading-tight">Design Inspiration</h2>
            <p className="text-xs opacity-60 leading-relaxed">Select 3 to 10 aesthetic cards that inspire your style.</p>
          </div>
          <div className={`text-xs font-mono px-3 py-1.5 rounded shrink-0 self-start sm:self-auto ${
            count >= minRequired && count <= maxRequired 
              ? 'bg-[#ff2d51]/15 text-[#ff2d51] font-bold' 
              : 'bg-black/20 text-gray-400'
          }`}>
            {count}/{maxRequired}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-10">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = inspirationStyles.includes(style.id);
            return (
              <motion.button
                key={style.id}
                id={`style-opt-${style.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => toggleInspirationStyle(style.id)}
                disabled={!isSelected && count >= maxRequired}
                whileTap={{ scale: 0.98 }}
                whileHover={!(!isSelected && count >= maxRequired) ? { scale: 1.01 } : {}}
                className={`w-full text-left border overflow-hidden rounded-sm transition-all relative flex flex-col ${
                  isSelected
                    ? 'border-[#ff2d51] bg-[#ff2d51]/5 text-[#ff2d51]'
                    : !isSelected && count >= maxRequired
                      ? 'opacity-40 cursor-not-allowed border-black/5 dark:border-white/5'
                      : theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-[#F8FAFC]/90 hover:bg-white/10'
                        : 'border-black/10 bg-black/5 text-[#2b313f] hover:bg-black/10'
                }`}
              >
                {/* Style Thumbnail Image */}
                <div className="w-full h-auto aspect-[4/3] relative overflow-hidden bg-gray-900 shrink-0">
                  <img
                    src={style.imageUrl}
                    alt={style.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>

                {/* Card Content details BELOW image */}
                <div className="p-4 flex flex-col justify-start">
                  <h3 className="font-space font-bold text-[11px] uppercase tracking-wider mb-1.5 leading-tight">{style.name}</h3>
                  <p className="text-[10px] opacity-65 leading-relaxed line-clamp-2">{style.description}</p>
                </div>

                {/* Miniature Check Indicator */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5.5 h-5.5 rounded-full bg-[#ff2d51] flex items-center justify-center text-white shadow-md">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderFormatsScreen = () => {
    return (
      <motion.div
        key="formats"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col flex-1 px-6 py-10 md:px-10 md:py-14 gap-8"
      >
        <div className="mb-2 shrink-0 space-y-2">
          <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Step 04 / 06</span>
          <h2 className="text-3xl md:text-4xl font-black font-space uppercase tracking-tight leading-tight">What work inspires you?</h2>
          <p className="text-xs opacity-60 leading-relaxed">Select formats you want to review or see in your ranked feed (Multi-select).</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-10">
          {FORMAT_OPTIONS.map((item) => {
            const isSelected = preferredFormats.includes(item);
            return (
              <button
                key={item}
                id={`format-opt-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => togglePreferredFormat(item)}
                className={`p-4 md:p-5 border text-center transition-all rounded-sm active:scale-[0.98] flex items-center justify-center gap-2.5 min-h-[60px] ${
                  isSelected
                    ? 'border-[#ff2d51] bg-[#ff2d51]/5 text-[#ff2d51] font-bold'
                    : theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-[#F8FAFC]/90 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 text-[#2b313f] hover:bg-black/10'
                }`}
              >
                <span className="text-[10px] font-space uppercase tracking-widest">{item}</span>
                {isSelected && <Check size={12} className="shrink-0 text-[#ff2d51]" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderGoalsScreen = () => {
    return (
      <motion.div
        key="goals"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col flex-1 px-6 py-10 md:px-10 md:py-14 gap-8"
      >
        <div className="mb-2 shrink-0 space-y-2">
          <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Step 05 / 06</span>
          <h2 className="text-3xl md:text-4xl font-black font-space uppercase tracking-tight leading-tight">Your Goals on Dzinr</h2>
          <p className="text-xs opacity-60 leading-relaxed">Select everything you want to accomplish inside our workspace (Multi-select).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = goals.includes(goal.id);
            return (
              <button
                key={goal.id}
                id={`goal-opt-${goal.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => toggleGoal(goal.id)}
                className={`p-5 md:p-6 border w-full flex items-center justify-between transition-all rounded-sm active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#ff2d51] bg-[#ff2d51]/5 text-[#ff2d51]'
                    : theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-[#F8FAFC]/90 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 text-[#2b313f] hover:bg-black/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-sm ${isSelected ? 'bg-[#ff2d51] text-white' : 'bg-black/10'}`}>
                    {goal.icon}
                  </div>
                  <span className="text-xs font-space font-bold uppercase tracking-wider">{goal.label}</span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#ff2d51] flex items-center justify-center text-white">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderDiscoveryScreen = () => {
    return (
      <motion.div
        key="discovery"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col flex-1 px-6 py-10 md:px-10 md:py-14 gap-8"
      >
        <div className="mb-2 shrink-0 space-y-2">
          <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Step 06 / 06</span>
          <h2 className="text-3xl md:text-4xl font-black font-space uppercase tracking-tight leading-tight">How did you hear about us?</h2>
          <p className="text-xs opacity-60 leading-relaxed">Helps us allocate community resources and track discovery vectors.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-10">
          {DISCOVERY_OPTIONS.map((item) => {
            const isSelected = discoverySource === item;
            return (
              <button
                key={item}
                id={`disc-opt-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setDiscoverySource(item)}
                className={`p-4 md:p-5 border text-left transition-all rounded-sm active:scale-[0.98] flex items-center justify-between min-h-[60px] ${
                  isSelected
                    ? 'border-[#ff2d51] bg-[#ff2d51]/5 text-[#ff2d51] font-bold'
                    : theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-[#F8FAFC]/90 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 text-[#2b313f] hover:bg-black/10'
                }`}
              >
                <span className="text-[10px] font-space uppercase tracking-widest">{item}</span>
                {isSelected && (
                  <div className="w-4.5 h-4.5 rounded-full bg-[#ff2d51] flex items-center justify-center text-white">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderAuthChoiceScreen = () => {
    return (
      <motion.div
        key="auth-choice"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="flex flex-col items-center justify-center text-center flex-1 py-12 px-6 md:px-10 md:py-16"
      >
        <div className="w-16 h-16 bg-[#ff2d51]/10 rounded-full flex items-center justify-center text-[#ff2d51] mb-6">
          <Sparkles size={32} className="animate-spin-slow" />
        </div>

        <h2 className="text-3xl md:text-4xl font-black font-space uppercase tracking-tight mb-3">Setup Your Profile</h2>
        <p className="text-xs opacity-75 max-w-sm mb-10 leading-relaxed">
          Great! Your onboarding is complete. Select an access gate below to sync your profile with Firestore.
        </p>

        <div className="w-full max-w-xs space-y-4">
          <button
            id="auth-choice-google-btn"
            type="button"
            onClick={() => onSelectAuth('google')}
            className={`w-full flex items-center justify-center gap-3 py-3.5 border-[1.5px] font-space font-bold uppercase text-[10px] tracking-widest transition-all rounded-sm active:scale-[0.98] duration-200 ${
              theme === 'dark'
                ? 'border-white/15 bg-white/5 text-[#F8FAFC] hover:bg-white/10'
                : 'border-[#2b313f]/15 bg-white text-[#2b313f] hover:bg-gray-100 hover:text-[#2b313f] shadow-sm'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" className="inline align-middle shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <Button
            id="auth-choice-email-btn"
            variant="primary"
            onClick={() => onSelectAuth('email')}
          >
            Continue with Email
          </Button>

          <button
            id="auth-choice-back-btn"
            onClick={prevStep}
            className="text-xs uppercase font-space font-bold tracking-widest text-gray-500 hover:text-gray-400 mt-2 block mx-auto"
          >
            ← Back to Onboarding
          </button>
        </div>
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return renderWelcomeScreen();
      case 2:
        return renderRoleScreen();
      case 3:
        return renderInspirationScreen();
      case 4:
        return renderFormatsScreen();
      case 5:
        return renderGoalsScreen();
      case 6:
        return renderDiscoveryScreen();
      case 7:
        return renderAuthChoiceScreen();
      default:
        return renderWelcomeScreen();
    }
  };

  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div 
      id="onboarding-flow-container"
      className={`w-full max-w-6xl mx-auto flex flex-col justify-between min-h-[calc(100dvh-120px)] ${
        theme === 'dark' ? 'text-[#F8FAFC]' : 'text-[#2b313f]'
      }`}
    >
      {/* ONBOARDING STICKY TOP HEADER */}
      {step > 1 && (
        <div className={`w-full px-6 pt-5 pb-3 shrink-0 flex items-center justify-between border-b border-[#ff2d51]/10 sticky top-0 md:top-[80px] z-30 backdrop-blur-md ${
          theme === 'dark' ? 'bg-[#2b313f]/90' : 'bg-[#e4efff]/90'
        }`}>
          <button
            id="onboarding-back-btn"
            onClick={prevStep}
            className="flex items-center gap-1 text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51] active:scale-95"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <span className="text-[10px] font-space font-bold tracking-[0.25em] text-[#ff2d51] uppercase">
            Onboarding
          </span>

          <div className="w-6"></div> {/* Spacer balance */}
        </div>
      )}

      {/* STEP PROGRESS METER */}
      {step > 1 && step < 7 && (
        <div className="w-full h-1 bg-gray-500/10 shrink-0 relative overflow-hidden">
          <motion.div
            id="onboarding-progress-indicator-bar"
            className="h-full bg-[#ff2d51]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* CENTRAL SCROLLABLE WORKSPACE SEGMENT */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* ONBOARDING STICKY BOTTOM CONTROL FOOTER */}
      {step > 1 && step < 7 && (
        <div className={`p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:pb-5 border-t border-[#ff2d51]/10 shrink-0 flex gap-4 sticky bottom-0 z-30 backdrop-blur-md ${
          theme === 'dark' ? 'bg-[#2b313f]/90' : 'bg-[#e4efff]/90'
        }`}>
          <Button
            id="onboarding-bottom-prev-btn"
            variant="secondary"
            onClick={prevStep}
            className="flex-1 shrink-0 py-3 text-xs tracking-wider font-semibold"
          >
            Back
          </Button>

          <Button
            id="onboarding-bottom-next-btn"
            variant="primary"
            onClick={nextStep}
            disabled={isNextDisabled()}
            className="flex-[2] py-3 text-xs tracking-wider font-bold"
          >
            Continue
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};
