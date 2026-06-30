import React from 'react';
import { motion } from 'motion/react';

interface LoaderProps {
  id: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Loader: React.FC<LoaderProps> = ({
  id,
  size = 'md',
}) => {
  const sizes = {
    sm: 'h-12 w-12',
    md: 'h-24 w-24',
    lg: 'h-36 w-36',
    xl: 'h-48 w-48',
  };

  return (
    <div id={id} className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{
          rotate: 360,
          scale: [0.95, 1.05, 0.95],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          rotate: {
            repeat: Infinity,
            duration: 8,
            ease: "linear",
          },
          scale: {
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          },
          opacity: {
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          },
        }}
        className={`relative ${sizes[size]} shrink-0`}
      >
        <img
          src="/logo-and-loader.svg"
          alt="Loading..."
          className="w-full h-full object-contain select-none svg-theme-color"
        />
      </motion.div>
    </div>
  );
};
