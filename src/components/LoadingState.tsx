import React from 'react';
import { motion } from 'motion/react';

interface LoadingStateProps {
  id?: string;
  message?: string; // Kept for interface compatibility
  theme?: 'dark' | 'light';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  id = "loading-state-container",
  theme: propTheme
}) => {
  const theme = propTheme || (localStorage.getItem("dzinr_theme") === "light" ? "light" : "dark");
  
  return (
    <div 
      id={id} 
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 px-6 overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#4A0517]"
          : "bg-white"
      }`}
    >
      <motion.div
        animate={{
          scale: [0.97, 1.03, 0.97],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
        className="h-10 flex items-center justify-center shrink-0 select-none"
      >
        <img
          src="/wordmark-logo.svg"
          alt="Dzinr"
          className="h-full object-contain"
        />
      </motion.div>
    </div>
  );
};
