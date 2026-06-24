import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  AlignLeft, 
  Briefcase, 
  Globe, 
  Sparkles, 
  Layers, 
  Target, 
  Check, 
  Loader2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/auth.store';
import { ProfileAvatar } from './ProfileAvatar';

interface EditProfileModalProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
}

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

const STYLE_OPTIONS = [
  { id: 'Minimal', name: 'Minimal' },
  { id: 'Brutalist', name: 'Brutalist' },
  { id: 'Neo Brutalist', name: 'Neo Brutalist' },
  { id: 'Luxury', name: 'Luxury' },
  { id: 'Editorial', name: 'Editorial' },
  { id: 'Glassmorphism', name: 'Glassmorphism' },
  { id: 'Dark UI', name: 'Dark UI' },
  { id: 'Futuristic', name: 'Futuristic' },
  { id: 'Experimental', name: 'Experimental' },
  { id: 'Corporate', name: 'Corporate' }
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
  'Get Feedback',
  'Find Inspiration',
  'Improve My Skills',
  'Build My Portfolio',
  'Learn Design',
  'Follow Trends'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  theme,
  isOpen,
  onClose,
}) => {
  const setUser = useAuthStore((state) => state.setUser);

  // Form states
  const [activeTab, setActiveTab] = useState<'basic' | 'preferences'>('basic');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [usernameInput, setUsernameInput] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [role, setRole] = useState(user.role || 'Brand Designer');
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || '');
  
  // Preferences multi-select
  const [selectedStyles, setSelectedStyles] = useState<string[]>(user.inspirationStyles || []);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(user.preferredFormats || []);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user.goals || []);

  // Username validation states
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Global submit states
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validate username debounce
  useEffect(() => {
    const cleanUser = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (cleanUser.length < 3) {
      setIsUsernameValid(false);
      setUsernameError('Username must be at least 3 characters.');
      return;
    }

    if (cleanUser.length > 20) {
      setIsUsernameValid(false);
      setUsernameError('Username cannot exceed 20 characters.');
      return;
    }

    setUsernameError(null);

    // If matches user's current username, it's valid
    if (cleanUser === user.username.toLowerCase()) {
      setIsUsernameValid(true);
      return;
    }

    setUsernameChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const isTaken = await userService.isUsernameTaken(cleanUser);
        if (isTaken) {
          setIsUsernameValid(false);
          setUsernameError('This unique username is already claimed.');
        } else {
          setIsUsernameValid(true);
        }
      } catch (err) {
        console.error('Username availability lookup error:', err);
        setIsUsernameValid(true); // grace recovery
      } finally {
        setUsernameChecking(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [usernameInput, user.username]);

  const handleToggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) ? prev.filter(s => s !== styleId) : [...prev, styleId]
    );
  };

  const handleToggleFormat = (fmt: string) => {
    setSelectedFormats(prev => 
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    );
  };

  const handleToggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUsernameValid) {
      setErrorMsg('Please resolve username validation issues first.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedData: Partial<UserProfile> = {
      avatarUrl,
      username: usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      bio: bio.trim(),
      role,
      portfolioUrl: portfolioUrl.trim(),
      inspirationStyles: selectedStyles,
      preferredFormats: selectedFormats,
      goals: selectedGoals,
    };

    try {
      await userService.updateUserProfile(user.id, updatedData);
      
      // Update global store state
      const updatedUser = {
        ...user,
        ...updatedData
      };
      setUser(updatedUser);

      setSuccessMsg('Profile completed and saved successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update profile settings:', err);
      setErrorMsg('Could not save modifications. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden border-[1.5px] rounded-sm flex flex-col ${
          theme === 'dark'
            ? 'bg-[#2b313f] border-white/10 text-white'
            : 'bg-[#fcf5e2] border-[#2b313f]/20 text-[#2b313f]'
        }`}
      >
        {/* Header */}
        <div className={`p-4 md:p-6 border-b flex justify-between items-center ${
          theme === 'dark' ? 'border-white/5' : 'border-black/5'
        }`}>
          <div>
            <h3 className="font-space font-black uppercase text-base tracking-[0.1em] text-[#ff2d51]">
              Modulate Creator Profile
            </h3>
            <p className="text-[10px] opacity-60 font-mono uppercase tracking-widest mt-0.5">
              Refine signature presets & skip details
            </p>
          </div>
          <button 
            id="close-edit-profile-btn"
            onClick={onClose}
            className={`p-1.5 rounded-sm hover:opacity-100 opacity-60 transition-all ${
              theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector bar */}
        <div className={`flex border-b text-xs font-space font-black uppercase tracking-wider ${
          theme === 'dark' ? 'border-white/5 bg-black/10' : 'border-black/5 bg-black/5'
        }`}>
          <button
            id="tab-edit-basic"
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 text-center border-b-[2px] transition-all cursor-pointer ${
              activeTab === 'basic'
                ? 'border-[#ff2d51] text-[#ff2d51] font-bold'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            1. Core Assets
          </button>
          <button
            id="tab-edit-preferences"
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-3 text-center border-b-[2px] transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-[#ff2d51] text-[#ff2d51] font-bold'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            2. Curation Vector & Intel
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 rounded-sm text-[10px] font-mono uppercase flex items-center gap-2">
              <AlertTriangle size={14} />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-500 rounded-sm text-[10px] font-mono uppercase flex items-center gap-2">
              <Check size={14} />
              {successMsg}
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Profile Avatar Upload */}
              <div className="flex flex-col items-center gap-3 py-2 border-b border-white/5">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51] self-start">
                  Visual Representative Avatar
                </label>
                <ProfileAvatar 
                  currentAvatarUrl={avatarUrl}
                  onAvatarChanged={(url) => setAvatarUrl(url)}
                  theme={theme}
                />
              </div>

              {/* Username Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                  Creative Handle Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 opacity-40 font-mono text-xs font-bold">@</span>
                  <input
                    id="edit-profile-username-input"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className={`w-full h-11 pl-8 pr-10 text-xs font-mono font-bold tracking-wide border rounded-sm outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]/70'
                        : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]/70'
                    }`}
                    placeholder="e.g. JoyBoy"
                    maxLength={20}
                  />
                  <div className="absolute right-4 flex items-center">
                    {usernameChecking && <RefreshCw size={14} className="animate-spin opacity-50" />}
                    {!usernameChecking && isUsernameValid && (
                      <Check size={14} className="text-green-500" />
                    )}
                    {!usernameChecking && !isUsernameValid && (
                      <AlertTriangle size={14} className="text-[#ff2d51]" />
                    )}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-[8px] font-space font-black uppercase tracking-wider text-[#ff2d51]">
                    {usernameError}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                  Creative Role Classification
                </label>
                <select
                  id="edit-profile-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full h-11 px-3 text-xs font-space font-bold border rounded-sm outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-[#2b313f]/60 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]'
                      : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]'
                  }`}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt} value={opt} className={theme === 'dark' ? 'bg-[#2b313f]' : 'bg-white'}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Portfolio URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                  Portfolio Link (Web URL)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 opacity-40"><Globe size={13} /></span>
                  <input
                    id="edit-profile-portfolio-input"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 text-xs font-mono border rounded-sm outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]/70'
                        : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]/70'
                    }`}
                    placeholder="https://behance.net/joyboy or https://yourportfolio.com"
                  />
                </div>
              </div>

              {/* Short Bio */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                    Short Creator Bio
                  </label>
                  <span className="text-[9px] font-mono opacity-50">{bio.length}/120</span>
                </div>
                <div className="relative flex">
                  <span className="absolute top-3 left-4 opacity-40"><AlignLeft size={13} /></span>
                  <textarea
                    id="edit-profile-bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 120))}
                    className={`w-full min-h-[80px] p-3 pl-10 text-xs font-space font-medium border rounded-sm outline-none resize-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]/70'
                        : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]/70'
                    }`}
                    placeholder="Describe your design philosophies or aesthetic background in one quick sentence."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Style Presets */}
              <div className="space-y-2">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51] flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Inspiration Styles (Multi-Select)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLE_OPTIONS.map(style => {
                    const selected = selectedStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        id={`edit-style-toggle-${style.id}`}
                        type="button"
                        onClick={() => handleToggleStyle(style.id)}
                        className={`py-2 px-3 text-[10px] font-space font-black uppercase tracking-wider border rounded-sm flex items-center justify-between transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#ff2d51] text-white border-[#ff2d51]'
                            : theme === 'dark'
                              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                              : 'bg-black/5 border-black/10 hover:bg-black/10 text-gray-600'
                        }`}
                      >
                        <span>{style.name}</span>
                        {selected && <Check size={10} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Options */}
              <div className="space-y-2">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51] flex items-center gap-1.5">
                  <Layers size={12} />
                  Preferred Formats (Multi-Select)
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map(fmt => {
                    const selected = selectedFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        id={`edit-fmt-toggle-${fmt}`}
                        type="button"
                        onClick={() => handleToggleFormat(fmt)}
                        className={`py-1.5 px-3 text-[9px] font-space font-black uppercase tracking-wider border rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                          selected
                            ? 'bg-white text-[#ff2d51] border-[#ff2d51] scale-105 shadow-md font-bold'
                            : theme === 'dark'
                              ? 'bg-black/20 border-white/5 hover:bg-white/5 text-gray-400'
                              : 'bg-gray-200/50 border-black/5 hover:bg-black/5 text-gray-600'
                        }`}
                      >
                        {fmt}
                        {selected && <Check size={8} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Options */}
              <div className="space-y-2">
                <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51] flex items-center gap-1.5">
                  <Target size={12} />
                  Creative Goals (Multi-Select)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(goal => {
                    const selected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        id={`edit-goal-toggle-${goal}`}
                        type="button"
                        onClick={() => handleToggleGoal(goal)}
                        className={`py-2 px-3 text-[10px] font-space font-bold uppercase tracking-wider border rounded-sm flex items-center justify-between transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#ff2d51]/15 text-[#ff2d51] border-[#ff2d51]'
                            : theme === 'dark'
                              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                              : 'bg-black/5 border-black/10 hover:bg-black/10 text-gray-600'
                        }`}
                      >
                        <span>{goal}</span>
                        {selected && <Check size={11} className="text-[#ff2d51]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className={`p-4 md:p-6 border-t flex justify-end gap-3 ${
          theme === 'dark' ? 'border-white/5 bg-black/10' : 'border-black/5 bg-black/5'
        }`}>
          <button
            id="cancel-profile-edit-btn"
            type="button"
            onClick={onClose}
            className={`px-4 h-11 text-[10px] font-space font-black uppercase tracking-widest rounded-sm border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-white/10 text-white/70 hover:bg-white/5'
                : 'border-[#2b313f]/10 text-[#2b313f]/70 hover:bg-black/5'
            }`}
          >
            Cancel
          </button>
          
          <button
            id="save-profile-edit-btn"
            type="button"
            disabled={saving || !isUsernameValid}
            onClick={handleSave}
            className={`px-6 h-11 text-[10px] font-space font-black uppercase tracking-widest rounded-sm text-white flex items-center gap-2 transition-all cursor-pointer ${
              !isUsernameValid
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-[#ff2d51] hover:bg-[#ff2d51]/95 active:scale-95'
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Modulating...
              </>
            ) : (
              'Save Presets'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
