import React, { useState } from "react";
import { LogOut, Moon, Sun, User, LayoutGrid, ChevronRight, ChevronLeft, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  isAuthenticated: boolean;
  theme: "dark" | "light";
  currentPage: string;
  setCurrentPage: (page: any) => void;
  toggleTheme: () => void;
  setShowLogoutConfirm: (show: boolean) => void;
  firebaseUser: any;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  theme,
  currentPage,
  setCurrentPage,
  toggleTheme,
  setShowLogoutConfirm,
  firebaseUser,
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
        width: isAuthenticated ? (isExpanded ? "240px" : "80px") : "100%" 
      }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={`fixed top-0 left-0 z-50 flex border-divider-light dark:border-divider-dark backdrop-blur-md bg-white/70 dark:bg-[#4A0517]/70 ${
        isAuthenticated 
          ? "hidden md:flex flex-col h-screen border-r py-8 justify-between px-4" 
          : "hidden md:flex w-full px-8 py-5 border-b justify-between items-center"
      }`}
    >
      {/* Upper Logo / Links Section */}
      <div className={`flex flex-col w-full ${isAuthenticated ? "items-start" : "flex-row items-center justify-between"}`}>
        
        {/* Brand visual logo */}
        <div className={`flex items-center gap-3 ${isAuthenticated ? "px-1 mb-10" : ""}`}>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center p-2.5 shadow-md shadow-accent/25 shrink-0">
            <img
              src="/logo-and-loader.svg"
              alt="D"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Show wordmark either always on top nav, or when sidebar is expanded */}
          {(!isAuthenticated || isExpanded) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-5 flex items-center shrink-0"
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
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all cursor-pointer group ${
                currentPage === "feed"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "feed" && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3.5 px-3.5">
                <Compass
                  size={20}
                  strokeWidth={currentPage === "feed" ? 2.5 : 2}
                  className="shrink-0"
                />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-sm font-space font-medium tracking-wide whitespace-nowrap"
                    >
                      Discovery Feed
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>

            {/* Profile Tab */}
            <button
              id="header-nav-profile"
              onClick={() => setCurrentPage("profile")}
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all cursor-pointer group ${
                currentPage === "profile"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "profile" && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3.5 px-3.5">
                <User
                  size={20}
                  strokeWidth={currentPage === "profile" ? 2.5 : 2}
                  className="shrink-0"
                />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-sm font-space font-medium tracking-wide whitespace-nowrap"
                    >
                      My Profile
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>

            {/* Projects Tab */}
            <button
              id="header-nav-projects"
              onClick={() => setCurrentPage("projects")}
              className={`relative flex items-center w-full h-12 rounded-[18px] transition-all cursor-pointer group ${
                currentPage === "projects"
                  ? "text-white"
                  : "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5"
              }`}
            >
              {currentPage === "projects" && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 rounded-[18px] bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.3)]"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3.5 px-3.5">
                <LayoutGrid
                  size={20}
                  strokeWidth={currentPage === "projects" ? 2.5 : 2}
                  className="shrink-0"
                />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-sm font-space font-medium tracking-wide whitespace-nowrap"
                    >
                      Projects
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Lower Actions Section */}
      <div className={`flex ${isAuthenticated ? "flex-col gap-4 w-full" : "flex-row gap-4 items-center"}`}>
        
        {/* Toggle Theme Action */}
        <button
          id="theme-switch-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`flex items-center rounded-[18px] h-12 w-full transition-all cursor-pointer ${
            isAuthenticated 
              ? "text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5" 
              : "p-3.5 border border-[#ECECEC] dark:border-white/10 text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5 bg-white dark:bg-surface-dark"
          }`}
        >
          <div className={`flex items-center gap-3.5 ${isAuthenticated ? "px-3.5" : ""}`}>
            <div className="shrink-0">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            {isAuthenticated && isExpanded && (
              <span className="text-sm font-space font-medium tracking-wide whitespace-nowrap">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </div>
        </button>

        {/* Authenticated Logout Control */}
        {isAuthenticated && (
          <button
            id="logout-header-btn-sidebar"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex md:hidden items-center w-full h-12 rounded-[18px] transition-all cursor-pointer text-accent hover:bg-accent/5"
          >
            <div className="flex items-center gap-3.5 px-3.5">
              <LogOut size={20} className="shrink-0" />
              {isExpanded && (
                <span className="text-sm font-space font-medium tracking-wide whitespace-nowrap text-accent font-semibold">
                  Log Out
                </span>
              )}
            </div>
          </button>
        )}

        {/* Guest Mode Logout Trigger */}
        {!isAuthenticated && firebaseUser && (
          <button
            id="logout-header-btn"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 border border-[#ECECEC] dark:border-white/10 text-accent font-space font-bold uppercase text-xs tracking-wider rounded-[18px] hover:bg-accent/5 bg-white dark:bg-surface-dark transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </motion.nav>
  );
};
