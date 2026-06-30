import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnboardingStore } from '../stores/onboarding.store';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Eye, 
  Rocket, 
  Award, 
  TrendingUp, 
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

import { INSPIRATION_STYLE_IMAGES } from '../constants/images';
import { USER_REVIEWS, DESIGN_QUOTES } from '../constants/reviews';

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
    imageUrl: INSPIRATION_STYLE_IMAGES.minimal
  },
  {
    id: 'Brutalist',
    name: 'Brutalist',
    description: 'Raw, heavy, unpolished layouts that defy standard web design conventions.',
    imageUrl: INSPIRATION_STYLE_IMAGES.brutalist
  },
  {
    id: 'Neo Brutalist',
    name: 'Neo Brutalist',
    description: 'High-contrast black borders, bold primary colors, and quirky asymmetric geometry.',
    imageUrl: INSPIRATION_STYLE_IMAGES.neoBrutalist
  },
  {
    id: 'Luxury',
    name: 'Luxury',
    description: 'Sophisticated designs featuring deep contrasts, rich gold accents, and elegant serifs.',
    imageUrl: INSPIRATION_STYLE_IMAGES.luxury
  },
  {
    id: 'Editorial',
    name: 'Editorial',
    description: 'Print-inspired typography with structured serif hierarchy and heavy text layouts.',
    imageUrl: INSPIRATION_STYLE_IMAGES.editorial
  },
  {
    id: 'Glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass layers, colorful blurred backdrops, and subtle interface depth.',
    imageUrl: INSPIRATION_STYLE_IMAGES.glassmorphism
  },
  {
    id: 'Dark UI',
    name: 'Dark UI',
    description: 'High-performance dark interfaces designed for elite developer focus and modern tech vibes.',
    imageUrl: INSPIRATION_STYLE_IMAGES.darkUI
  },
  {
    id: 'Futuristic',
    name: 'Futuristic',
    description: 'Cyberpunk visuals, neon gradients, hologram styling, and interactive glows.',
    imageUrl: INSPIRATION_STYLE_IMAGES.futuristic
  },
  {
    id: 'Experimental',
    name: 'Experimental',
    description: 'Avant-garde visual layouts, glitch styling, and unconventional layouts.',
    imageUrl: INSPIRATION_STYLE_IMAGES.experimental
  },
  {
    id: 'Corporate',
    name: 'Corporate',
    description: 'Polished, clean, enterprise-ready digital products with highly structured trust.',
    imageUrl: INSPIRATION_STYLE_IMAGES.corporate
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

interface CurationScreenProps {
  role: string;
  inspirationStyles: string[];
}

const CurationScreen: React.FC<CurationScreenProps> = ({ role, inspirationStyles }) => {
  const [progressStep, setProgressStep] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 950);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="curation"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center flex-1 py-16 px-6 max-w-md mx-auto"
    >
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-8 shadow-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          <Compass size={32} />
        </motion.div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight mb-3">
        Assembling your space
      </h2>
      <p className="text-sm text-[#555555] dark:text-[#D7D7D7] mb-10 leading-relaxed max-w-sm">
        Dzinr is customizing your feedback feed based on your role, preferred formats, and aesthetic taste.
      </p>

      <div className="w-full space-y-4 text-left">
        {/* Step 1 */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-surface-dark transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#888888] dark:text-[#A9A9A9]">01</span>
            <span className="text-sm font-sans font-medium text-[#171717] dark:text-white">
              Mapping {role || 'Designer'} profile
            </span>
          </div>
          {progressStep >= 1 ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent">
              <Check size={16} strokeWidth={3} />
            </motion.div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-accent animate-spin" />
          )}
        </div>

        {/* Step 2 */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
          progressStep >= 1 
            ? 'border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-surface-dark' 
            : 'border-transparent bg-transparent opacity-30'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#888888] dark:text-[#A9A9A9]">02</span>
            <span className="text-sm font-sans font-medium text-[#171717] dark:text-white">
              Indexing {inspirationStyles.length || 3} visual style preferences
            </span>
          </div>
          {progressStep >= 2 ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent">
              <Check size={16} strokeWidth={3} />
            </motion.div>
          ) : progressStep === 1 ? (
            <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-accent animate-spin" />
          ) : null}
        </div>

        {/* Step 3 */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
          progressStep >= 2 
            ? 'border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-surface-dark' 
            : 'border-transparent bg-transparent opacity-30'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#888888] dark:text-[#A9A9A9]">03</span>
            <span className="text-sm font-sans font-medium text-[#171717] dark:text-white">
              Tailoring formats &amp; goals
            </span>
          </div>
          {progressStep >= 3 ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent">
              <Check size={16} strokeWidth={3} />
            </motion.div>
          ) : progressStep === 2 ? (
            <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-accent animate-spin" />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

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

  const [activeReviewIdx, setActiveReviewIdx] = React.useState(0);

  useEffect(() => {
    if (step === 8) {
      const interval = setInterval(() => {
        setActiveReviewIdx((prev) => (prev + 1) % USER_REVIEWS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const totalSteps = 8;

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

  useEffect(() => {
    if (step === 7) {
      const timer = setTimeout(() => {
        setStep(8);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step, setStep]);

  const renderWelcomeScreen = () => {
    // Dynamic mapping from INSPIRATION_STYLE_IMAGES so any category edits propagate to the background
    const styleImages = [
      INSPIRATION_STYLE_IMAGES.minimal || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.brutalist || 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.neoBrutalist || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.luxury || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.editorial || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.glassmorphism || 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.darkUI || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.futuristic || 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.experimental || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80',
      INSPIRATION_STYLE_IMAGES.corporate || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
    ];

    // Columns configuration for responsive masonry collage
    const columnsData = [
      // Column 1
      [
        { id: '1-1', url: styleImages[0], h: 'h-32 sm:h-40 md:h-48' },
        { id: '1-2', url: styleImages[1], h: 'h-32 sm:h-40 md:h-48' },
        { id: '1-3', url: styleImages[2], h: 'h-32 sm:h-40 md:h-48' },
      ],
      // Column 2
      [
        { id: '2-1', url: styleImages[3], h: 'h-40 sm:h-48 md:h-56' },
        { id: '2-2', url: styleImages[4], h: 'h-40 sm:h-48 md:h-56' },
        { id: '2-3', url: styleImages[5], h: 'h-40 sm:h-48 md:h-56' },
      ],
      // Column 3
      [
        { id: '3-1', url: styleImages[6], h: 'h-28 sm:h-36 md:h-44' },
        { id: '3-2', url: styleImages[7], h: 'h-28 sm:h-36 md:h-44' },
        { id: '3-3', url: styleImages[8], h: 'h-28 sm:h-36 md:h-44' },
      ],
      // Column 4 (Hidden on smallest mobile)
      [
        { id: '4-1', url: styleImages[9], h: 'h-36 sm:h-44 md:h-52' },
        { id: '4-2', url: styleImages[0], h: 'h-36 sm:h-44 md:h-52' },
        { id: '4-3', url: styleImages[1], h: 'h-36 sm:h-44 md:h-52' },
      ],
      // Column 5 (Hidden on mobile/tablet)
      [
        { id: '5-1', url: styleImages[2], h: 'h-32 sm:h-40 md:h-48' },
        { id: '5-2', url: styleImages[3], h: 'h-32 sm:h-40 md:h-48' },
        { id: '5-3', url: styleImages[4], h: 'h-32 sm:h-40 md:h-48' },
      ],
    ];

    // Animating offsets for each column to make them glide up/down beautifully
    return (
      <motion.div
        key="welcome"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-between flex-1 relative w-full pt-6 pb-12 overflow-hidden min-h-[92vh] md:min-h-[85vh]"
      >
        {onToggleTheme && (
          <div className="absolute top-0 right-6 z-40">
            <button
              type="button"
              id="welcome-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-3.5 rounded-full border border-[#ECECEC] dark:border-white/10 text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5 transition-all cursor-pointer bg-white dark:bg-surface-dark shadow-sm"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        )}

        {/* DESIGN COLLAGE SECTION WITH DIAGONAL INFINITE MARQUEES */}
        <div className="absolute top-0 left-0 right-0 h-[320px] sm:h-[440px] md:h-[480px] overflow-hidden pointer-events-none select-none z-0">
          {/* ROTATED INNER WRAPPER EXTENDING BEYOND CLIPPING AREA TO AVOID CLIPPING LINES */}
          <div className="absolute -top-36 -left-[15vw] -right-[15vw] w-[130vw] h-[680px] sm:h-[850px] rotate-[-12deg] scale-105 origin-center">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-0 px-6 pt-4 h-full w-full">
              {columnsData.map((colItems, colIdx) => {
                // Create 3 exact copies of colItems to build an uninterrupted seamless infinite loop
                const tripledItems = [...colItems, ...colItems, ...colItems];
                const isEven = colIdx % 2 === 0;
                // Translate by exactly one full segment (1/3 of total tripled height)
                const yAnimation = isEven ? ["0%", "-33.3333%"] : ["-33.3333%", "0%"];
                const duration = 24 + colIdx * 5; // smooth speed variations for a parallax-like layer effect

                return (
                  <motion.div
                    key={`col-${colIdx}`}
                    className={`flex flex-col gap-0 shrink-0 ${
                      colIdx === 3 ? 'hidden sm:flex' : colIdx === 4 ? 'hidden lg:flex' : 'flex'
                    }`}
                    animate={{ y: yAnimation }}
                    transition={{
                      ease: "linear",
                      duration: duration,
                      repeat: Infinity,
                    }}
                  >
                    {tripledItems.map((item, itemIdx) => (
                      <div
                        key={`col-${colIdx}-item-${item.id}-idx-${itemIdx}`}
                        className="pb-4 sm:pb-6 px-2 sm:px-3 w-full shrink-0"
                      >
                        <div className={`${item.h} w-full rounded-2xl md:rounded-3xl overflow-hidden border border-[#ECECEC]/30 dark:border-white/5 shadow-md bg-neutral-100 dark:bg-[#3d0413]`}>
                          <img
                            src={item.url}
                            alt="Dzinr Inspiration Design"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover select-none scale-102"
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* TRANSITION OVERLAY GRADIENT - HORIZONTAL TO MATCH BODY */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#4A0517] dark:via-[#4A0517]/80 to-transparent z-10" />
        </div>

        {/* RESPONSIVE SCROLL SPACER TO PUSH CONTENT DOWN */}
        <div className="h-[160px] sm:h-[250px] md:h-[300px] shrink-0" />

        {/* BRAND CONTENT & ACTION AREA */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-lg mt-auto">
          {/* Circular Red Emblem with typography */}
          <div className="flex flex-col items-center mb-5 shrink-0">
            <div className="w-13 h-13 rounded-full bg-accent flex items-center justify-center p-3 shadow-lg shadow-accent/20 mb-2.5 hover:scale-108 transition-all duration-300">
              <img
                src="/logo-and-loader.svg"
                alt="D"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-space font-bold tracking-widest text-lg text-[#171717] dark:text-white uppercase">
              dzinr
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-space tracking-tight text-[#171717] dark:text-white mb-3 max-w-md leading-tight">
            Discover, Sync, and Score <br className="hidden sm:inline" />
            <span className="text-accent">Your Designs</span>
          </h1>

          {/* Subtitle description */}
          <p className="text-xs sm:text-sm text-[#555555] dark:text-[#D7D7D7] max-w-sm font-sans mb-8 leading-relaxed">
            The ultimate mobile-first playground where designers showcase visual layouts, synchronize platforms, and collect high-signal feedback.
          </p>

          {/* Action Area */}
          <div className="w-full max-w-xs space-y-3 px-2 flex flex-col items-center">
            {lastUser && onContinueAs && (
              <button
                type="button"
                id="welcome-continue-as-last-user-btn"
                onClick={onContinueAs}
                className="w-full flex items-center justify-between p-3.5 border border-[#ECECEC] dark:border-white/10 bg-white dark:bg-white/5 text-[#171717] dark:text-white rounded-[18px] hover:opacity-90 transition-opacity text-left mb-1 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ECECEC] dark:border-white/10 bg-white/10 dark:bg-black/5 flex items-center justify-center">
                    <img
                      src={lastUser.avatarUrl || (theme === 'dark' ? '/avatar-d.svg' : '/avatar-l.svg')}
                      alt={lastUser.username}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider opacity-60">Last Session</div>
                    <div className="text-xs font-sans font-medium">@{lastUser.username}</div>
                  </div>
                </div>
                <span className="text-xs font-bold tracking-tight flex items-center gap-0.5 shrink-0">
                  Go <ChevronRight size={13} />
                </span>
              </button>
            )}

            <Button
              id="welcome-get-started-btn"
              variant="primary"
              onClick={nextStep}
              className="w-full shadow-lg shadow-accent/15 py-3.5 font-space font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ChevronRight size={15} />
            </Button>

            <button
              id="welcome-signin-link"
              onClick={onGoToLogin}
              className="text-xs font-space font-semibold tracking-wider text-accent hover:text-accent-hover transition-colors block py-2.5 cursor-pointer"
            >
              ALREADY HAVE AN ACCOUNT? SIGN IN
            </button>
          </div>

          {/* Legal notice matching Pinterest */}
          <p className="text-[9px] text-[#888888] dark:text-[#A9A9A9]/60 max-w-xs mt-6 leading-normal font-sans text-center">
            By continuing, you agree to Dzinr's <span className="underline hover:text-accent cursor-pointer">Terms of Service</span> and acknowledge you have read our <span className="underline hover:text-accent cursor-pointer">Privacy Policy</span>.
          </p>
        </div>

        {!isPwaInstalled && (deferredPrompt || isMobile) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs mt-6 text-left relative z-20"
          >
            <Card id="pwa-intro-card" className="p-4 border border-[#ECECEC] dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Smartphone size={15} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-space font-bold tracking-wider text-accent uppercase">
                    INSTALL DZINR APP
                  </h4>
                  <p className="text-[11px] text-[#555555] dark:text-[#D7D7D7] mt-1 leading-relaxed">
                    {isIOS 
                      ? "Tap Share in Safari, then select 'Add to Home Screen'."
                      : "Add Dzinr directly to your mobile home screen."}
                  </p>
                  
                  {!isIOS && deferredPrompt && onInstallPwa && (
                    <button
                      type="button"
                      onClick={onInstallPwa}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-sans font-bold text-accent hover:text-accent-hover transition-colors cursor-pointer"
                    >
                      Install App Now →
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const [customRole, setCustomRole] = React.useState('');
  const [customDiscovery, setCustomDiscovery] = React.useState('');

  const renderRoleScreen = () => {
    return (
      <motion.div
        key="role"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col flex-1 px-6 py-10 md:px-12 md:py-12 gap-8 text-left"
      >
        <div className="mb-2 shrink-0 space-y-1">
          <span className="text-xs font-mono tracking-wider text-accent uppercase">Step 02 / 06</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight">What best describes you?</h2>
          <p className="text-sm text-[#555555] dark:text-[#D7D7D7]">Select one professional category representing your creative focus.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
          {ROLE_OPTIONS.map((item) => {
            const isSelected = role === item || (item === 'Other' && role.startsWith('Other'));
            return (
              <button
                key={item}
                id={`role-opt-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setRole(item === 'Other' ? (customRole ? `Other - ${customRole}` : 'Other') : item)}
                className={`p-5 text-left flex items-center justify-between transition-all duration-200 rounded-[24px] border cursor-pointer ${
                  isSelected
                    ? 'border-accent bg-accent/5 dark:bg-white text-accent dark:text-[#171717] shadow-[0_8px_24px_rgba(201,0,35,0.1)]'
                    : 'border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-surface-dark text-[#171717] dark:text-[#D7D7D7] hover:bg-[#ECECEC] dark:hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-sans font-medium">{item}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white shrink-0 ml-2">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {role.startsWith('Other') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm -mt-6 pb-6"
          >
            <input 
              type="text" 
              placeholder="Please specify..."
              value={customRole}
              onChange={(e) => {
                setCustomRole(e.target.value);
                setRole(e.target.value ? `Other - ${e.target.value}` : 'Other');
              }}
              className="w-full bg-transparent border-b border-accent focus:outline-none focus:border-accent text-[#171717] dark:text-white py-2 text-sm"
            />
          </motion.div>
        )}
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
        className="flex flex-col flex-1 px-6 py-10 md:px-12 md:py-12 gap-8 text-left"
      >
        <div className="mb-2 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono tracking-wider text-accent uppercase">Step 03 / 06</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight">Design Inspiration</h2>
            <p className="text-sm text-[#555555] dark:text-[#D7D7D7]">Select between 3 and 10 aesthetic visual style moods.</p>
          </div>
          <div className={`text-xs font-mono px-3 py-1.5 rounded-full shrink-0 self-start sm:self-auto ${
            count >= minRequired && count <= maxRequired 
              ? 'bg-accent/10 text-accent font-semibold' 
              : 'bg-[#F7F7F8] dark:bg-surface-dark text-[#888888] dark:text-[#A9A9A9]'
          }`}>
            {count} / {maxRequired} selected
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 sm:gap-6 pb-10">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = inspirationStyles.includes(style.id);
            return (
              <motion.button
                key={style.id}
                id={`style-opt-${style.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => toggleInspirationStyle(style.id)}
                disabled={!isSelected && count >= maxRequired}
                whileTap={{ scale: 0.96 }}
                className={`w-full text-left flex flex-col cursor-pointer transition-opacity group ${
                  !isSelected && count >= maxRequired ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <div className="relative w-full aspect-square sm:aspect-[4/5] mb-2 sm:mb-3">
                  {/* Backdrop shadow/accent */}
                  <div className={`absolute inset-0 rounded-[24px] transition-all duration-300 translate-x-2 translate-y-2 sm:translate-x-2.5 sm:translate-y-2.5 ${
                    isSelected ? 'bg-accent dark:bg-white' : 'bg-[#E5E5E5] dark:bg-white/10 group-hover:bg-[#CCCCCC] dark:group-hover:bg-white/20'
                  }`}></div>
                  
                  {/* Actual image container */}
                  <div className={`absolute inset-0 w-full h-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 rounded-[24px] shrink-0 border-2 transition-all duration-300 z-10 ${
                    isSelected ? 'border-accent dark:border-white shadow-sm' : 'border-transparent'
                  }`}>
                    <img
                      src={style.imageUrl}
                      alt={style.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 rounded-full bg-accent dark:bg-white flex items-center justify-center text-white dark:text-[#171717] shadow-md z-20">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none mix-blend-overlay"></div>
                  </div>
                </div>
                
                <div className="px-1 mt-1 z-10 relative">
                  <h4 className={`font-space font-semibold text-sm sm:text-[15px] ${isSelected ? 'text-accent dark:text-white' : 'text-[#171717] dark:text-white'}`}>
                    {style.name}
                  </h4>
                </div>
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
        className="flex flex-col flex-1 px-6 py-10 md:px-12 md:py-12 gap-8 text-left"
      >
        <div className="mb-2 shrink-0 space-y-1">
          <span className="text-xs font-mono tracking-wider text-accent uppercase">Step 04 / 06</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight">Preferred Formats</h2>
          <p className="text-sm text-[#555555] dark:text-[#D7D7D7]">Select media canvas formats you actively design (Multi-select).</p>
        </div>

        <div className="flex flex-wrap gap-3 pb-10 max-w-4xl">
          {FORMAT_OPTIONS.map((item) => {
            const isSelected = preferredFormats.includes(item);
            return (
              <Chip
                key={item}
                label={item}
                active={isSelected}
                onClick={() => togglePreferredFormat(item)}
                className="py-2.5 px-4"
              />
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
        className="flex flex-col flex-1 px-6 py-10 md:px-12 md:py-12 gap-8 text-left"
      >
        <div className="mb-2 shrink-0 space-y-1">
          <span className="text-xs font-mono tracking-wider text-accent uppercase">Step 05 / 06</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight">Your Goals on Dzinr</h2>
          <p className="text-sm text-[#555555] dark:text-[#D7D7D7]">What do you want to accomplish inside our workspace? (Multi-select).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pb-10">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = goals.includes(goal.id);
            return (
              <button
                key={goal.id}
                id={`goal-opt-${goal.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => toggleGoal(goal.id)}
                className={`p-5 border w-full flex items-center justify-between transition-all duration-200 rounded-[24px] cursor-pointer ${
                  isSelected
                    ? 'border-accent bg-accent/5 dark:bg-white text-accent dark:text-[#171717] shadow-[0_8px_24px_rgba(201,0,35,0.1)]'
                    : 'border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-surface-dark text-[#171717] dark:text-[#D7D7D7] hover:bg-[#ECECEC] dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4.5">
                  <div className={`p-2.5 rounded-full shrink-0 ${isSelected ? 'bg-accent text-white' : 'bg-[#E5E5E5] dark:bg-[#E5E5E5] text-[#555555] dark:text-[#171717]'}`}>
                    {goal.icon}
                  </div>
                  <span className="text-sm font-sans font-medium">{goal.label}</span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-accent dark:bg-[#171717] flex items-center justify-center text-white shrink-0">
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
        className="flex flex-col flex-1 px-6 py-10 md:px-12 md:py-12 gap-8 text-left"
      >
        <div className="mb-2 shrink-0 space-y-1">
          <span className="text-xs font-mono tracking-wider text-accent uppercase">Step 06 / 06</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight">How did you hear about us?</h2>
          <p className="text-sm text-[#555555] dark:text-[#D7D7D7]">Helps us direct our creative communities and outreach.</p>
        </div>

        <div className="flex flex-wrap gap-3 pb-10 max-w-4xl">
          {DISCOVERY_OPTIONS.map((item) => {
            const isSelected = discoverySource === item || (item === 'Other' && discoverySource.startsWith('Other'));
            return (
              <Chip
                key={item}
                label={item}
                active={isSelected}
                onClick={() => setDiscoverySource(item === 'Other' ? (customDiscovery ? `Other - ${customDiscovery}` : 'Other') : item)}
                className="py-2.5 px-4"
              />
            );
          })}
        </div>

        {discoverySource.startsWith('Other') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm -mt-6 pb-6"
          >
            <input 
              type="text" 
              placeholder="Please specify..."
              value={customDiscovery}
              onChange={(e) => {
                setCustomDiscovery(e.target.value);
                setDiscoverySource(e.target.value ? `Other - ${e.target.value}` : 'Other');
              }}
              className="w-full bg-transparent border-b border-accent focus:outline-none focus:border-accent text-[#171717] dark:text-white py-2 text-sm"
            />
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderCurationScreen = () => {
    return <CurationScreen role={role} inspirationStyles={inspirationStyles} />;
  };

  const renderAuthChoiceScreen = () => {
    // 4 columns of reviews for background marquee, duplicating USER_REVIEWS to build a seamless vertical loop
    const columnsReviews = [
      [...USER_REVIEWS, ...USER_REVIEWS],
      [...USER_REVIEWS, ...USER_REVIEWS].reverse(),
      [...USER_REVIEWS, ...USER_REVIEWS],
      [...USER_REVIEWS, ...USER_REVIEWS].reverse(),
    ];

    return (
      <motion.div
        key="auth-choice"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative flex flex-col items-center justify-center flex-1 w-full h-[100dvh] max-h-[100dvh] py-2 sm:py-4 px-4 overflow-hidden"
      >
        {/* IMMERSIVE BACKGROUND SCROLLING MARQUEE OF REVIEWS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className="absolute -top-36 -left-[15vw] -right-[15vw] w-[130vw] h-[130vh] rotate-[-12deg] scale-105 origin-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-6 pt-4 h-full w-full opacity-60 dark:opacity-50">
              {columnsReviews.map((colItems, colIdx) => {
                const isEven = colIdx % 2 === 0;
                const yAnimation = isEven ? ["0%", "-50%"] : ["-50%", "0%"];
                const duration = 38 + colIdx * 10; // slow, organic drift for un-distracting backdrop motion

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
          <div className="mb-1 sm:mb-5">
            <img 
              src="/wordmark-logo.svg" 
              className="h-7 sm:h-10 drop-shadow-md svg-theme-color" 
              alt="Dzinr" 
            />
          </div>

          {/* Minimalist Floating Account Setup Action */}
          <div className="w-full flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-0.5 sm:py-1 rounded-full w-max mb-1.5 sm:mb-4">
              CREATIVE JOURNEY COMPLETE
            </span>
            
            <h3 className="text-xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight mb-1 sm:mb-2 leading-tight">
              Setup Your Account
            </h3>
            
            <p className="text-[11px] sm:text-xs text-[#555555] dark:text-[#D7D7D7] max-w-sm mx-auto mb-4 sm:mb-8 leading-relaxed px-4">
              Awesome work! Secure your progress, save your custom designer profile, and join the feedback stream.
            </p>

            {/* Centered actions - floating, no wrapping boxes */}
            <div className="space-y-2 sm:space-y-3 w-full max-w-[280px] sm:max-w-[310px] px-2">
              <motion.button
                id="auth-choice-google-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onSelectAuth('google')}
                className="w-full flex items-center justify-center gap-3 py-3 border border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8]/90 dark:bg-surface-dark/95 text-[#171717] dark:text-white hover:bg-[#ECECEC] dark:hover:bg-white/5 rounded-[18px] font-sans font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-md backdrop-blur-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button
                  id="auth-choice-email-btn"
                  variant="primary"
                  onClick={() => onSelectAuth('email')}
                  className="w-full h-[42px] py-2 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
                >
                  <span>Continue with Email</span>
                </Button>
              </motion.div>

              <button
                id="auth-choice-back-btn"
                onClick={() => setStep(6)}
                className="text-xs font-space font-semibold tracking-wider text-[#888888] dark:text-[#A9A9A9] hover:text-accent transition-colors mt-3 sm:mt-4 block mx-auto py-1 cursor-pointer"
              >
                ← BACK TO ONBOARDING
              </button>
            </div>
          </div>
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
        return renderCurationScreen();
      case 8:
        return renderAuthChoiceScreen();
      default:
        return renderWelcomeScreen();
    }
  };

  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div 
      id="onboarding-flow-container"
      className={`w-full flex flex-col justify-between ${step === 8 ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'}`}
    >
      {/* STEP PROGRESS METER */}
      {step > 1 && step < 8 && (
        <div className="w-full h-1 bg-neutral-200 dark:bg-white/10 shrink-0 relative overflow-hidden">
          <motion.div
            id="onboarding-progress-indicator-bar"
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* CENTRAL SCROLLABLE WORKSPACE SEGMENT */}
      <div className={`flex-1 flex flex-col justify-center w-full mx-auto ${(step === 1 || step === 8) ? 'py-0' : 'py-6 max-w-6xl px-4 sm:px-6'}`}>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* ONBOARDING CONTROL FOOTER */}
      {step > 1 && step < 7 && (
        <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:pb-8 flex gap-4 bg-transparent shrink-0 w-full max-w-6xl mx-auto border-t border-[#ECECEC] dark:border-white/10 mt-auto">
          <Button
            id="onboarding-bottom-prev-btn"
            variant="secondary"
            onClick={prevStep}
            className="flex-1"
          >
            Back
          </Button>

          <Button
            id="onboarding-bottom-next-btn"
            variant={isNextDisabled() ? 'disabled' : 'primary'}
            onClick={nextStep}
            disabled={isNextDisabled()}
            className="flex-[2]"
          >
            <span>Continue</span>
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};
