import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Sparkles, Check, Bookmark, Palette, Smartphone, ExternalLink } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileForm } from './ProfileForm';
import { PortfolioInput } from './PortfolioInput';
import { IntegrationCard } from './IntegrationCard';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/auth.store';
import { UserProfile } from '../types';

interface ProfileSetupFlowProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  onComplete: (updatedUser: UserProfile) => void;
}

export const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({
  user,
  theme,
  onComplete,
}) => {
  // Step manager:
  // 1: Profile Information
  // 2: Import Choice (Connect Figma, Portfolio, or Start Fresh)
  // 3: Portfolio Import (Only if choice is Portfolio)
  // 4: Figma Integration (Only if choice is Figma)
  // 5: Congratulations / Finished
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<'figma' | 'portfolio' | 'fresh' | null>(null);

  // Flow form values
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || '');
  const [figmaUsername, setFigmaUsername] = useState('');

  // Validation trackers
  const [isProfileValid, setIsProfileValid] = useState(true);
  const [isPortfolioValid, setIsPortfolioValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Save the full profile to Firestore
  const handleFinalizeSetup = async () => {
    setSubmitting(true);
    setSaveError(null);

    try {
      const integrations = figmaUsername ? {
        figma: {
          connected: true,
          username: figmaUsername,
          connectedAt: new Date().toISOString()
        }
      } : {};

      const dataToUpdate: Partial<UserProfile> = {
        avatarUrl,
        username,
        bio,
        portfolioUrl: choice === 'portfolio' ? portfolioUrl : '',
        integrations,
        profileCompleted: true,
        stats: {
          uploads: choice === 'fresh' ? 0 : 2, // starting with placeholder feed records if imported
          swipes: 0,
          rating: 0
        }
      };

      await userService.updateUserProfile(user.id, dataToUpdate);
      
      // Update store and local representation
      const finalizedUser = {
        ...user,
        ...dataToUpdate
      };
      
      // Navigate to congratulations step
      setStep(5);
    } catch (err: any) {
      console.error('Failed to complete profile:', err);
      setSaveError('Could not save profile setup to database. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStepFromChoice = (selectedChoice: 'figma' | 'portfolio' | 'fresh') => {
    setChoice(selectedChoice);
    if (selectedChoice === 'portfolio') {
      setStep(3);
    } else if (selectedChoice === 'figma') {
      setStep(4);
    } else {
      // Start Fresh -> Finalize immediately!
      handleFinalizeSetup();
    }
  };

  const handleBack = () => {
    if (step === 3 || step === 4) {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Sleek custom progress bar values
  const getProgressPercentage = () => {
    switch (step) {
      case 1: return 20;
      case 2: return 50;
      case 3: return 80;
      case 4: return 80;
      case 5: return 100;
      default: return 0;
    }
  };

  return (
    <div 
      id="profile-setup-flow-root"
      className="w-full max-w-[850px] mx-auto min-h-[80dvh] flex flex-col justify-between py-6 px-4 md:px-8"
    >
      {/* 1. PROGRESS BAR SYSTEM */}
      {step < 5 && (
        <div id="setup-progress-indicator" className="w-full space-y-3 mb-8">
          <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] opacity-60">
            <span>Profile Creator Wizard</span>
            <span>Step {step === 3 || step === 4 ? 3 : step} of 3</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-[#ff2d51] shadow-[0_0_10px_#ff2d51]"
              initial={{ width: "0%" }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-space font-black uppercase tracking-wider text-[#ff2d51]/75">
            <span className={step >= 1 ? 'opacity-100' : 'opacity-40'}>1. Profile</span>
            <span className={step >= 2 ? 'opacity-100' : 'opacity-40'}>2. Import Route</span>
            <span className={step >= 3 ? 'opacity-100' : 'opacity-40'}>3. Synchronize</span>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE MAIN COMPONENT SCREEN */}
      <div className="flex-1 flex flex-col justify-center items-center py-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1.5 max-w-sm">
                <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-widest text-[#ff2d51]">
                  Personalize Profile
                </h2>
                <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-65 leading-relaxed">
                  Upload your signature visual representative avatar and customize your curation alias handle.
                </p>
              </div>

              <ProfileAvatar 
                currentAvatarUrl={avatarUrl}
                onAvatarChanged={setAvatarUrl}
                theme={theme}
              />

              <ProfileForm 
                username={username}
                bio={bio}
                onUsernameChange={setUsername}
                onBioChange={setBio}
                onValidationStatusChange={setIsProfileValid}
                theme={theme}
                userId={user.id}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1.5 max-w-sm">
                <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-widest text-[#ff2d51]">
                  Import Design Work
                </h2>
                <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-65 leading-relaxed">
                  Establish live layout synchronization. Choose how you want to load your portfolio feeds.
                </p>
              </div>

              {/* Options Selection Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                {/* Route A: Connect Figma */}
                <button
                  id="choice-route-figma"
                  type="button"
                  onClick={() => handleNextStepFromChoice('figma')}
                  className={`p-6 border-[1.5px] rounded-sm text-left flex flex-col justify-between h-[160px] cursor-pointer hover:border-[#ff2d51]/50 group transition-all duration-300 ${
                    theme === 'dark' ? 'bg-[#2b313f]/40 border-white/10' : 'bg-white border-[#2b313f]/15'
                  }`}
                >
                  <div className="flex gap-1 items-center">
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M12 10C12 7.23858 14.2386 5 17 5H22C24.7614 5 27 7.23858 27 10C27 12.7614 24.7614 15 22 15H17C14.2386 15 12 12.7614 12 10Z" fill="#F24E1E" />
                      <path d="M12 20C12 17.2386 14.2386 15 17 15H22C24.7614 15 27 17.2386 27 20C27 22.7614 24.7614 25 22 25H17C14.2386 25 12 22.7614 12 20Z" fill="#A259FF" />
                      <path d="M12 30C12 27.2386 14.2386 25 17 25C19.7614 25 22 27.2386 22 30C22 32.7614 19.7614 35 17 35C14.2386 35 12 32.7614 12 30Z" fill="#1ABCFE" />
                    </svg>
                    <span className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51] ml-1">Figma Sync</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-space font-black uppercase text-xs">Connect Figma</h4>
                    <p className="text-[9px] opacity-60 leading-normal">Pull layout drafts directly from your active canvas pages.</p>
                  </div>
                </button>

                {/* Route B: Import Portfolio */}
                <button
                  id="choice-route-portfolio"
                  type="button"
                  onClick={() => handleNextStepFromChoice('portfolio')}
                  className={`p-6 border-[1.5px] rounded-sm text-left flex flex-col justify-between h-[160px] cursor-pointer hover:border-[#ff2d51]/50 group transition-all duration-300 ${
                    theme === 'dark' ? 'bg-[#2b313f]/40 border-white/10' : 'bg-white border-[#2b313f]/15'
                  }`}
                >
                  <Bookmark size={22} className="text-[#ff2d51] group-hover:scale-110 transition-transform" />
                  <div className="space-y-1">
                    <h4 className="font-space font-black uppercase text-xs">Import Directory</h4>
                    <p className="text-[9px] opacity-60 leading-normal">Load works from Framer, Webflow, Behance, or Notion pages.</p>
                  </div>
                </button>

                {/* Route C: Start Fresh */}
                <button
                  id="choice-route-fresh"
                  type="button"
                  onClick={() => handleNextStepFromChoice('fresh')}
                  className={`p-6 border-[1.5px] rounded-sm text-left flex flex-col justify-between h-[160px] cursor-pointer hover:border-[#ff2d51]/50 group transition-all duration-300 ${
                    theme === 'dark' ? 'bg-[#2b313f]/40 border-white/10' : 'bg-white border-[#2b313f]/15'
                  }`}
                >
                  <Palette size={22} className="text-[#ff2d51] group-hover:scale-110 transition-transform" />
                  <div className="space-y-1">
                    <h4 className="font-space font-black uppercase text-xs">Start Fresh</h4>
                    <p className="text-[9px] opacity-60 leading-normal">Boot with blank canvas boards and build your portfolio from scratch manually.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1.5 max-w-sm">
                <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-widest text-[#ff2d51]">
                  Sync Portfolio URL
                </h2>
                <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-65 leading-relaxed">
                  Connect your live designer URL to crawl screenshots of current works.
                </p>
              </div>

              <PortfolioInput 
                portfolioUrl={portfolioUrl}
                onUrlChange={setPortfolioUrl}
                onValidationStatusChange={setIsPortfolioValid}
                theme={theme}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1.5 max-w-sm">
                <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-widest text-[#ff2d51]">
                  Figma Integration
                </h2>
                <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-65 leading-relaxed">
                  Enable background crawl syncs to draft curation cards automatically.
                </p>
              </div>

              <IntegrationCard 
                onIntegrationConnected={setFigmaUsername}
                onSkip={handleFinalizeSetup}
                theme={theme}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md p-8 border-[1.5px] rounded-sm text-center flex flex-col items-center gap-6"
              style={{
                backgroundColor: theme === 'dark' ? '#2b313f' : '#e4efff',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(43,49,63,0.15)',
              }}
            >
              {/* Success Emblem */}
              <div className="w-16 h-16 rounded-full bg-[#ff2d51] flex items-center justify-center text-white shadow-lg shadow-[#ff2d51]/20">
                <Check size={32} strokeWidth={3.5} className="animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-widest text-[#ff2d51]">
                  Aesthetic Sync Ready
                </h2>
                <p className="text-xs font-space font-semibold uppercase tracking-wider opacity-75 max-w-xs mx-auto leading-relaxed">
                  Your portfolio directory, integrations, and personalized curation profile are now successfully configured.
                </p>
              </div>

              <button
                id="enter-dzinr-dashboard-btn"
                type="button"
                onClick={() => {
                  const updatedUser: UserProfile = {
                    ...user,
                    avatarUrl,
                    username,
                    bio,
                    portfolioUrl,
                    profileCompleted: true,
                    integrations: figmaUsername ? {
                      figma: {
                        connected: true,
                        username: figmaUsername,
                        connectedAt: new Date().toISOString()
                      }
                    } : {}
                  };
                  onComplete(updatedUser);
                }}
                className="w-full h-12 bg-[#ff2d51] text-white hover:bg-[#ff2d51]/90 duration-150 rounded-sm font-space font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
              >
                Access Curator Deck
                <ChevronRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. STEP BACK & FORWARD ACTION TRIGGERS */}
      {step < 5 && (
        <div id="setup-wizard-triggers" className="flex items-center justify-between w-full border-t border-white/5 pt-6 mt-8">
          {step > 1 ? (
            <button
              id="setup-wizard-back-btn"
              type="button"
              onClick={handleBack}
              className={`h-11 px-5 rounded-sm text-[10px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                theme === 'dark'
                  ? 'border-white/10 text-white/70 hover:bg-white/5'
                  : 'border-[#2b313f]/15 text-[#2b313f]/70 hover:bg-black/5'
              }`}
            >
              <ChevronLeft size={13} />
              Back
            </button>
          ) : (
            <div /> // dummy separator
          )}

          {step === 1 && (
            <button
              id="setup-wizard-next-step-1-btn"
              type="button"
              disabled={!isProfileValid}
              onClick={() => setStep(2)}
              className={`h-11 px-6 rounded-sm text-[10px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-150 shadow-md ${
                isProfileValid
                  ? 'bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 active:scale-95 cursor-pointer'
                  : theme === 'dark'
                    ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    : 'bg-[#2b313f]/5 text-[#2b313f]/30 cursor-not-allowed border border-[#2b313f]/10'
              }`}
            >
              Continue
              <ChevronRight size={13} />
            </button>
          )}

          {step === 3 && (
            <button
              id="setup-wizard-finalize-portfolio-btn"
              type="button"
              disabled={!isPortfolioValid || submitting}
              onClick={handleFinalizeSetup}
              className={`h-11 px-6 rounded-sm text-[10px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-150 shadow-md ${
                isPortfolioValid && !submitting
                  ? 'bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 active:scale-95 cursor-pointer'
                  : theme === 'dark'
                    ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    : 'bg-[#2b313f]/5 text-[#2b313f]/30 cursor-not-allowed border border-[#2b313f]/10'
              }`}
            >
              {submitting ? 'Writing Config...' : 'Finalize Profile'}
              <ChevronRight size={13} />
            </button>
          )}

          {step === 4 && (
            <div className="flex gap-2">
              <button
                id="setup-wizard-skip-figma-btn"
                type="button"
                onClick={handleFinalizeSetup}
                className={`h-11 px-5 rounded-sm text-[10px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                  theme === 'dark'
                    ? 'border-white/10 text-white/60 hover:text-white'
                    : 'border-[#2b313f]/15 text-[#2b313f]/60 hover:text-[#2b313f]'
                }`}
              >
                Skip Option
              </button>
              <button
                id="setup-wizard-finalize-figma-btn"
                type="button"
                disabled={!figmaUsername || submitting}
                onClick={handleFinalizeSetup}
                className={`h-11 px-6 rounded-sm text-[10px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-150 shadow-md ${
                  figmaUsername && !submitting
                    ? 'bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 active:scale-95 cursor-pointer'
                    : theme === 'dark'
                      ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                      : 'bg-[#2b313f]/5 text-[#2b313f]/30 cursor-not-allowed border border-[#2b313f]/10'
                }`}
              >
                {submitting ? 'Writing Config...' : 'Finalize Profile'}
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {saveError && (
        <div className="text-center text-[10px] font-space font-black uppercase text-[#ff2d51] mt-3">
          {saveError}
        </div>
      )}
    </div>
  );
};
