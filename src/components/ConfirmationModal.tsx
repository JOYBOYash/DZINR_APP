import React from "react";
import { 
  ExclamationTriangleIcon, 
  TrashIcon, 
  ArrowLeftOnRectangleIcon, 
  XMarkIcon, 
  ArrowPathIcon 
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "motion/react";

export interface ConfirmationModalProps {
  show: boolean;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  iconType?: "trash" | "warning" | "logout";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  iconType = "trash",
  isLoading = false,
  onConfirm,
  onClose,
  theme = "dark",
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (iconType) {
      case "logout":
        return <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-500 shrink-0" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />;
      case "trash":
      default:
        return <TrashIcon className="w-5 h-5 text-[#C90023] shrink-0" />;
    }
  };

  const getConfirmButtonClasses = () => {
    if (variant === "danger") {
      return "bg-[#C90023] hover:bg-red-700 text-white shadow-lg shadow-red-950/20";
    }
    if (variant === "warning") {
      return "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-950/20";
    }
    return "bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200";
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-colors overflow-hidden ${
              theme === "dark"
                ? "bg-[#141416] border-white/10 text-white shadow-black/80"
                : "bg-white border-neutral-200 text-neutral-900 shadow-xl"
            }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
                theme === "dark"
                  ? "text-neutral-400 hover:text-white hover:bg-white/10"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <XMarkIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Header Icon + Title */}
            <div className="flex items-start gap-3.5 mb-3 pr-6">
              <div
                className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center ${
                  variant === "danger"
                    ? "bg-red-500/10 border-red-500/20"
                    : variant === "warning"
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-neutral-500/10 border-neutral-500/20"
                }`}
              >
                {getIcon()}
              </div>
              <div>
                <h3 className="text-base font-bold font-space leading-snug tracking-tight">
                  {title}
                </h3>
                <div
                  className={`text-xs leading-relaxed mt-1.5 ${
                    theme === "dark" ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  {description}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold font-space transition-colors cursor-pointer border ${
                  theme === "dark"
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-800"
                }`}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-space transition-all cursor-pointer flex items-center justify-center gap-2 ${getConfirmButtonClasses()} disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
