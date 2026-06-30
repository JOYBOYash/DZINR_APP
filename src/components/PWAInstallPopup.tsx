import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Smartphone, X } from "lucide-react";
import { Button } from "./Button";

interface PWAInstallPopupProps {
  show: boolean;
  theme: "dark" | "light";
  deferredPrompt: any;
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallPopup: React.FC<PWAInstallPopupProps> = ({
  show,
  theme,
  deferredPrompt,
  onInstall,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div
          id="pwa-install-popup-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop with standard styling */}
          <motion.div
            key="pwa-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="pwa-install-popup-backdrop"
            onClick={onDismiss}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            key="pwa-modal"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm p-6 sm:p-8 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-2xl text-left"
          >
            {/* Close Button */}
            <button
              id="pwa-install-popup-close-btn"
              type="button"
              onClick={onDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-[#ECECEC] dark:border-white/10 text-[#888888] hover:text-accent dark:hover:text-white bg-white/5 cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex flex-col items-center text-center gap-5">
              {/* Visual Icon Badge */}
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-1">
                <Smartphone size={22} className="animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-space font-bold text-base uppercase tracking-wider text-accent">
                  Install Dzinr PWA
                </h3>
                <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                  Synchronize your curated feedback feed with a premium, home-screen-docked app experience.
                </p>
              </div>

              <div className="w-full text-left p-4 border border-accent/20 bg-accent/5 rounded-[18px]">
                <p className="text-xs font-space font-bold tracking-wider text-accent uppercase mb-1">
                  How to Install:
                </p>
                <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-normal">
                  {typeof window !== "undefined" &&
                  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                  !(window as any).MSStream
                    ? "iOS Safari: Tap the Share icon in your browser toolbar, then select 'Add to Home Screen'."
                    : "Click 'Install App' below to prompt your browser to install Dzinr as a standalone application."}
                </p>
              </div>

              {/* Install / Dismiss Options */}
              <div className="flex flex-col w-full gap-2.5 mt-2">
                {deferredPrompt && (
                  <Button
                    id="pwa-install-popup-actuate-btn"
                    onClick={onInstall}
                    variant="primary"
                    className="w-full h-11"
                  >
                    Install App Now
                  </Button>
                )}
                <Button
                  id="pwa-install-popup-dismiss-btn"
                  onClick={onDismiss}
                  variant="secondary"
                  className="w-full h-11"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
