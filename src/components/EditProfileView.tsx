import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  AlignLeft,
  Globe,
  Sparkles,
  Layers,
  Target,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { UserProfile } from "../types";
import { userService } from "../services/user.service";
import { useAuthStore } from "../stores/auth.store";
import { ProfileAvatar } from "./ProfileAvatar";
import { Button } from "./Button";
import { Card } from "./Card";
import { Badge } from "./Badge";

interface EditProfileViewProps {
  user: UserProfile;
  theme: "light" | "dark";
  onClose: () => void;
}

const ROLE_OPTIONS = [
  "UI Designer",
  "UX Designer",
  "Brand Designer",
  "Graphic Designer",
  "Product Designer",
  "Developer",
  "Student",
  "Other",
];

const STYLE_OPTIONS = [
  { id: "Minimal", name: "Minimal" },
  { id: "Brutalist", name: "Brutalist" },
  { id: "Neo Brutalist", name: "Neo Brutalist" },
  { id: "Luxury", name: "Luxury" },
  { id: "Editorial", name: "Editorial" },
  { id: "Glassmorphism", name: "Glassmorphism" },
  { id: "Dark UI", name: "Dark UI" },
  { id: "Futuristic", name: "Futuristic" },
  { id: "Experimental", name: "Experimental" },
  { id: "Corporate", name: "Corporate" },
];

const FORMAT_OPTIONS = [
  "UI/UX",
  "Posters",
  "Brochures",
  "Logos",
  "Infographics",
  "Banners",
  "Hoardings",
  "Packaging",
  "Landing Pages",
  "Dashboards",
  "Presentations",
  "Motion Graphics",
  "3D",
];

const GOAL_OPTIONS = [
  "Get Feedback",
  "Find Inspiration",
  "Improve My Skills",
  "Build My Portfolio",
  "Learn Design",
  "Follow Trends",
];

export const EditProfileView: React.FC<EditProfileViewProps> = ({
  user,
  theme,
  onClose,
}) => {
  const setUser = useAuthStore((state) => state.setUser);

  // Form states
  const [activeTab, setActiveTab] = useState<"basic" | "preferences" >("basic");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [usernameInput, setUsernameInput] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [role, setRole] = useState(user.role || "Brand Designer");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || "");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Preferences multi-select
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    user.inspirationStyles || [],
  );
  const [selectedFormats, setSelectedFormats] = useState<string[]>(
    user.preferredFormats || [],
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    user.goals || [],
  );

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
    const cleanUser = usernameInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (cleanUser.length < 3) {
      setIsUsernameValid(false);
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    if (cleanUser.length > 20) {
      setIsUsernameValid(false);
      setUsernameError("Username cannot exceed 20 characters.");
      return;
    }

    setUsernameError(null);

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
          setUsernameError("This unique username is already claimed.");
        } else {
          setIsUsernameValid(true);
        }
      } catch (err) {
        console.error("Username availability lookup error:", err);
        setIsUsernameValid(true);
      } finally {
        setUsernameChecking(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [usernameInput, user.username]);

  const handleToggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((s) => s !== styleId)
        : [...prev, styleId],
    );
  };

  const handleToggleFormat = (fmt: string) => {
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt],
    );
  };

  const handleToggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const hasChanges =
    avatarUrl !== (user.avatarUrl || "") ||
    usernameInput !== (user.username || "") ||
    bio !== (user.bio || "") ||
    role !== (user.role || "Brand Designer") ||
    portfolioUrl !== (user.portfolioUrl || "") ||
    JSON.stringify([...selectedStyles].sort()) !==
      JSON.stringify([...(user.inspirationStyles || [])].sort()) ||
    JSON.stringify([...selectedFormats].sort()) !==
      JSON.stringify([...(user.preferredFormats || [])].sort()) ||
    JSON.stringify([...selectedGoals].sort()) !==
      JSON.stringify([...(user.goals || [])].sort());

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUsernameValid) {
      setErrorMsg("Please resolve username validation issues first.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedData: Partial<UserProfile> = {
      avatarUrl,
      username: usernameInput
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, ""),
      bio: bio.trim(),
      role,
      portfolioUrl: portfolioUrl.trim(),
      inspirationStyles: selectedStyles,
      preferredFormats: selectedFormats,
      goals: selectedGoals,
    };

    try {
      if (user.avatarUrl && updatedData.avatarUrl !== user.avatarUrl) {
        import('../services/cloudinary.service').then(m => m.cloudinaryService.deleteImage(user.avatarUrl!));
      }
      
      await userService.updateUserProfile(user.id, updatedData);

      const updatedUser = {
        ...user,
        ...updatedData,
      };
      setUser(updatedUser);

      setSuccessMsg("Profile completed and saved successfully!");
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to update profile settings:", err);
      setErrorMsg("Could not save modifications. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col flex-1 w-full bg-white dark:bg-surface-dark"
    >
      <div className="w-full flex flex-col h-full min-h-screen pb-12">
        {/* Header */}
        <div className="border-b border-[#ECECEC] dark:border-white/10 shrink-0 w-full bg-white dark:bg-surface-dark sticky top-0 z-10">
          <div className="w-full mx-auto px-5 py-6 sm:px-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                id="back-edit-profile-btn"
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full text-[#888888] bg-[#F7F7F8] dark:bg-white/5 hover:text-accent dark:hover:text-white hover:bg-[#ECECEC] dark:hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
              <div>
                <h3 className="font-space font-bold text-base uppercase tracking-wider text-accent">
                  Edit Preset
                </h3>
              </div>
            </div>
            
            <Button
              id="save-profile-edit-btn"
              type="button"
              disabled={saving || !isUsernameValid || !hasChanges}
              onClick={handleSave}
              variant="primary"
              className="py-2 px-5 text-xs h-auto disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </div>

        {/* Tab Selector bar */}
        <div className="border-b border-[#ECECEC] dark:border-white/10 shrink-0 w-full">
          <div className="flex w-full mx-auto px-5 sm:px-8">
            <button
              id="tab-edit-basic"
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`flex-1 py-4 text-center text-xs font-space font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "basic"
                  ? "border-accent text-accent"
                  : "border-transparent text-[#888888] hover:text-[#555555]"
              }`}
            >
              1. Core Assets
            </button>
            <button
              id="tab-edit-preferences"
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`flex-1 py-4 text-center text-xs font-space font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "preferences"
                  ? "border-accent text-accent"
                  : "border-transparent text-[#888888] hover:text-[#555555]"
              }`}
            >
              2. Aesthetic Vectors
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSave}
          className="flex-1 px-5 py-8 sm:px-8 space-y-6 flex flex-col w-full max-w-3xl mx-auto"
        >
          {errorMsg && (
            <div className="p-3.5 border border-red-500/20 bg-red-500/5 text-red-500 rounded-[18px] text-xs font-mono uppercase flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 border border-green-500/20 bg-green-500/5 text-green-500 rounded-[18px] text-xs font-mono uppercase flex items-center gap-2">
              <Check size={14} className="stroke-[3]" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* Profile Avatar Upload */}
              <div className="flex flex-col items-center gap-3 py-2 border-b border-[#ECECEC] dark:border-white/5">
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7] self-start">
                  Visual Signature Avatar
                </label>
                <ProfileAvatar
                  currentAvatarUrl={avatarUrl}
                  onAvatarChanged={(url) => setAvatarUrl(url)}
                  theme={theme}
                />
              </div>

              {/* Username Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  Creative Handle Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 opacity-40 font-mono text-xs font-bold">
                    @
                  </span>
                  <input
                    id="edit-profile-username-input"
                    type="text"
                    value={usernameInput}
                    onChange={(e) =>
                      setUsernameInput(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    className="w-full h-11 pl-8 pr-10 text-xs font-mono border border-[#ECECEC] dark:border-white/10 rounded-[18px] outline-none bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent"
                    placeholder="e.g. joyboy"
                    maxLength={20}
                  />
                  <div className="absolute right-4 flex items-center">
                    {usernameChecking && (
                      <RefreshCw size={14} className="animate-spin opacity-50 text-accent" />
                    )}
                    {!usernameChecking && isUsernameValid && (
                      <Check size={14} className="text-green-500 stroke-[3]" />
                    )}
                    {!usernameChecking && !isUsernameValid && (
                      <AlertTriangle size={14} className="text-accent" />
                    )}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-[10px] font-mono text-accent pl-1">
                    {usernameError}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-1.5 relative" ref={roleDropdownRef}>
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  Creative Role Classification
                </label>
                <button
                  type="button"
                  id="edit-profile-role-select-btn"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full h-11 px-4 text-xs font-sans font-medium border border-[#ECECEC] dark:border-white/10 rounded-[18px] bg-white dark:bg-surface-dark text-[#171717] dark:text-white flex items-center justify-between outline-none cursor-pointer"
                >
                  <span>{role}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 text-[#888888] ${
                      roleDropdownOpen ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {roleDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-[calc(100%+4px)] left-0 w-full z-50 border border-[#ECECEC] dark:border-white/10 rounded-[18px] shadow-xl overflow-hidden bg-white dark:bg-surface-dark py-1 max-h-56 overflow-y-auto"
                    >
                      {ROLE_OPTIONS.map((opt) => {
                        const isSelected = role === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setRole(opt);
                              setRoleDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-xs font-sans font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-accent text-white"
                                : "hover:bg-[#F7F7F8] dark:hover:bg-white/5 text-[#555555] dark:text-[#D7D7D7]"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Portfolio URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  Portfolio Link (Web URL)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 opacity-40 text-[#888888]">
                    <Globe size={13} />
                  </span>
                  <input
                    id="edit-profile-portfolio-input"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 text-xs font-mono border border-[#ECECEC] dark:border-white/10 rounded-[18px] outline-none bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent"
                    placeholder="https://behance.net/joyboy or https://yourportfolio.com"
                  />
                </div>
              </div>

              {/* Short Bio */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                    Short Creator Bio
                  </label>
                  <span className="text-[10px] font-mono text-[#888888]">
                    {bio.length}/120
                  </span>
                </div>
                <div className="relative flex">
                  <span className="absolute top-3.5 left-4 opacity-40 text-[#888888]">
                    <AlignLeft size={13} />
                  </span>
                  <textarea
                    id="edit-profile-bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 120))}
                    className="w-full min-h-[80px] p-3.5 pl-10 text-xs font-sans border border-[#ECECEC] dark:border-white/10 rounded-[18px] outline-none bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent resize-none"
                    placeholder="Describe your design philosophies or aesthetic background in one quick sentence."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              {/* Style Presets */}
              <div className="space-y-2.5">
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-accent" />
                  <span>Aesthetic Styles (Multi-Select)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLE_OPTIONS.map((style) => {
                    const selected = selectedStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        id={`edit-style-toggle-${style.id}`}
                        type="button"
                        onClick={() => handleToggleStyle(style.id)}
                        className={`py-2 px-3 text-xs font-space font-bold border rounded-[18px] flex items-center justify-between transition-all cursor-pointer ${
                          selected
                            ? "bg-accent text-white border-accent"
                            : "bg-[#F7F7F8] dark:bg-white/5 border-[#ECECEC] dark:border-white/5 text-[#555555] dark:text-[#D7D7D7] hover:border-accent"
                        }`}
                      >
                        <span>{style.name}</span>
                        {selected && <Check size={11} className="stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Options */}
              <div className="space-y-2.5">
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7] flex items-center gap-1.5">
                  <Layers size={13} className="text-accent" />
                  <span>Media Formats (Multi-Select)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const selected = selectedFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        id={`edit-fmt-toggle-${fmt}`}
                        type="button"
                        onClick={() => handleToggleFormat(fmt)}
                        className={`py-1.5 px-3.5 text-xs font-sans font-semibold border rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                          selected
                            ? "bg-accent text-white border-accent"
                            : "bg-[#F7F7F8] dark:bg-white/5 border-[#ECECEC] dark:border-white/5 text-[#555555] dark:text-[#D7D7D7] hover:border-accent"
                        }`}
                      >
                        <span>{fmt}</span>
                        {selected && <Check size={9} className="stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goal Options */}
              <div className="space-y-2.5">
                <label className="text-xs font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7] flex items-center gap-1.5">
                  <Target size={13} className="text-accent" />
                  <span>Curation Goals (Multi-Select)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const selected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        id={`edit-goal-toggle-${goal}`}
                        type="button"
                        onClick={() => handleToggleGoal(goal)}
                        className={`py-2.5 px-3.5 text-xs font-space font-bold border rounded-[18px] flex items-center justify-between transition-all cursor-pointer ${
                          selected
                            ? "bg-accent/15 text-accent border-accent"
                            : "bg-[#F7F7F8] dark:bg-white/5 border-[#ECECEC] dark:border-white/5 text-[#555555] dark:text-[#D7D7D7] hover:border-accent"
                        }`}
                      >
                        <span>{goal}</span>
                        {selected && <Check size={12} className="stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Discard Changes Modal */}
      <AnimatePresence>
        {showConfirmClose && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmClose(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative z-10 w-full max-w-sm p-6 sm:p-8 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                <AlertTriangle size={22} />
              </div>
              <h3 className="font-space font-bold text-base uppercase tracking-wider text-[#171717] dark:text-white mb-2">
                Unsaved Changes
              </h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed mb-6">
                You have unsaved changes. Do you want to save them before leaving?
              </p>
              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  className="w-full h-11"
                  loading={saving}
                >
                  Save Changes
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="w-full h-11"
                  disabled={saving}
                >
                  Discard Changes
                </Button>
                <button
                  onClick={() => setShowConfirmClose(false)}
                  disabled={saving}
                  className="text-xs font-mono text-[#888888] hover:text-accent mt-2 cursor-pointer disabled:opacity-50"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
