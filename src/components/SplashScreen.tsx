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
        animate={{ opacity: [0, 1, 1, 0], scale: [0.95, 1, 1.02, 1] }}
        transition={{ duration: 6.5, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }}
        className="flex flex-col items-center justify-center"
      >
        {/* Centered Brand Wordmark Logo */}
        <div className="h-12 flex items-center justify-center select-none">
          <img
            src="/wordmark-logo.svg"
            alt="Dzinr Logo"
            className="h-full object-contain"
          />
        </div>
      </motion.div>
    </div>
  );
};
