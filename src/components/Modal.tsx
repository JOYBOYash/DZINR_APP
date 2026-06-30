import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
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

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#000000]/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            id={id}
            className={`relative w-full ${sizes[size]} bg-white dark:bg-elevated-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden z-10 flex flex-col`}
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
                <X className="h-5 w-5" strokeWidth={2} />
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
