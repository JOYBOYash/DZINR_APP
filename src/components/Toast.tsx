import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
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
    success: <CheckCircle className="text-green-500" size={16} />,
    error: <AlertCircle className="text-red-500" size={16} />,
    warning: <AlertCircle className="text-amber-500" size={16} />,
    info: <Info className="text-blue-500" size={16} />
  };

  const bgColors = {
    success: 'bg-[#141414] dark:bg-white border-green-500/20 text-white dark:text-[#171717]',
    error: 'bg-accent/10 dark:bg-accent border-accent/20 dark:border-transparent text-accent dark:text-white',
    warning: 'bg-[#141414] dark:bg-white border-amber-500/20 text-white dark:text-[#171717]',
    info: 'bg-[#141414] dark:bg-white border-blue-500/20 text-white dark:text-[#171717]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-[16px] border shadow-lg backdrop-blur-md pointer-events-auto ${bgColors[toast.type]}`}
    >
      <div className="flex-1 text-[15px] font-sans font-medium pr-2 break-words overflow-hidden">
        {toast.message}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
