import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SheetProps {
  id: string;
  show: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
}

export const Sheet: React.FC<SheetProps> = ({
  id,
  show,
  onClose,
  title,
  children,
  position = 'right',
}) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  const slideVariants = {
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
  };

  const roundedClasses = {
    right: "rounded-l-[24px]",
    left: "rounded-r-[24px]",
    bottom: "rounded-t-[24px]",
  };

  const layoutClasses = {
    right: "top-0 right-0 h-full w-full sm:max-w-md",
    left: "top-0 left-0 h-full w-full sm:max-w-md",
    bottom: "bottom-0 left-0 w-full h-[50vh] sm:h-[60vh]",
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[90] flex overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />

          {/* Sheet Body */}
          <motion.div
            variants={slideVariants[position]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
            id={id}
            className={`absolute ${layoutClasses[position]} ${roundedClasses[position]} bg-white dark:bg-surface-dark border-l dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-10`}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-[#ECECEC] dark:border-white/10">
              {title ? (
                <h3 className="font-space font-semibold text-lg text-[#171717] dark:text-white">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                id={`${id}-close`}
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#F7F7F8] dark:hover:bg-white/5 text-[#555555] dark:text-[#A9A9A9] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
