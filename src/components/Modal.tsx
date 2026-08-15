import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface ModalProps {
  id: string;
  show: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  id,
  show,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const [isNested, setIsNested] = React.useState(false);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      // Find how many modal containers or backdrops are currently present in the DOM
      const existingBackdrops = document.querySelectorAll('.modal-backdrop-element');
      if (existingBackdrops.length > 0) {
        setIsNested(true);
      }
    } else {
      document.body.style.overflow = 'unset';
      setIsNested(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
          {/* Backdrop blur - only blur the first/outer backdrop, make subsequent ones transparent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`modal-backdrop-element absolute inset-0 transition-all duration-300 ${
              isNested 
                ? "bg-[#000000]/20 backdrop-blur-none" 
                : "bg-[#000000]/60 backdrop-blur-md"
            }`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0.08 }}
            id={id}
            className={`relative w-full ${sizes[size]} bg-white dark:bg-[#121214] ring-1 ring-[#000000]/5 dark:ring-white/10 border border-[#ECECEC]/80 dark:border-white/5 rounded-[28px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12),0_12px_24px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden z-10 flex flex-col`}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-[#ECECEC] dark:border-white/10">
              {title ? (
                <h3 className="font-space font-semibold text-lg text-[#171717] dark:text-white tracking-tight">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                id={`${id}-close-button`}
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#F7F7F8] dark:hover:bg-white/5 text-[#555555] dark:text-[#A9A9A9] transition-colors cursor-pointer"
              >
                <XMarkIcon className="h-5 w-5 stroke-2" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] no-scrollbar">
              {children}
            </div>

            {/* Footer if provided */}
            {footer && (
              <div className="p-6 border-t border-[#ECECEC] dark:border-white/10 bg-[#F7F7F8] dark:bg-white/2 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
