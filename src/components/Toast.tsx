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

function ToastItem({ toast, removeToast }: { toast: ToastMessage, removeToast: (id: string) => void }) {
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
    success: 'bg-[#2b313f] border-green-500/20',
    error: 'bg-[#2b313f] border-red-500/20',
    warning: 'bg-[#2b313f] border-amber-500/20',
    info: 'bg-[#2b313f] border-blue-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-3 rounded-md border shadow-lg ${bgColors[toast.type]}`}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-[11px] font-space text-white/90 pr-2">
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
