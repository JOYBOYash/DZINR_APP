import React from "react";
import { motion } from "motion/react";
import { User, LayoutGrid, Compass, Bookmark, Plus } from "lucide-react";

interface NavBarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  theme: "dark" | "light";
  onCreateNew?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentPage,
  setCurrentPage,
  theme,
  onCreateNew,
}) => {
  return (
    <motion.nav
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[150] rounded-none flex flex-col justify-center border-t border-neutral-200/40 dark:border-white/5 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)] pb-0"
      style={{ 
        height: "64px"
      }}
    >
      {/* Sleek Floating Creation Button using actual brand logo as background */}
      {onCreateNew && currentPage === "projects" && (
        <motion.button
          key="mobile-nav-create-btn"
          initial={{ scale: 0, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: -24 }}
          exit={{ scale: 0, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 450, damping: 22 }}
          onClick={(e) => {
            e.preventDefault();
            onCreateNew();
          }}
          className="absolute left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 z-[160]"
          title="Create New Post"
        >
          {/* Use the actual logo of the app with no background, smaller icon size */}
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
            <img
              src="/logo-and-loader.svg"
              alt="Dzinr Logo"
              className="w-full h-full object-contain dark:invert-0 invert"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Elegant Overlay Plus Icon badge */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-accent border border-white dark:border-[#121212] flex items-center justify-center shadow-md">
            <Plus size={10} strokeWidth={4} className="text-white" />
          </div>
        </motion.button>
      )}

      <div className="flex items-center justify-around w-full h-[64px] px-4">
        {["feed", "saved", "projects", "profile"].map((page) => {
          const isActive = currentPage === page;
          const Icon =
            page === "feed"
              ? Compass
              : page === "saved"
              ? Bookmark
              : page === "profile"
              ? User
              : LayoutGrid;

          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className="relative flex flex-col items-center justify-center w-14 h-14 cursor-pointer rounded-xl transition-all duration-300"
            >
              <div
                className={`relative z-10 flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "text-accent dark:text-white"
                    : "text-[#555555]/60 dark:text-[#D7D7D7]/60 hover:text-accent dark:hover:text-white"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
