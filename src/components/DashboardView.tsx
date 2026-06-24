import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Smartphone, 
  CheckCircle2, 
  Edit3, 
  Layers, 
  Globe, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Loader2, 
  Heart, 
  Figma, 
  Briefcase,
  ChevronRight,
  X,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { EditProfileModal } from './EditProfileModal';
import { projectService, Project } from '../services/project.service';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/auth.store';
import { useToastStore } from '../stores/toast.store';

interface DashboardViewProps {
  user: UserProfile;
  firebaseUser: any;
  theme: 'dark' | 'light';
  deferredPrompt: any;
  installApp: () => void;
  onViewAllProjects: () => void; // Prop to open the new full-screen projects page!
  onLogout: () => void;
  onToggleTheme: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  firebaseUser,
  theme,
  deferredPrompt,
  installApp,
  onViewAllProjects,
  onLogout,
  onToggleTheme
}) => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const { showToast } = useToastStore();
  
  // Modal toggle state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showCompletenessBox, setShowCompletenessBox] = useState(true);
  const [activeFigmaPreviewUrl, setActiveFigmaPreviewUrl] = useState<string | null>(null);

  // Figma OAuth and manual deletion states
  const [projectDeletingId, setProjectDeletingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [authenticatingFigmaOAuth, setAuthenticatingFigmaOAuth] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [figmaImportUrl, setFigmaImportUrl] = useState('');
  const [importingFigma, setImportingFigma] = useState(false);
  const [importFigmaError, setImportFigmaError] = useState<string | null>(null);

  const isFigmaConnected = !!user.integrations?.figma?.connected;

  const handleImportFigma = async () => {
    if (!figmaImportUrl.trim()) return;

    // Check if project already exists
    const exists = projects.some(p => p.figmaUrl === figmaImportUrl.trim());
    if (exists) {
      showToast('This Figma layout is already synced to your workspace.', 'warning');
      return;
    }

    setImportingFigma(true);
    setImportFigmaError(null);
    try {
      await projectService.importFigmaFile(user.id, figmaImportUrl.trim());
      setFigmaImportUrl('');
      queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
      showToast('Figma project synced successfully.', 'success');
    } catch (err: any) {
      setImportFigmaError(err.message || 'Failed to import Figma file');
      showToast(err.message || 'Failed to import Figma file', 'error');
    } finally {
      setImportingFigma(false);
    }
  };

  // Real-time server state via TanStack Query (Figma connection only)
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['projects', user.id],
    queryFn: () => projectService.getProjects(user.id, isFigmaConnected),
    enabled: !!user.id,
  });

  // Project mutations
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
      showToast('Project removed successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to remove project.', 'error');
    }
  });

  // Calculate profile completion percentage
  const completionPercentage = (() => {
    let score = 20; // Starts at 20% for registered account details
    if (user.avatarUrl && !user.avatarUrl.includes('dicebear.com/7.x/identicon')) score += 25;
    if (user.bio && user.bio.trim().length > 0) score += 20;
    if (user.portfolioUrl && user.portfolioUrl.trim().length > 0) score += 15;
    if (isFigmaConnected) score += 20;
    return Math.min(100, score);
  })();

  // Identify skipped elements
  const skippedItems = [];
  if (!user.avatarUrl || user.avatarUrl.includes('dicebear.com/7.x/identicon')) {
    skippedItems.push({ name: 'Signature Avatar', label: 'Upload custom avatar' });
  }
  if (!user.bio || !user.bio.trim()) {
    skippedItems.push({ name: 'Creator Bio', label: 'Add creator background bio' });
  }
  if (!user.portfolioUrl || !user.portfolioUrl.trim()) {
    skippedItems.push({ name: 'Portfolio URL', label: 'Add personal website/portfolio link' });
  }
  if (!isFigmaConnected) {
    skippedItems.push({ name: 'Figma Connection', label: 'Link your active Figma workspace' });
  }

  useEffect(() => {
    if (completionPercentage === 100) {
      setShowCompletenessBox(false);
    }
  }, [completionPercentage]);

  // Handle Figma One-Click OAuth Flow
  const handleFigmaOAuth = async () => {
    setAuthenticatingFigmaOAuth(true);
    setOauthError(null);
    try {
      const origin = window.location.origin;
      const response = await fetch(`/api/auth/figma/url?origin=${encodeURIComponent(origin)}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Figma OAuth secrets are not configured in AI Studio Settings. Please add NEXT_PUBLIC_FIGMA_CLIENT_ID and NEXT_PUBLIC_FIGMA_CLIENT_SECRET.');
      }
      const { url } = await response.json();
      
      // Open the OAuth popup centered on screen
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'figma_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      if (!popup) {
        throw new Error('Popup blocked! Please enable popups for this site to log in with Figma.');
      }
    } catch (err: any) {
      console.error(err);
      setOauthError(err.message || 'Failed to initialize Figma OAuth');
      setAuthenticatingFigmaOAuth(false);
    }
  };

  // Listen to postMessage callbacks from the Figma OAuth popup window
  useEffect(() => {
    const handleFigmaMessage = async (event: MessageEvent) => {
      const origin = event.origin;

      if (event.data?.type === 'FIGMA_AUTH_SUCCESS') {
        const { accessToken, username } = event.data;
        
        try {
          // 1. Save the token securely in the private user_secrets collection
          if (accessToken) {
            await userService.saveUserSecret(user.id, { figmaAccessToken: accessToken });
          }

          // 2. Save only public meta-information in the public user profile document
          const updatedIntegrations = {
            ...user.integrations,
            figma: {
              connected: true,
              username: username || 'figma_user',
              connectedAt: new Date().toISOString()
            }
          };

          await userService.updateUserProfile(user.id, {
            integrations: updatedIntegrations
          });

          setUser({
            ...user,
            integrations: updatedIntegrations
          });
          
          setOauthError(null);
          showToast('Figma account linked successfully.', 'success');
          
          // Refresh user projects
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
          }, 300);
        } catch (err) {
          console.error('Failed to update profile with OAuth credentials:', err);
          setOauthError('Failed to save Figma credentials. Please try again.');
          showToast('Failed to save Figma credentials.', 'error');
        } finally {
          setAuthenticatingFigmaOAuth(false);
        }
      } else if (event.data?.type === 'FIGMA_AUTH_FAILURE') {
        setOauthError(event.data.error || 'Figma authentication failed.');
        showToast(event.data.error || 'Figma authentication failed.', 'error');
        setAuthenticatingFigmaOAuth(false);
      }
    };

    window.addEventListener('message', handleFigmaMessage);
    return () => window.removeEventListener('message', handleFigmaMessage);
  }, [user, setUser, queryClient, showToast]);

  // SVG Progress Ring Parameters
  const radius = 42;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - completionPercentage / 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 py-4 text-left"
    >
      {/* COLUMN 1: Profile & Figma Integration (The Left Bar) */}
      <div className={`p-6 md:p-8 border rounded-sm flex flex-col justify-between space-y-6 h-fit ${
        theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'
      }`}>
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            
            {/* Elegant SVG Completion Ring around avatar */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-3 group">
              <svg className="absolute w-full h-full transform -rotate-90">
                {/* Background Ring Track */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className={`fill-none ${theme === 'dark' ? 'stroke-white/10' : 'stroke-black/10'}`}
                  strokeWidth={strokeWidth}
                />
                {/* Active Dynamic Progress Ring */}
                <motion.circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="fill-none stroke-[#ff2d51] drop-shadow-[0_0_4px_rgba(255,45,81,0.3)]"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Profile Avatar Image */}
              <img 
                id="user-avatar-image"
                src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} 
                alt="My Representative Avatar" 
                className="w-20 h-20 bg-black/10 border border-white/10 rounded-full shadow-lg object-cover z-10"
                referrerPolicy="no-referrer"
              />
            </div>

            <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">
              Verified Designer
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-tight break-all max-w-full">
                @{user.username}
              </h2>
              {/* Verified Checkmark / Completion Badge */}
              {completionPercentage === 100 ? (
                <div className="bg-blue-500 text-white rounded-full shadow-sm flex-shrink-0">
                  <CheckCircle2 size={16} strokeWidth={2.5} className="p-0.5" />
                </div>
              ) : (
                <div className="bg-[#ff2d51] text-white text-[8px] font-space font-black px-1.5 py-0.5 rounded-full shadow-sm flex-shrink-0">
                  {completionPercentage}%
                </div>
              )}
            </div>

            {/* Profile Bio Display */}
            {user.bio ? (
              <p className={`text-xs font-medium italic opacity-85 mt-3 px-4 leading-relaxed break-words text-center border-l-2 border-[#ff2d51]/40 py-0.5 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                "{user.bio}"
              </p>
            ) : (
              <p className="text-[10px] uppercase font-space font-bold text-[#ff2d51] opacity-75 mt-3 text-center px-4 leading-relaxed">
                ⚠️ Complete profile setup to showcase your personal creator bio!
              </p>
            )}

            {/* Edit Profile Button Trigger */}
            <button
              id="edit-profile-trigger-btn"
              onClick={() => setIsEditProfileOpen(true)}
              className="mt-4 px-4 py-1.5 bg-[#ff2d51] hover:bg-[#ff2d51]/90 active:scale-95 text-white rounded-sm text-[9px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Edit3 size={11} />
              Edit Profile Presets
            </button>
          </div>

          {/* Profile Skipped Checklist Progress bar */}
          {showCompletenessBox && (
            <div className={`p-4 border rounded-sm space-y-3 relative ${
              theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-black/5 shadow-inner'
            }`}>
              <button
                onClick={() => setShowCompletenessBox(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-[#ff2d51] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={14} />
              </button>
              <div className="flex justify-between items-center pr-6">
                <span className="text-[9px] uppercase tracking-wider font-space font-black opacity-65">
                  Profile Completeness
                </span>
                <span className="text-[10px] font-mono font-bold text-[#ff2d51]">
                  {completionPercentage}%
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#ff2d51] rounded-full transition-all duration-1000"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {skippedItems.length > 0 ? (
                <div className="pt-2 space-y-1.5 border-t border-white/5">
                  <span className="text-[8px] uppercase tracking-widest font-mono opacity-40">Skipped items:</span>
                  <ul className="space-y-1 text-[9px] opacity-80 font-space font-medium">
                    {skippedItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <span>{item.name}: <span className="opacity-60 font-mono">{item.label}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="pt-2 text-[9px] text-green-500 font-mono flex items-center gap-1.5 border-t border-white/5">
                  <CheckCircle2 size={12} />
                  <span>100% Curation Profile Complete!</span>
                </div>
              )}
            </div>
          )}

          {/* Account Details */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            <div>
              <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Role Classification</div>
              <div className="text-sm font-bold uppercase font-space mt-1 text-[#ff2d51]">{user.role}</div>
            </div>

            {user.portfolioUrl && (
              <div>
                <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Portfolio Link</div>
                <a 
                  href={user.portfolioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#ff2d51] hover:underline flex items-center gap-1 mt-1 break-all"
                >
                  <Globe size={11} />
                  {user.portfolioUrl}
                </a>
              </div>
            )}

            <div>
              <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Discovery Vector</div>
              <div className="text-xs font-mono font-bold mt-1 opacity-85">{user.discoverySource}</div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest font-black opacity-40">Account Registry</div>
              <div className="text-xs font-mono opacity-65 mt-1">{user.email}</div>
            </div>
          </div>

          {/* Figma Accounts Connection Section - CLEANED AND MOVED BELOW PROFILE DETAILS */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51] block">
              Workspace Integration
            </span>

            {!isFigmaConnected ? (
              <div className={`p-5 rounded-xl space-y-4 text-left transition-colors ${
                theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white shadow-sm'}`}>
                    <Figma size={18} className="text-[#ff2d51]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-space tracking-tight">
                      Figma Integration
                    </h4>
                    <p className="text-xs opacity-70 leading-relaxed mt-0.5">
                      Sync live prototypes directly.
                    </p>
                  </div>
                </div>

                <button
                  id="figma-oauth-leftbar-btn"
                  type="button"
                  onClick={handleFigmaOAuth}
                  disabled={authenticatingFigmaOAuth}
                  className="w-full h-10 bg-[#ff2d51] hover:bg-[#ff2d51]/90 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
                  {authenticatingFigmaOAuth ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Figma size={14} />
                  )}
                  {authenticatingFigmaOAuth ? "Connecting..." : "Connect Figma"}
                </button>

                {oauthError && (
                  <p className="text-[10px] text-[#ff2d51] font-mono leading-tight">
                    ⚠ {oauthError}
                  </p>
                )}
              </div>
            ) : (
              <div className={`p-5 rounded-xl space-y-4 text-left transition-colors ${
                theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white shadow-sm'}`}>
                      <Figma size={18} className="text-[#ff2d51]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-green-500">
                        <ShieldCheck size={14} />
                        <span className="text-xs font-semibold font-space">Connected</span>
                      </div>
                      <div className="text-[10px] opacity-60 font-mono mt-0.5 truncate max-w-[100px]">@{user.integrations?.figma?.username}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Paste Figma URL to sync..."
                    value={figmaImportUrl}
                    onChange={(e) => setFigmaImportUrl(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 rounded-lg outline-none transition-all ${
                      theme === 'dark' ? 'bg-black/20 focus:ring-2 ring-[#ff2d51]/50' : 'bg-white shadow-sm focus:ring-2 ring-[#ff2d51]/30'
                    }`}
                  />
                  <button
                    onClick={handleImportFigma}
                    disabled={importingFigma || !figmaImportUrl.trim()}
                    className="w-full bg-[#ff2d51] hover:bg-[#ff2d51]/90 text-white font-medium text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                  >
                    {importingFigma ? <Loader2 size={14} className="animate-spin" /> : <Figma size={14} />}
                    {importingFigma ? 'Importing Project...' : 'Sync Project'}
                  </button>
                  {importFigmaError && (
                    <p className="text-[10px] text-[#ff2d51] font-mono break-words leading-tight">
                      ⚠ {importFigmaError}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    id="disconnect-figma-leftbar-btn"
                    type="button"
                    onClick={async () => {
                      const updatedUser = {
                        ...user,
                        integrations: {
                          ...user.integrations,
                          figma: { connected: false }
                        }
                      };
                      await userService.saveUserSecret(user.id, { figmaAccessToken: "" });
                      await userService.updateUserProfile(user.id, { integrations: updatedUser.integrations });
                      setUser(updatedUser);
                      setFigmaImportUrl('');
                      queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
                      showToast('Figma account disconnected.', 'info');
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-center ${
                      theme === 'dark' ? 'text-white/50 hover:bg-white/10 hover:text-white' : 'text-black/50 hover:bg-black/10 hover:text-black'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {deferredPrompt && (
          <div className="mt-6 p-4 border border-[#ff2d51]/20 bg-[#ff2d51]/5 flex flex-col gap-3 rounded-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ff2d51] uppercase tracking-wider">
              <Smartphone size={14} className="animate-bounce" />
              PWA App Available
            </div>
            <p className="text-[10px] opacity-75">Install Dzinr directly on home screen for immersive design curation.</p>
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

        {/* Mobile Settings Actions */}
        <div className="mt-6 pt-6 border-t border-white/5 flex md:hidden items-center justify-between gap-4">
          <button
            onClick={onToggleTheme}
            className={`flex-1 p-2.5 rounded-sm border transition-all flex justify-center ${
              theme === 'dark' 
                ? 'border-white/10 text-white/70 hover:text-white hover:bg-white/5' 
                : 'border-black/10 text-black/70 hover:text-black hover:bg-black/5'
            }`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button
            onClick={onLogout}
            className={`flex-[3] flex items-center justify-center gap-2 px-3 py-2.5 border font-space font-semibold uppercase text-[10px] tracking-wider transition-all rounded-sm ${
              theme === 'dark'
                ? 'border-white/10 text-white hover:bg-[#ff2d51] hover:text-white hover:border-[#ff2d51]'
                : 'border-black/10 text-black hover:bg-[#ff2d51] hover:text-white hover:border-[#ff2d51]'
            }`}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </div>

      {/* COLUMN 2 & 3: Main Dashboard Workspace (The Right Container) */}
      <div className="lg:col-span-2 space-y-8 flex flex-col justify-start">
        
        {/* TOP COMPONENT: Projects listing section showing up to 4 recent projects */}
        <div className={`p-6 md:p-8 border rounded-sm space-y-6 ${
          theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
            <div>
              <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">
                Synced Frames
              </span>
              <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-tight mt-1 flex items-center gap-2">
                <Briefcase className="text-[#ff2d51]" size={20} />
                Recent Synced Projects
              </h2>
            </div>

            <button
              id="view-all-projects-navigation-btn"
              onClick={onViewAllProjects}
              className="px-4 py-2 bg-[#ff2d51]/10 hover:bg-[#ff2d51] hover:text-white border border-[#ff2d51]/20 text-[#ff2d51] transition-all rounded-sm text-[10px] font-space font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer select-none"
            >
              View All Workspace ({projects.length})
              <ChevronRight size={12} />
            </button>
          </div>

          {loadingProjects ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="text-[#ff2d51] animate-spin" size={24} />
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-wider">Locating layout cards...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className={`p-8 border border-dashed rounded-sm text-center flex flex-col items-center justify-center gap-4 ${
              theme === 'dark' ? 'border-white/10 bg-black/10' : 'border-black/10 bg-white'
            }`}>
              <div className="w-12 h-12 bg-[#ff2d51]/10 rounded-full flex items-center justify-center text-[#ff2d51]">
                <Layers size={22} />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-space font-black uppercase text-xs tracking-widest text-[#ff2d51]">
                  Workspace layouts stream empty
                </h3>
                <p className="text-[10px] opacity-70 leading-relaxed">
                  {isFigmaConnected 
                    ? "Your Figma account is linked successfully. Publish layout files to display designs."
                    : "Connect your Figma account in the left bar or use manual uploads on the Projects page to build your loop."}
                </p>
                <Button 
                  id="go-to-projects-empty-btn"
                  variant="accent-outline"
                  onClick={onViewAllProjects}
                  className="mt-3 py-2 text-[9px] max-w-xs mx-auto"
                >
                  Manage & Upload Projects
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((proj) => (
                <div 
                  key={proj.id}
                  className={`border rounded-sm overflow-hidden flex flex-col justify-between transition-all duration-200 group hover:border-[#ff2d51]/30 ${
                    theme === 'dark' ? 'bg-[#2b313f]/40 border-white/5' : 'bg-white border-black/5 shadow-sm'
                  }`}
                >
                  <div className="relative aspect-video bg-black/20 overflow-hidden">
                    {failedImages[proj.id] || !proj.imageUrl ? (
                      <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center select-none relative bg-[#2b313f]/10`}>
                        <span className="text-[9px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                          Design Preview
                        </span>
                        <span className="text-[8px] opacity-50 font-mono mt-0.5">{proj.category}</span>
                      </div>
                    ) : (
                      <img 
                        src={proj.imageUrl} 
                        alt={proj.title} 
                        onError={() => setFailedImages(prev => ({ ...prev, [proj.id]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/85 text-white font-mono text-[8px] uppercase tracking-widest rounded-xs border border-white/10">
                      {proj.category}
                    </span>
                    
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#ff2d51] text-white font-space font-black text-[9px] px-2 py-0.5 rounded-sm shadow-md">
                      <Heart size={9} fill="white" />
                      <span>{proj.likes}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5 text-left flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="font-space font-black uppercase text-xs tracking-wider line-clamp-1">{proj.title}</h4>
                      <p className="text-[10px] opacity-65 leading-relaxed line-clamp-2 font-space font-medium">{proj.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {(proj.tags || []).slice(0, 1).map((t, idx) => (
                           <span key={`t-${idx}`} className="text-[7px] px-1 py-0.5 bg-[#ff2d51]/10 text-[#ff2d51] rounded-sm font-mono uppercase truncate max-w-[60px]">{t}</span>
                        ))}
                        {(proj.inspirationStyles || []).slice(0, 1).map((s, idx) => (
                           <span key={`s-${idx}`} className="text-[7px] px-1 py-0.5 bg-blue-500/10 text-blue-500 rounded-sm font-mono uppercase truncate max-w-[60px]">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-white/5 mt-3 justify-between items-center">
                      {proj.embedUrl ? (
                        <button
                          id={`preview-figma-btn-${proj.id}`}
                          onClick={() => {
                            setActiveFigmaPreviewUrl(
                              activeFigmaPreviewUrl === proj.embedUrl ? null : proj.embedUrl
                            );
                          }}
                          className={`px-3 py-1.5 rounded-sm font-space font-black uppercase text-[9px] tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                            activeFigmaPreviewUrl === proj.embedUrl
                              ? 'bg-[#ff2d51] text-white'
                              : 'bg-black/10 hover:bg-black/25 text-[#ff2d51]'
                          }`}
                        >
                          <Figma size={10} />
                          {activeFigmaPreviewUrl === proj.embedUrl ? 'Close Frame' : 'Live Embed'}
                        </button>
                      ) : (
                        <span className="text-[8px] font-mono opacity-40 uppercase">Self-contained design</span>
                      )}

                      {projectDeletingId === proj.id ? (
                        <div className="flex items-center gap-1 animate-pulse">
                          <button
                            id={`confirm-delete-btn-${proj.id}`}
                            onClick={() => {
                              deleteProjectMutation.mutate(proj.id);
                              setProjectDeletingId(null);
                            }}
                            className="px-2 py-1 bg-red-500 text-white font-space font-black text-[8px] uppercase rounded-xs cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            id={`cancel-delete-btn-${proj.id}`}
                            onClick={() => setProjectDeletingId(null)}
                            className="px-2 py-1 bg-gray-500 text-white font-space font-black text-[8px] uppercase rounded-xs cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`delete-project-btn-${proj.id}`}
                          onClick={() => setProjectDeletingId(proj.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-sm transition-all opacity-60 hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Embedded Figma Iframe inside dashboard */}
          <AnimatePresence>
            {activeFigmaPreviewUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: '360px' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full relative rounded-sm overflow-hidden border border-[#ff2d51]/20 mt-4 bg-black/35"
              >
                <iframe
                  title="Figma Layout Sync Preview"
                  src={activeFigmaPreviewUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM COMPONENT: Recommendation Preferences Block */}
        <div className={`p-6 md:p-8 border rounded-sm flex flex-col justify-between ${
          theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5 shadow-sm'
        }`}>
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-space font-bold uppercase tracking-widest text-[#ff2d51]">Aesthetic Intel</span>
              <h2 className="text-xl md:text-2xl font-black font-space uppercase tracking-tight mt-1">Recommendation Preferences</h2>
              <p className="text-xs opacity-60 mt-1">These preferences are active and used for query rankings in Firestore.</p>
            </div>

            {/* Sub-grid of selections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Inspiration Styles */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-space uppercase tracking-wider text-gray-400">Inspiration Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {(user.inspirationStyles || []).length > 0 ? (
                    (user.inspirationStyles || []).map((style) => (
                      <span 
                        key={style}
                        className="px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider bg-[#ff2d51]/10 text-[#ff2d51] border border-[#ff2d51]/20 rounded-sm"
                      >
                        {style}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono opacity-50 italic">None selected. Edit profile to choose styles.</span>
                  )}
                </div>
              </div>

              {/* Preferred Formats */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-space uppercase tracking-wider text-gray-400">Preferred Formats</h3>
                <div className="flex flex-wrap gap-2">
                  {(user.preferredFormats || []).length > 0 ? (
                    (user.preferredFormats || []).map((fmt) => (
                      <span 
                        key={fmt}
                        className="px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-sm"
                      >
                        {fmt}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono opacity-50 italic">None selected. Edit profile to choose formats.</span>
                  )}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-white/5">
                <h3 className="text-xs font-bold font-space uppercase tracking-wider text-gray-400">Creative Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {(user.goals || []).length > 0 ? (
                    (user.goals || []).map((goal) => (
                      <span 
                        key={goal}
                        className="px-2.5 py-1 text-[9px] font-space font-bold uppercase tracking-wider bg-[#ff2d51] text-white rounded-sm"
                      >
                        {goal}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono opacity-50 italic">None selected. Edit profile to choose goals.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Profile Presets Modal Drawer */}
      <EditProfileModal 
        user={user}
        theme={theme}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </motion.div>
  );
};
