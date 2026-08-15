import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  CheckIcon,
  PencilSquareIcon,
  Square2StackIcon,
  GlobeAltIcon,
  TrashIcon,
  ArrowPathIcon,
  HeartIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  BookmarkIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowLeftIcon,
  FaceSmileIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  AdjustmentsHorizontalIcon,
  CursorArrowRaysIcon,
  UsersIcon,
  LockClosedIcon,
  PhotoIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { UserProfile } from "../types";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";
import { designService, Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";
import { userService } from "../services/user.service";
import { authService } from "../services/auth.service";
import { auth } from "../services/firebase";
import { getApiUrl } from "../utils/api";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";

const SolidMedalIcon = ({ className, fill }: { className?: string; fill: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Ribbon paths behind */}
    <path 
      d="M7.5 11.5L4.5 21L12 18L19.5 21L16.5 11.5" 
      fill={fill} 
      fillOpacity="0.85" 
    />
    {/* Outer circle of the medal */}
    <circle cx="12" cy="8.5" r="6.5" fill={fill} />
    {/* Inner decorative circle */}
    <circle cx="12" cy="8.5" r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
    {/* Perfectly centered inner star */}
    <path 
      d="M12 6.2l.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.7-1.4.7.3-1.6-1.2-1.1 1.6-.2z" 
      fill="white" 
    />
  </svg>
);

const BadgeCard: React.FC<{ item: any; key?: any }> = ({
  item,
}) => {
  const { badge, currentValue, highestUnlockedTier, nextTier } = item;

  const level = highestUnlockedTier?.level || 0;
  const isUnlocked = level > 0;

  const tierConfigs: Record<number, { name: string; color: string; border: string; bg: string; ring: string; badgeBg: string }> = {
    0: { name: "Locked", color: "text-neutral-400 dark:text-neutral-500", border: "border-neutral-200 dark:border-white/5", bg: "bg-neutral-50 dark:bg-white/5", ring: "stroke-neutral-200 dark:stroke-white/10", badgeBg: "bg-neutral-100 dark:bg-white/5" },
    1: { name: "Bronze", color: "text-[#CD7F32]", border: "border-[#CD7F32]/20", bg: "bg-neutral-100 dark:bg-neutral-800", ring: "stroke-[#CD7F32]", badgeBg: "bg-neutral-100 dark:bg-neutral-800" },
    2: { name: "Silver", color: "text-[#8A95A5]", border: "border-[#8A95A5]/20", bg: "bg-neutral-100 dark:bg-neutral-800", ring: "stroke-[#8A95A5]", badgeBg: "bg-neutral-100 dark:bg-neutral-800" },
    3: { name: "Gold", color: "text-[#D4AF37]", border: "border-[#D4AF37]/20", bg: "bg-neutral-100 dark:bg-neutral-800", ring: "stroke-[#D4AF37]", badgeBg: "bg-neutral-100 dark:bg-neutral-800" },
    4: { name: "Platinum", color: "text-[#4E9FDF]", border: "border-[#4E9FDF]/20", bg: "bg-neutral-100 dark:bg-neutral-800", ring: "stroke-[#4E9FDF]", badgeBg: "bg-neutral-100 dark:bg-neutral-800" },
  };

  const currentConfig = tierConfigs[level];

  const renderIcon = (sizeClass = "w-9 h-9") => {
    const iconProps = { className: `${sizeClass} ${isUnlocked ? currentConfig.color : "text-neutral-400 dark:text-neutral-500"}` };
    switch (badge.icon) {
      case "Layers": return <PhotoIcon {...iconProps} />;
      case "MessageSquare": return <ChatBubbleBottomCenterTextIcon {...iconProps} />;
      case "Sparkles": return <SparklesIcon {...iconProps} />;
      case "Bookmark": return <BookmarkIcon {...iconProps} />;
      default: return <UsersIcon {...iconProps} />;
    }
  };

  const nextThreshold = nextTier ? nextTier.thresholdValue : (highestUnlockedTier ? highestUnlockedTier.thresholdValue : 1);
  const prevThreshold = level > 1 ? badge.tiers[level - 2].thresholdValue : 0;

  const range = nextThreshold - prevThreshold;
  const progressInRange = currentValue - prevThreshold;
  const percentage = nextTier
    ? Math.min(100, Math.max(0, Math.round((progressInRange / (range || 1)) * 100)))
    : 100;

  const radius = 52;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative p-6 transition-all duration-300 flex flex-col items-center text-center group bg-transparent border-none hover:scale-[1.03]"
    >
      {/* Central Crest Container with Concentric Radial Rings - Larger Scale */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-5 select-none">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            className="stroke-neutral-200/50 dark:stroke-white/5"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            className="transition-all duration-700 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={level > 0 ? (level === 1 ? "#CD7F32" : level === 2 ? "#8A95A5" : level === 3 ? "#D4AF37" : "#4E9FDF") : "#D4D4D8"}
          />
        </svg>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center border border-neutral-200/50 dark:border-white/5 transition-all duration-300 group-hover:scale-105 ${currentConfig.badgeBg}`}>
          {renderIcon()}
        </div>

        {!isUnlocked && (
          <div className="absolute bottom-2 right-2 bg-neutral-200 dark:bg-neutral-800 p-1.5 rounded-full border border-white dark:border-neutral-900 shadow-sm">
            <LockClosedIcon className="w-3.5 h-3.5 text-neutral-500" />
          </div>
        )}
      </div>

      {/* Badge Name & Description */}
      <h4 className="text-sm font-space font-bold text-[#171717] dark:text-white tracking-tight">
        {badge.name}
      </h4>

      <span className={`text-[9px] font-space font-bold uppercase tracking-wider mt-2 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${currentConfig.color}`}>
        {level > 0 ? `${currentConfig.name} Tier` : "Locked"}
      </span>

      {/* Modern, Highly Visual Tier Milestone Nodes with Icons */}
      <div className="flex items-center justify-center gap-2 mt-4 w-full">
        {[1, 2, 3, 4].map((tierLvl) => {
          const isLvlUnlocked = level >= tierLvl;
          const solidColors: Record<number, string> = {
            1: "#CD7F32", // Solid Bronze
            2: "#8A95A5", // Solid Silver
            3: "#D4AF37", // Solid Gold
            4: "#4E9FDF", // Solid Platinum
          };
          return (
            <div
              key={tierLvl}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
                isLvlUnlocked
                  ? `bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 scale-105 ring-2 ring-transparent group-hover:ring-neutral-200 dark:group-hover:ring-white/10`
                  : "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-white/5 opacity-40"
              }`}
            >
              <SolidMedalIcon 
                fill={isLvlUnlocked ? solidColors[tierLvl] : "#52525B"} 
                className="w-4.5 h-4.5" 
              />
            </div>
          );
        })}
      </div>

      <p className="text-[11px] font-space text-neutral-500 dark:text-[#A9A9A9] mt-3 font-semibold">
        {currentValue} / {nextThreshold} Completed
      </p>
    </div>
  );
};

interface DashboardViewProps {
  user: UserProfile;
  firebaseUser: any;
  theme: "dark" | "light";
  deferredPrompt: any;
  installApp: () => void;
  onViewAllProjects: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  onViewSavedVault?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  firebaseUser,
  theme,
  deferredPrompt,
  installApp,
  onViewAllProjects,
  onEditProfile,
  onLogout,
  onToggleTheme,
  onViewSavedVault,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const setUser = useAuthStore((state) => state.setUser);

  const [showCompletenessBox, setShowCompletenessBox] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Account Deletion Survey state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReasons, setDeleteReasons] = useState<string[]>([]);
  const [deleteCustomReason, setDeleteCustomReason] = useState("");
  const [deleteImprovementFeedback, setDeleteImprovementFeedback] = useState("");
  const [allowOutreach, setAllowOutreach] = useState(true);
  const [outreachEmail, setOutreachEmail] = useState(user.email || "");

  const [metrics, setMetrics] = useState<any>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [chartTab, setChartTab] = useState<"swipes" | "rating">("swipes");
  const [dashboardTab, setDashboardTab] = useState<"insights" | "achievements" | "preferences">("insights");

  const { data: badgesProgress, isLoading: isBadgesLoading } = useQuery({
    queryKey: ["userBadges", user?.id],
    queryFn: async () => {
      const { badgeService } = await import("../services/badge.service");
      return await badgeService.calculateUserBadges(user.id, user);
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    setIsMetricsLoading(true);
    const unsubscribe = discoveryService.subscribeCreatorMetrics(user.id, (updatedMetrics) => {
      setMetrics(updatedMetrics);
      setIsMetricsLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const completionPercentage = (() => {
    let score = 10;
    if (user.avatarUrl) score += 25;
    if (user.bio && user.bio.trim().length > 0) score += 20;
    if (user.portfolioUrl && user.portfolioUrl.trim().length > 0) score += 25;
    if (user.emailVerified) score += 20;
    return Math.min(100, score);
  })();

  const skippedItems = [];
  if (!user.avatarUrl) {
    skippedItems.push({ name: "Avatar", label: "Upload custom avatar" });
  }
  if (!user.bio || !user.bio.trim()) {
    skippedItems.push({ name: "Bio", label: "Add creator background bio" });
  }
  if (!user.portfolioUrl || !user.portfolioUrl.trim()) {
    skippedItems.push({ name: "Portfolio Link", label: "Add website URL" });
  }
  if (!user.emailVerified) {
    skippedItems.push({ name: "Email", label: "Verify your email address to secure your account" });
  }

  useEffect(() => {
    if (completionPercentage === 100) {
      setShowCompletenessBox(false);
    }
  }, [completionPercentage]);

  // Offboarding steps
  const [offboardingStep, setOffboardingStep] = useState<number>(1);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const handleDeleteAccount = () => {
    setOffboardingStep(1);
    setShowExitConfirm(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const surveyFeedback = {
        reasons: deleteReasons.map(r => r === "Other" ? `Other: ${deleteCustomReason}` : r),
        improvement: deleteImprovementFeedback,
        allowOutreach,
        outreachEmail: allowOutreach ? outreachEmail : ""
      };

      // 1. Delete Firestore profile and add to deleted collection with feedback survey answers
      await userService.deleteAccount(user.id, user.email || "", surveyFeedback);
      
      // Go to final step 7! Do not logout yet, we let them click "Bye" on Step 7
      setOffboardingStep(7);
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      showToast("Could not delete account. Please try again.", "error");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleFinalExit = async () => {
    setIsDeletingAccount(true);
    try {
      // Clear local storage for the deleted session profile
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Try to delete user in Firebase Auth client-side and server-side
      try {
        await fetch(getApiUrl('/api/auth/delete-user'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.id })
        });
        
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch (authDelErr) {
        console.warn("Could not delete Auth user client-side (re-authentication might be required):", authDelErr);
      }
      
      // 3. Complete logout and reset
      await authService.logout();
      useAuthStore.getState().reset();
      setShowDeleteModal(false);
      showToast("Your account has been permanently deleted. We'll miss you!", "info");
    } catch (err) {
      console.error("Failed final exit:", err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleModalCloseAttempt = () => {
    if (offboardingStep === 7 || isDeletingAccount) {
      setShowDeleteModal(false);
      setOffboardingStep(1);
      return;
    }
    setShowExitConfirm(true);
  };

  const handleNoLetMeStay = async () => {
    try {
      const { collection, doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../services/firebase");
      
      // Save support request in Firestore so we can resolve the user's issue in 48 hours
      const supportRef = doc(collection(db, 'support_requests'));
      await setDoc(supportRef, {
        userId: user.id,
        email: user.email || "anonymous@dzinr.com",
        reasons: deleteReasons.map(r => r === "Other" ? `Other: ${deleteCustomReason}` : r),
        improvementFeedback: deleteImprovementFeedback,
        allowOutreach,
        outreachEmail: allowOutreach ? outreachEmail : "",
        status: "pending",
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not save support request document:", e);
    }
    
    setShowDeleteModal(false);
    showToast("Awesome! We're on it. Your feedback has been sent, and we will contact you within 48 hours.", "success");
  };

  const handleCheckVerification = async () => {
    setIsCheckingStatus(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedFbUser = auth.currentUser;
        if (updatedFbUser?.emailVerified) {
          await userService.updateUserProfile(user.id, { emailVerified: true });
          setUser({ ...user, emailVerified: true });
          showToast("Incredible! Email verified successfully. Welcome onboard as a Verified Curator!", "success");
        } else {
          showToast("We checked, but your email is not verified yet. Please click the link inside the verification email first.", "error");
        }
      } else {
        showToast("No active user session found. Try logging in again.", "error");
      }
    } catch (err: any) {
      console.error("Failed to check verification:", err);
      showToast("Verification inquiry failed. Please try again.", "error");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      if (auth.currentUser) {
        if (auth.currentUser.email) {
          await authService.sendCustomVerificationEmail(auth.currentUser.email);
          setResendCooldown(60);
          showToast("Verification email resent! Please check your inbox and spam folders.", "success");
        } else {
          showToast("No email associated with this account.", "error");
        }
      } else {
        showToast("No active user session found. Try logging in again.", "error");
      }
    } catch (err: any) {
      console.error("Failed to send verification:", err);
      showToast("Failed to send verification email. Please try again.", "error");
    } finally {
      setIsResending(false);
    }
  };

  const handleShareClientLink = () => {
    const clientLink = `${window.location.origin}?showcase=${user.id}`;
    navigator.clipboard.writeText(clientLink);
    showToast("Portfolio Showcase link copied! Share with your clients to showcase top-liked designs and public boards.", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="w-full max-w-[1400px] mx-auto flex flex-col gap-10 px-4 sm:px-6 pt-6 sm:pt-8 md:pt-10 text-left pb-12"
    >
      {/* SECTION 1: Profile Details */}
      <div className="w-full flex flex-col md:flex-row items-center md:items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 w-full sm:w-auto">
          <div className="relative">
            {/* Avatar Bubble Area Background Color */}
            <div className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-sm -z-10 scale-105" />
            <Avatar
              src={user.avatarUrl}
              alt={user.username}
              userId={user.id}
              size="lg"
              theme={theme}
            />
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h2 className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight truncate max-w-[250px] sm:max-w-md text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
              @{user.username}
              {user.emailVerified && (
                <span className="inline-flex items-center justify-center bg-accent text-white rounded-full w-5 h-5 shrink-0 shadow-md border border-accent/20" title="Verified Curator">
                  <CheckIcon className="w-3 h-3 stroke-[3.5]" />
                </span>
              )}
            </h2>
            <div className="flex flex-col items-center sm:items-start gap-1 mt-2">
              <span className="text-xs font-mono uppercase text-[#888888] dark:text-[#A9A9A9] tracking-wider block">
                {user.role}
              </span>
              {user.portfolioUrl && (
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1 break-all"
                >
                  <GlobeAltIcon className="w-3.5 h-3.5" />
                  <span>{user.portfolioUrl}</span>
                </a>
              )}
              <span className="text-xs font-mono text-[#555555] dark:text-[#D7D7D7] block">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Desktop buttons - full text and horizontally aligned */}
        <div className="hidden md:flex flex-row items-center gap-3 md:w-auto">
          {!user.emailVerified && (
            <>
              <Button
                id="check-verification-status-btn-desktop"
                onClick={handleCheckVerification}
                loading={isCheckingStatus}
                variant="primary"
                className="py-2.5 h-auto text-xs font-semibold px-5 relative"
              >
                <EnvelopeIcon className="w-3.5 h-3.5 mr-1.5" />
                <span>Verify My Status</span>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              </Button>
              <Button
                id="resend-verification-link-btn-desktop"
                onClick={handleResendLink}
                disabled={resendCooldown > 0 || isResending}
                variant="secondary"
                className="py-2.5 h-auto text-xs font-semibold px-4"
                loading={isResending}
              >
                <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Email"}</span>
              </Button>
            </>
          )}
          <Button
            id="share-client-link-btn-desktop"
            onClick={handleShareClientLink}
            variant="primary"
            className="py-2.5 h-auto text-xs font-semibold px-6 bg-accent text-white"
          >
            <ShareIcon className="w-3.5 h-3.5 mr-1.5" />
            <span>Portfolio</span>
          </Button>
          <Button
            id="edit-profile-trigger-btn-desktop"
            onClick={onEditProfile}
            variant="secondary"
            className="py-2.5 h-auto text-xs font-semibold px-6"
          >
            <PencilSquareIcon className="w-3.5 h-3.5 mr-1.5" />
            <span>Edit Profile</span>
          </Button>
        </div>

        {/* Mobile/Tablet buttons - three icon buttons side-by-side in a perfect aligned row */}
        <div className="flex md:hidden flex-col items-center gap-3 w-full">
          {!user.emailVerified && (
            <div className="flex flex-row gap-2 w-full justify-center">
              <Button
                id="check-verification-status-btn-mobile"
                onClick={handleCheckVerification}
                loading={isCheckingStatus}
                variant="primary"
                className="flex-1 py-2.5 h-auto text-xs font-semibold px-3 relative"
              >
                <EnvelopeIcon className="w-3 h-3 mr-1" />
                <span className="truncate">Verify Status</span>
              </Button>
              <Button
                id="resend-verification-link-btn-mobile"
                onClick={handleResendLink}
                disabled={resendCooldown > 0 || isResending}
                variant="secondary"
                className="flex-1 py-2.5 h-auto text-xs font-semibold px-2"
                loading={isResending}
              >
                <span className="truncate">{resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}</span>
              </Button>
            </div>
          )}
          
          <div className="flex flex-row items-center justify-center gap-3 w-full">
            <Button
              id="share-client-link-btn-mobile"
              onClick={handleShareClientLink}
              variant="primary"
              className="w-12 h-12 !px-0 !py-0 flex items-center justify-center bg-accent text-white rounded-xl shadow-sm shrink-0"
              title="Portfolio"
            >
              <ShareIcon className="w-4 h-4" />
            </Button>
            
            <Button
              id="edit-profile-trigger-btn-mobile"
              onClick={onEditProfile}
              variant="secondary"
              className="w-12 h-12 !px-0 !py-0 flex items-center justify-center rounded-xl shadow-sm shrink-0"
              title="Edit Profile"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </Button>

            <Button
              id="dashboard-theme-toggle-mobile"
              variant="secondary"
              onClick={onToggleTheme}
              className="w-12 h-12 !px-0 !py-0 flex items-center justify-center rounded-xl shadow-sm shrink-0"
              title="Toggle Theme"
            >
              {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {user.bio ? (
        <p className="text-sm sm:text-base text-[#555555] dark:text-[#D7D7D7] leading-relaxed italic border-l-2 border-accent/20 pl-4 py-1 max-w-3xl">
          "{user.bio}"
        </p>
      ) : (
        <p className="text-sm text-accent/80 font-space uppercase tracking-wider font-semibold leading-relaxed max-w-3xl">
          Profile bio is currently empty
        </p>
      )}

      {/* Completeness bar helper */}
      {showCompletenessBox && (
        <div className="p-5 rounded-[24px] bg-[#F7F7F8] dark:bg-[#1E1E1E]/40 border border-[#ECECEC] dark:border-white/5 space-y-4 relative w-full max-w-4xl">
          <button
            onClick={() => setShowCompletenessBox(false)}
            className="absolute top-4 right-4 text-[#888888] dark:text-[#A9A9A9] hover:text-accent cursor-pointer"
            aria-label="Close completeness panel"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <div className="flex justify-between items-center pr-6">
            <span className="text-[11px] font-space font-semibold uppercase tracking-wide text-[#555555] dark:text-[#D7D7D7]">
              Setup Curation Profile
            </span>
            <span className="text-sm font-space font-bold text-accent">
              {completionPercentage}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {skippedItems.length > 0 ? (
            <div className="pt-4 space-y-1.5">
              <span className="text-[10px] font-space font-semibold text-[#888888] dark:text-[#A9A9A9] uppercase tracking-wider">Remaining steps:</span>
              <ul className="space-y-1 text-xs">
                {skippedItems.map((item, idx) => (
                  <li key={idx} className="text-amber-600 dark:text-amber-500 flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="font-sans">{item.name}: {item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="pt-4 text-sm text-green-600 dark:text-green-500 flex items-center gap-2 font-medium">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="font-sans">Profile setups locked and loaded!</span>
            </div>
          )}
        </div>
      )}

      {/* Premium Dashboard Tabs Bar */}
      <div className="w-full pt-6 mt-6">
        <div className="flex mb-8 overflow-x-auto scrollbar-none gap-2">
          {(["insights", "achievements", "preferences"] as const).map((tab) => {
            const isActive = dashboardTab === tab;
            const label = tab === "insights" ? "Design Insights" : tab === "achievements" ? "Curator Milestones" : "Curation Settings";
            const TabIcon = tab === "insights" ? ChartBarIcon : tab === "achievements" ? TrophyIcon : AdjustmentsHorizontalIcon;
            return (
              <button
                key={tab}
                onClick={() => setDashboardTab(tab)}
                className="relative py-3 px-5 flex items-center gap-2 text-xs font-space uppercase tracking-wider font-bold transition-all cursor-pointer text-[#888888] dark:text-[#A9A9A9] hover:text-accent dark:hover:text-white"
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-accent dark:text-white" : "text-[#888888]/80"}`} />
                <span className={isActive ? "text-[#171717] dark:text-white font-space font-black" : "font-space font-semibold"}>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="dashboard-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dashboardTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full"
        >
          {/* TAB 1: DESIGN INSIGHTS */}
          {dashboardTab === "insights" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-[#888888] dark:text-[#A9A9A9]">
                  Design Score Insights
                </h3>
              </div>

              {isMetricsLoading ? (
                <div className="py-8 flex items-center gap-2 text-xs font-mono text-[#888888] dark:text-[#A9A9A9] animate-pulse">
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>Computing performance metrics...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Stat 1: Total Likes */}
                  <Tooltip content="Total likes received across your published designs" theme={theme} position="top">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E1E]/40 border border-neutral-200/50 dark:border-white/5 hover:border-accent/20 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2 text-[#888888] dark:text-[#A9A9A9]">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Likes</span>
                        <HeartIcon className="w-4 h-4 text-[#C90023] fill-[#C90023]/20 shrink-0" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white leading-tight">
                        {metrics?.rightSwipes || 0}
                      </p>
                    </div>
                  </Tooltip>

                  {/* Stat 2: Dislikes */}
                  <Tooltip content="Total skips or pass ratings received" theme={theme} position="top">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E1E]/40 border border-neutral-200/50 dark:border-white/5 hover:border-neutral-500/30 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2 text-[#888888] dark:text-[#A9A9A9]">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Dislikes</span>
                        <XMarkIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white leading-tight">
                        {Math.max(0, (metrics?.totalReviews || 0) - (metrics?.rightSwipes || 0))}
                      </p>
                    </div>
                  </Tooltip>

                  {/* Stat 3: Saves */}
                  <Tooltip content="Times your designs were bookmarked to user vaults" theme={theme} position="top">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E1E]/40 border border-[#ECECEC] dark:border-white/5 hover:border-amber-500/30 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2 text-[#888888] dark:text-[#A9A9A9]">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Saves</span>
                        <BookmarkIcon className="w-4 h-4 text-amber-500 shrink-0" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white leading-tight">
                        {metrics?.saves || 0}
                      </p>
                    </div>
                  </Tooltip>

                  {/* Stat 4: Performance Score */}
                  <Tooltip content="Overall positive approval score" theme={theme} position="top">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E1E]/40 border border-neutral-200/50 dark:border-white/5 hover:border-indigo-500/30 transition-all shadow-sm">
                      <div className="flex items-center justify-between mb-2 text-[#888888] dark:text-[#A9A9A9]">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Overall Rating</span>
                        <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold font-space text-[#171717] dark:text-white leading-tight">
                        {metrics ? `${(metrics.currentScore * 100).toFixed(0)}%` : "0%"}
                      </p>
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CURATOR MILESTONES (TIERED ACHIEVEMENTS) */}
          {dashboardTab === "achievements" && (
            <div className="space-y-6">
              {isBadgesLoading ? (
                <div className="flex items-center gap-2 py-8 text-xs font-space font-semibold text-[#888888] dark:text-[#A9A9A9]">
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>Calculating tiered achievements progress...</span>
                </div>
              ) : (
                <>
                  {/* Tier Achievements Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {badgesProgress?.map((item) => (
                      <BadgeCard key={item.badge.id} item={item} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: CURATION SETTINGS (PREFERENCES) */}
          {dashboardTab === "preferences" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-[#888888] dark:text-[#A9A9A9]">
                  Curation Preferences
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Inspiration styles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-space font-semibold tracking-wider text-[#888888] dark:text-[#A9A9A9] uppercase">
                    Aesthetic Styles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(user.inspirationStyles || []).length > 0 ? (
                      (user.inspirationStyles || []).map((style) => (
                        <Badge key={style} variant="primary" className="px-3 py-1.5 text-xs">
                          {style}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm font-mono text-[#888888] italic">No styles indexed</span>
                    )}
                  </div>
                </div>

                {/* Formats */}
                <div className="space-y-3">
                  <h4 className="text-xs font-space font-semibold tracking-wider text-[#888888] dark:text-[#A9A9A9] uppercase">
                    Media Formats
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(user.preferredFormats || []).length > 0 ? (
                      (user.preferredFormats || []).map((fmt) => (
                        <Badge key={fmt} variant="secondary" className="px-3 py-1.5 text-xs">
                          {fmt}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm font-mono text-[#888888] italic">No formats indexed</span>
                    )}
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-3">
                  <h4 className="text-xs font-space font-semibold tracking-wider text-[#888888] dark:text-[#A9A9A9] uppercase">
                    Curation Goals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(user.goals || []).length > 0 ? (
                      (user.goals || []).map((goal) => (
                        <span key={goal} className="inline-flex items-center rounded-[6px] font-sans font-medium transition-colors px-3 py-1.5 text-xs bg-[#171717] text-[#FFFFFF] dark:bg-white/10 dark:text-white border border-transparent">
                          {goal}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-mono text-[#888888] italic">No goals indexed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>



      {deferredPrompt && (
        <div className="mt-6 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-accent/20 bg-accent/5 rounded-[24px]">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-accent font-space uppercase tracking-wider mb-1.5">
              <DevicePhoneMobileIcon className="w-5 h-5 animate-pulse" />
              <span>INSTALL NATIVE PWA</span>
            </div>
            <p className="text-sm text-[#555555] dark:text-[#D7D7D7] leading-relaxed max-w-xl">
              Install Dzinr directly to your home screen for high-fidelity offline curation and a seamless app-like experience.
            </p>
          </div>
          <Button
            id="dashboard-pwa-install-trigger"
            variant="secondary"
            onClick={installApp}
            className="py-2.5 px-6 shrink-0"
          >
            Install Mobile App
          </Button>
        </div>
      )}

      {/* Account Actions */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#ECECEC] dark:via-white/10 to-transparent my-10 border-none" />
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          id="dashboard-signout"
          variant="secondary"
          onClick={onLogout}
          className="w-full sm:w-auto py-3 px-8 text-[#171717] dark:text-white border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-white/5 hover:bg-[#ECECEC] dark:hover:bg-white/10"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2 inline" />
          <span className="font-semibold text-sm">Sign Out</span>
        </Button>
        
        <button
          id="delete-account-trigger"
          onClick={handleDeleteAccount}
          disabled={isDeletingAccount}
          className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#888888] hover:text-[#C90023] underline decoration-[#C90023]/30 underline-offset-4 cursor-pointer transition-colors flex items-center gap-1.5"
        >
          {isDeletingAccount ? (
            <ArrowPathIcon className="w-3 h-3 animate-spin" />
          ) : (
            <ExclamationTriangleIcon className="w-3 h-3" />
          )}
          <span>Delete my account permanently</span>
        </button>
      </div>

      {/* Account Deletion Survey Modal */}
      <Modal
        id="account-deletion-survey-modal"
        show={showDeleteModal}
        onClose={handleModalCloseAttempt}
        title={
          showExitConfirm
            ? "Exit Deletion Survey?"
            : offboardingStep === 1
            ? "We're broken to see you go"
            : offboardingStep === 2
            ? "Why are you leaving?"
            : offboardingStep === 3
            ? "We want to listen"
            : offboardingStep === 4
            ? "We'll be working on it"
            : offboardingStep === 5
            ? "Is it necessary to leave?"
            : offboardingStep === 6
            ? "Are you absolutely sure?"
            : "Farewell Curator"
        }
        size="md"
      >
        <motion.div 
          layout="size" 
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="space-y-6 text-left relative flex flex-col justify-between overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {showExitConfirm ? (
              <motion.div
                key="exit-confirmation-step"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-6 flex-grow text-center py-4 w-full"
              >
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
                  <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-space font-bold text-[#171717] dark:text-white uppercase tracking-wider">
                    Close Deletion Wizard?
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed font-sans">
                    Your current progress in the offboarding survey will be lost.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    id="exit-confirm-keep-going"
                    variant="secondary"
                    onClick={() => setShowExitConfirm(false)}
                    className="w-full py-3 text-xs font-semibold rounded-xl"
                  >
                    No, Keep Going
                  </Button>
                  <Button
                    id="exit-confirm-close"
                    onClick={() => {
                      setShowExitConfirm(false);
                      setShowDeleteModal(false);
                      setOffboardingStep(1);
                    }}
                    className="w-full py-3 bg-accent text-white text-xs font-semibold rounded-xl"
                  >
                    Yes, Exit Survey
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`step-${offboardingStep}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-6 flex-grow w-full"
              >
                {/* STEP 1: WELCOME & GRAPHIC */}
            {offboardingStep === 1 && (
              <div className="space-y-6 text-center py-4 animate-fadeIn">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-accent/5 rounded-full border border-accent/10 animate-pulse scale-110" />
                  <div className="absolute inset-2 bg-accent/5 rounded-full border border-accent/10 animate-ping opacity-20" />
                  <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center p-4 shadow-xl shadow-accent/20 hover:scale-105 transition-all duration-300 relative z-10">
                    <img
                      src="/logo-and-loader.svg"
                      alt="Dzinr"
                      className="w-full h-full object-contain animate-pulse"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[#555555] dark:text-[#A9A9A9] leading-relaxed max-w-sm mx-auto">
                    dzInr is a curated network of elite designers and style curators. Your portfolio contributions and active feedback help sustain our collective.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    id="offboard-go-to-reasons"
                    onClick={() => setOffboardingStep(2)}
                    className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
                  >
                    I have to go
                  </Button>
                  <Button
                    id="offboard-cancel-stay"
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-3.5 border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-white font-medium rounded-xl"
                  >
                    Nevermind, I'll stay
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: REASONS SELECTION */}
            {offboardingStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-2 pr-1">
                  {[
                    { id: "Confusing", label: "Confusing / hard to navigate" },
                    { id: "Missing", label: "Missing design formats/features I need" },
                    { id: "Community", label: "Not enough active community curators" },
                    { id: "Bugs", label: "Buggy or slow performance" },
                    { id: "Other", label: "Other reason..." },
                  ].map((opt) => {
                    const isSelected = deleteReasons.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setDeleteReasons((prev) => 
                            prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                          );
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? theme === "dark"
                              ? "border-white bg-white text-[#121212]"
                              : "border-accent bg-accent/5 text-accent"
                            : theme === "dark"
                              ? "border-white/10 hover:border-white/30 bg-white/2 text-[#D7D7D7]"
                              : "border-neutral-200 hover:border-accent/40 bg-white text-[#171717]"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <CheckCircleIcon
                            className={`w-3.5 h-3.5 ${theme === "dark" ? "text-[#121212]" : "text-accent"}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {deleteReasons.includes("Other") && (
                  <div className="space-y-2 animate-fadeIn">
                    <input
                      type="text"
                      value={deleteCustomReason}
                      onChange={(e) => setDeleteCustomReason(e.target.value)}
                      placeholder="Help us understand your reasons..."
                      className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none ${
                        theme === "dark"
                          ? "bg-white/2 text-white border-white/10 focus:border-white"
                          : "bg-neutral-100 text-[#171717] border-neutral-200 focus:border-accent"
                      }`}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    id="offboard-reasons-back"
                    variant="secondary"
                    onClick={() => setOffboardingStep(1)}
                    className="w-1/3 py-3 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    id="offboard-reasons-continue"
                    onClick={() => setOffboardingStep(3)}
                    disabled={deleteReasons.length === 0 || (deleteReasons.includes("Other") && !deleteCustomReason.trim())}
                    className="w-2/3 py-3 bg-accent text-white font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: THE EMOTIONAL QUESTION */}
            {offboardingStep === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    What is the one thing we could fix in our app to keep you inside? *
                  </p>
                </div>

                <textarea
                  value={deleteImprovementFeedback}
                  onChange={(e) => setDeleteImprovementFeedback(e.target.value)}
                  placeholder="Type your response here (at least 5 characters)..."
                  rows={4}
                  className={`w-full text-xs rounded-xl px-4 py-3.5 border focus:outline-none resize-none ${
                    theme === "dark"
                      ? "bg-white/2 text-white border-white/10 focus:border-white"
                      : "bg-neutral-100 text-[#171717] border-neutral-200 focus:border-accent"
                  }`}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    id="offboard-improvement-back"
                    variant="secondary"
                    onClick={() => setOffboardingStep(2)}
                    className="w-1/3 py-3 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    id="offboard-improvement-continue"
                    onClick={() => setOffboardingStep(4)}
                    disabled={deleteImprovementFeedback.trim().length < 5}
                    className="w-2/3 py-3 bg-accent text-white font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: WE'LL WORK ON IT & OUTREACH */}
            {offboardingStep === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    We are deeply committed to resolving the friction you experienced. Can we reach out to you later if we address your feedback or roll out major updates?
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-white/2 rounded-xl border border-neutral-200/50 dark:border-white/5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOutreach}
                      onChange={(e) => setAllowOutreach(e.target.checked)}
                      className="rounded border-neutral-300 text-accent focus:ring-accent accent-accent"
                    />
                    <span className="text-xs font-semibold text-[#171717] dark:text-white select-none">
                      Can we reach out to you later?
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    id="offboard-outreach-back"
                    variant="secondary"
                    onClick={() => setOffboardingStep(3)}
                    className="w-1/3 py-3 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    id="offboard-outreach-continue"
                    onClick={() => setOffboardingStep(5)}
                    className="w-2/3 py-3 bg-accent text-white font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: CHOICE BETWEEN FINAL GOODBYE & EMOTIONAL CONNECT */}
            {offboardingStep === 5 && (
              <div className="space-y-6 animate-fadeIn text-center py-2">
                <div className="space-y-2">
                  <p className="text-xs text-[#555555] dark:text-[#A9A9A9] leading-relaxed max-w-sm mx-auto">
                    If you choose to stay, we promise to prioritize your feedback and resolve your issues within 48 hours. You can continue using our app and keep all presets.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    id="offboard-stay-resolve"
                    onClick={handleNoLetMeStay}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-[#121212] font-semibold rounded-xl"
                  >
                    No, let me stay (Resolve in 48hrs)
                  </Button>
                  <Button
                    id="offboard-final-goodbye"
                    onClick={() => setOffboardingStep(6)}
                    className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
                  >
                    Final Goodbye
                  </Button>
                  <Button
                    id="offboard-choice-back"
                    variant="secondary"
                    onClick={() => setOffboardingStep(4)}
                    className="w-full py-3.5 border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-white"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: PERMANENT DELETION WARNING */}
            {offboardingStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 bg-[#C90023]/5 border border-[#C90023]/10 rounded-[16px] flex items-start gap-3">
                  <ExclamationTriangleIcon className="text-accent shrink-0 mt-0.5 w-[18px] h-[18px]" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent font-space">
                      Curated Assets Wiping
                    </h4>
                    <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                      By continuing, your curated presets, feed settings, scores, and design mockups will be completely wiped from the database. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="text-center py-1">
                  <p className="text-xs text-neutral-500">
                    Are you absolutely sure you want to permanently delete your account?
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    id="confirm-delete-account-button"
                    type="button"
                    onClick={handleConfirmDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold border-transparent rounded-xl"
                  >
                    {isDeletingAccount ? (
                      <span className="flex items-center justify-center gap-2">
                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting Your Account Data...</span>
                      </span>
                    ) : (
                      <span>Please do</span>
                    )}
                  </Button>
                  <Button
                    id="cancel-delete-account-button"
                    type="button"
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeletingAccount}
                    className="w-full py-3.5 border-neutral-200 dark:border-white/10 bg-[#F7F7F8] dark:bg-white/5 text-[#171717] dark:text-white rounded-xl"
                  >
                    Nevermind, keep my profile
                  </Button>
                  <button
                    type="button"
                    onClick={() => setOffboardingStep(5)}
                    disabled={isDeletingAccount}
                    className="text-xs text-neutral-400 hover:text-neutral-500 underline py-2 cursor-pointer text-center"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: FINAL SUCCESS / GOODBYE DISPLAY */}
            {offboardingStep === 7 && (
              <div className="space-y-6 text-center py-6 animate-fadeIn">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-green-500/10 rounded-full border border-green-500/20">
                  <FaceSmileIcon className="w-9 h-9 text-green-500" />
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-[#555555] dark:text-[#A9A9A9] leading-relaxed max-w-sm mx-auto">
                    Thanks for using us. We will always be working on updating the app for everyone and we sincerely hope you'll come back one day.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    id="offboard-final-exit-btn"
                    onClick={handleFinalExit}
                    disabled={isDeletingAccount}
                    className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
                  >
                    {isDeletingAccount ? (
                      <span className="flex items-center justify-center gap-2">
                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                        <span>Completing Deletion...</span>
                      </span>
                    ) : (
                      <span>Bye</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step bubbles/indicator at the bottom of Modal */}
          {offboardingStep < 7 && !showExitConfirm && (
            <div className="flex items-center justify-center gap-2.5 pt-4 border-t border-neutral-100 dark:border-white/5">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    s === offboardingStep
                      ? "w-6 bg-accent"
                      : s < offboardingStep
                      ? "w-2 bg-accent/40"
                      : "w-2 bg-neutral-200 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </Modal>
    </motion.div>
  );
};
