import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from './Button';

interface DashboardViewProps {
  user: UserProfile;
  firebaseUser: any;
  theme: 'dark' | 'light';
  deferredPrompt: any;
  installApp: () => void;
}

const LOGO_URL = "https://dl.dropboxusercontent.com/scl/fi/3i6qc0yyzfvon6amb9md2/DZINR_LOGO.svg?rlkey=yjbgnkegl1ypfa6fr79usjol1";

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  firebaseUser,
  theme,
  deferredPrompt,
  installApp
}) => {
  return (
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
                {(user.inspirationStyles || []).map((style) => (
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
                {(user.preferredFormats || []).map((fmt) => (
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
                {(user.goals || []).map((goal) => (
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
  );
};
