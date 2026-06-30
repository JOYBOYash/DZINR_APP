import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { LogOut } from "lucide-react";
import { Button } from "./Button";

interface LogoutConfirmModalProps {
  show: boolean;
  theme: "dark" | "light";
  user: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  show,
  theme,
  user,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div
          id="logout-confirmation-modal-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            key="logout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            key="logout-modal"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm p-6 sm:p-8 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-2xl text-left"
          >
            <div className="flex flex-col items-center text-center gap-5">
              {/* Visual Icon Alert Accent */}
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-1">
                <LogOut size={22} />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-space font-bold text-base uppercase tracking-wider text-[#171717] dark:text-white">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                  Are you sure you want to end your creative design feedback session?
                </p>
                {user && (
                  <div className="inline-flex items-center px-3 py-1 bg-accent/5 text-accent text-[11px] font-mono rounded-full border border-accent/10 tracking-tight font-bold mt-2">
                    As {user.username}
                  </div>
                )}
              </div>

              {/* Confirm / Cancel Button Layout */}
              <div className="flex flex-col w-full gap-2.5 mt-2">
                <Button
                  id="logout-modal-confirm-btn"
                  onClick={onConfirm}
                  variant="primary"
                  className="w-full h-11"
                >
                  Yes, Sign Out
                </Button>
                <Button
                  id="logout-modal-cancel-btn"
                  onClick={onCancel}
                  variant="secondary"
                  className="w-full h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
