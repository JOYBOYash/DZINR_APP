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
      className="md:hidden fixed bottom-5 left-4 right-4 max-w-md mx-auto z-[150] rounded-[24px] flex flex-col justify-center border border-neutral-200/50 dark:border-white/10 bg-white/85 dark:bg-[#121212]/85 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
      style={{ 
        height: "64px"
      }}
    >
      {/* Sleek Floating Creation Button emerging as a liquid teardrop */}
      {currentPage === "projects" && onCreateNew && (
        <motion.button
          key="mobile-nav-create-btn"
          initial={{ scale: 0, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: -22 }}
          exit={{ scale: 0, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={(e) => {
            e.preventDefault();
            onCreateNew();
          }}
          className="absolute left-1/2 -translate-x-1/2 w-12 h-14 rounded-t-[24px] rounded-b-[12px] bg-accent text-white shadow-[0_8px_24px_rgba(201,0,35,0.35)] hover:shadow-[0_12px_28px_rgba(201,0,35,0.45)] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 z-[160]"
          title="Create New Post"
        >
          <div className="pb-1.5 flex items-center justify-center">
            <Plus size={22} strokeWidth={3} className="text-white" />
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
