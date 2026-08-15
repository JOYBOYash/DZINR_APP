import React, { useEffect, useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, removeToast }: { toast: ToastMessage, removeToast: (id: string) => void, key?: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const icons = {
    success: <CheckCircleIcon className="text-green-500 w-4 h-4 shrink-0" />,
    error: <ExclamationCircleIcon className="text-red-500 w-4 h-4 shrink-0" />,
    warning: <ExclamationCircleIcon className="text-amber-500 w-4 h-4 shrink-0" />,
    info: <InformationCircleIcon className="text-blue-500 w-4 h-4 shrink-0" />
  };

  const bgColors = {
    success: 'bg-[#141414] dark:bg-white border-green-500/20 text-white dark:text-[#171717]',
    error: 'bg-accent/10 dark:bg-accent border-accent/20 dark:border-transparent text-accent dark:text-white',
    warning: 'bg-[#141414] dark:bg-white border-amber-500/20 text-white dark:text-[#171717]',
    info: 'bg-[#141414] dark:bg-white border-blue-500/20 text-white dark:text-[#171717]'
  };

  return (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.6, right: 0.6 }}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 80) {
          removeToast(toast.id);
        }
      }}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-[16px] border shadow-lg backdrop-blur-md pointer-events-auto cursor-grab active:cursor-grabbing select-none ${bgColors[toast.type]}`}
    >
      <div className="shrink-0 pt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 text-[15px] font-sans font-medium pr-2 break-words overflow-hidden">
        {toast.message}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
