import React, { useState, useEffect } from 'react';
import { User, AlignLeft, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { userService } from '../services/user.service';

interface ProfileFormProps {
  username: string;
  bio: string;
  onUsernameChange: (val: string) => void;
  onBioChange: (val: string) => void;
  onValidationStatusChange: (isValid: boolean) => void;
  theme: 'light' | 'dark';
  userId: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  username,
  bio,
  onUsernameChange,
  onBioChange,
  onValidationStatusChange,
  theme,
  userId,
}) => {
  const [localUsername, setLocalUsername] = useState(username);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Simple validation & debounce checking
  useEffect(() => {
    const cleanUser = localUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (cleanUser.length < 3) {
      setIsAvailable(false);
      setUsernameError('Username must be at least 3 characters.');
      onValidationStatusChange(false);
      return;
    }

    if (cleanUser.length > 20) {
      setIsAvailable(false);
      setUsernameError('Username cannot exceed 20 characters.');
      onValidationStatusChange(false);
      return;
    }

    setUsernameError(null);

    // If it's the exact same username they already have, it's valid!
    if (cleanUser === username.toLowerCase()) {
      setIsAvailable(true);
      onValidationStatusChange(true);
      return;
    }

    setCheckingAvailability(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const isTaken = await userService.isUsernameTaken(cleanUser);
        if (isTaken) {
          setIsAvailable(false);
          setUsernameError('This unique username is already claimed.');
          onValidationStatusChange(false);
        } else {
          setIsAvailable(true);
          onUsernameChange(cleanUser);
          onValidationStatusChange(true);
        }
      } catch (err) {
        console.error('Username check failed:', err);
        setIsAvailable(true); // Graceful recovery
        onValidationStatusChange(true);
      } finally {
        setCheckingAvailability(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [localUsername, username]);

  return (
    <div className="w-full flex flex-col gap-6 max-w-sm">
      {/* 1. Username field */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
          Select Unique Handle
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 opacity-50">
            <User size={15} />
          </div>
          <span className="absolute left-9 text-xs font-mono opacity-40 font-bold select-none">
            @
          </span>
          <input
            id="profile-form-username-input"
            type="text"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className={`w-full h-12 pl-13 pr-11 text-xs font-mono font-bold tracking-wide border rounded-sm outline-none transition-all ${
              theme === 'dark'
                ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]/70'
                : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]/70'
            }`}
            placeholder="e.g. JoyBoy"
            maxLength={20}
          />

          {/* Validation Indicators */}
          <div className="absolute right-4 flex items-center justify-center">
            {checkingAvailability && (
              <RefreshCw size={14} className="animate-spin opacity-50" />
            )}
            {!checkingAvailability && isAvailable === true && (
              <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            {!checkingAvailability && isAvailable === false && (
              <div className="w-5 h-5 rounded-full bg-[#ff2d51]/10 text-[#ff2d51] flex items-center justify-center">
                <AlertTriangle size={12} strokeWidth={2.5} />
              </div>
            )}
          </div>
        </div>

        {usernameError ? (
          <p className="text-[9px] font-space font-semibold uppercase tracking-wider text-[#ff2d51] mt-0.5 pl-1">
            {usernameError}
          </p>
        ) : (
          <p className="text-[9px] font-mono uppercase tracking-wider opacity-40 mt-0.5 pl-1">
            Only lowercases, numbers, and underscores allowed.
          </p>
        )}
      </div>

      {/* 2. Bio text area */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
            Short Creator Bio
          </label>
          <span className="text-[9px] font-mono opacity-40">
            {bio.length}/120
          </span>
        </div>
        <div className="relative flex">
          <div className="absolute top-3.5 left-4 opacity-50">
            <AlignLeft size={15} />
          </div>
          <textarea
            id="profile-form-bio-textarea"
            value={bio}
            onChange={(e) => onBioChange(e.target.value.slice(0, 120))}
            className={`w-full min-h-[90px] p-3.5 pl-10 text-xs font-space font-medium leading-relaxed border rounded-sm outline-none resize-none transition-all ${
              theme === 'dark'
                ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]/70'
                : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]/70'
            }`}
            placeholder="Introduce your signature creative layout style, aesthetic goals, or design philosophies..."
          />
        </div>
        <p className="text-[9px] font-mono uppercase tracking-wider opacity-40 mt-0.5 pl-1">
          Tell other curators who you are in one sentence.
        </p>
      </div>
    </div>
  );
};
