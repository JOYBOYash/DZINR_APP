import React, { useState } from "react";
import { 
  ArrowLeftOnRectangleIcon, 
  MoonIcon, 
  SunIcon, 
  UserIcon, 
  Squares2X2Icon, 
  GlobeAltIcon, 
  BookmarkIcon 
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  isAuthenticated: boolean;
  theme: "dark" | "light";
  currentPage: string;
  setCurrentPage: (page: any) => void;
  toggleTheme: () => void;
  setShowLogoutConfirm: (show: boolean) => void;
  firebaseUser: any;
  isLightboxZoomed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  theme,
  currentPage,
  setCurrentPage,
  toggleTheme,
  setShowLogoutConfirm,
  firebaseUser,
  isLightboxZoomed = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.nav
      id="theme-header-navigator"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      animate={{ 
        width: isAuthenticated ? (isExpanded ? "240px" : "80px") : "100%",
        x: isLightboxZoomed ? "-260px" : "0px"
      }}
      transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 z-[120] flex border-divider-light dark:border-divider-dark backdrop-blur-md bg-white/70 dark:bg-[#121212]/70 transition-[background-color,border-color] duration-300 ${
        isAuthenticated 
          ? "hidden md:flex flex-col h-screen border-r-0 py-8 justify-between px-4 overflow-hidden" 
          : "hidden md:flex w-full px-8 py-5 border-b justify-between items-center"
      }`}
    >
      {/* Upper Logo / Links Section */}
      <div className="flex flex-col w-full items-start">
        
        {/* Brand visual logo (perfectly centered on collapse) */}
        <div className={`flex items-center mb-10 w-full ${isExpanded ? "justify-start px-1" : "justify-start ml-[4px]"}`}>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center p-2.5 shadow-md shadow-accent/25 shrink-0">
            <img
              src="/logo-and-loader.svg"
              alt="D"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Show wordmark either always on top nav, or when sidebar is expanded */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{
                duration: 0.15,
                ease: "easeOut",
                delay: 0.15
              }}
              className="h-5 flex items-center shrink-0 ml-3.5"
            >
              <img
                src="/wordmark-logo.svg"
                alt="Dzinr"
                className="h-full object-contain svg-theme-color"
              />
            </motion.div>
          )}
        </div>

        {/* Sidebar Nav Buttons */}
        {isAuthenticated && (
          <div className="flex flex-col gap-3 w-full">
            {/* Discovery Feed Tab */}
            <button
              id="header-nav-feed"
              onClick={() => setCurrentPage("feed")}
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all duration-300 cursor-pointer group overflow-hidden ${
                currentPage === "feed"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "feed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                />
              )}
              {/* Perfectly centered icon overlay when collapsed */}
              <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center shrink-0 z-10">
                <GlobeAltIcon
                  className={`w-5 h-5 ${currentPage === "feed" ? "stroke-[2.5]" : "stroke-2"}`}
                />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                      delay: 0.15
                    }}
                    className="text-sm font-space font-medium tracking-wide whitespace-nowrap pl-14 z-10"
                  >
                    Discovery Feed
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Saved Vault Tab */}
            <button
              id="header-nav-saved"
              onClick={() => setCurrentPage("saved")}
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all duration-300 cursor-pointer group overflow-hidden ${
                currentPage === "saved"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "saved" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                />
              )}
              <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center shrink-0 z-10">
                <BookmarkIcon
                  className={`w-5 h-5 ${currentPage === "saved" ? "stroke-[2.5]" : "stroke-2"}`}
                />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                      delay: 0.15
                    }}
                    className="text-sm font-space font-medium tracking-wide whitespace-nowrap pl-14 z-10"
                  >
                    Saved Vault
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Projects Tab */}
            <button
              id="header-nav-projects"
              onClick={() => setCurrentPage("projects")}
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all duration-300 cursor-pointer group overflow-hidden ${
                currentPage === "projects"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "projects" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                />
              )}
              <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center shrink-0 z-10">
                <Squares2X2Icon
                  className={`w-5 h-5 ${currentPage === "projects" ? "stroke-[2.5]" : "stroke-2"}`}
                />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                      delay: 0.15
                    }}
                    className="text-sm font-space font-medium tracking-wide whitespace-nowrap pl-14 z-10"
                  >
                    Projects
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Profile Tab */}
            <button
              id="header-nav-profile"
              onClick={() => setCurrentPage("profile")}
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all duration-300 cursor-pointer group overflow-hidden ${
                currentPage === "profile"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "profile" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                />
              )}
              <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center shrink-0 z-10">
                <UserIcon
                  className={`w-5 h-5 ${currentPage === "profile" ? "stroke-[2.5]" : "stroke-2"}`}
                />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut",
                      delay: 0.15
                    }}
                    className="text-sm font-space font-medium tracking-wide whitespace-nowrap pl-14 z-10"
                  >
                    My Profile
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}
      </div>

      {/* Lower Actions Section */}
      <div className="flex flex-col gap-4 w-full items-start">
        
        {/* Toggle Theme Action */}
        <button
          id="theme-switch-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative flex items-center w-full h-12 rounded-[18px] transition-all duration-300 cursor-pointer text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5 overflow-hidden"
        >
          <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center shrink-0">
            {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{
                  duration: 0.15,
                  ease: "easeOut",
                  delay: 0.15
                }}
                className="text-sm font-space font-medium tracking-wide whitespace-nowrap pl-14"
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Authenticated Logout Control */}
        {isAuthenticated && (
          <button
            id="logout-header-btn-sidebar"
            onClick={() => setShowLogoutConfirm(true)}
            className="relative flex items-center w-full h-12 rounded-[18px] transition-all duration-300 cursor-pointer text-accent dark:text-neutral-200 dark:hover:text-red-400 hover:bg-accent/5 dark:hover:bg-white/5 overflow-hidden"
          >
            <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center shrink-0">
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                    delay: 0.15
                  }}
                  className="text-sm font-space font-medium tracking-wide whitespace-nowrap pl-14 text-accent dark:text-neutral-200 font-semibold"
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
        {/* Guest Mode Logout Trigger */}
        {!isAuthenticated && firebaseUser && (
          <button
            id="logout-header-btn"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 border border-[#ECECEC] dark:border-white/10 text-accent dark:text-neutral-200 font-space font-bold uppercase text-xs tracking-wider rounded-[18px] hover:bg-accent/5 dark:hover:bg-white/5 bg-white dark:bg-surface-dark transition-all cursor-pointer"
          >
            <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        )}
    </motion.nav>
  );
};
