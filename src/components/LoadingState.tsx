import React from 'react';
import { motion } from 'motion/react';

interface LoadingStateProps {
  id?: string;
  message?: string;
}

const LOGO_URL = "https://dl.dropboxusercontent.com/scl/fi/3i6qc0yyzfvon6amb9md2/DZINR_LOGO.svg?rlkey=yjbgnkegl1ypfa6fr79usjol1";

export const LoadingState: React.FC<LoadingStateProps> = ({
  id = "loading-state-container",
  message = "Verifying Credentials"
}) => {
  return (
    <div 
      id={id} 
      className="fixed inset-0 bg-[#2b313f] flex flex-col items-center justify-center z-50 text-[#F8FAFC] px-6 text-center overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 max-w-sm"
      >
        {/* Logo Frame with blinking logo */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <motion.div 
            id="loading-logo-image"
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
            className="w-20 h-20 bg-[#ff2d51] accent-glow"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-black font-space uppercase tracking-[0.25em] text-[#F8FAFC]">
            DZINR
          </h1>
          <div className="text-[10px] font-space font-medium uppercase tracking-[0.2em] text-[#ff2d51]/80">
            {message}...
          </div>
        </div>

        {/* Infinity symbol loading indicator */}
        <div className="mt-2 flex justify-center items-center h-8">
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
};
