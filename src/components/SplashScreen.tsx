import React from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  show: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div 
      id="splash-screen-container"
      className="fixed inset-0 bg-[#4A0517] flex flex-col items-center justify-center z-[999] overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.95, 1, 1.05, 1] }}
        transition={{ duration: 6.5, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }}
        className="flex flex-col items-center gap-6"
      >
        {/* Brand visual loader */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <img
            src="/logo-and-loader.svg"
            alt="Dzinr Loader"
            className="w-full h-full object-contain animate-spin-slow"
          />
        </div>
        
        {/* Secondary Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="h-8 flex items-center justify-center"
        >
          <img
            src="/wordmark-logo.svg"
            alt="Dzinr Logo"
            className="h-full object-contain"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
