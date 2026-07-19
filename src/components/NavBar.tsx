import React from "react";
import { motion } from "motion/react";
import { User, LayoutGrid, Compass, Bookmark } from "lucide-react";

interface NavBarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  theme: "dark" | "light";
}

export const NavBar: React.FC<NavBarProps> = ({
  currentPage,
  setCurrentPage,
  theme,
}) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[150] rounded-t-2xl flex flex-col justify-start shadow-[0_-10px_30px_rgba(0,0,0,0.08)] border-t border-[#ECECEC] dark:border-white/10 bg-white dark:bg-[#121212]"
      style={{ 
        height: "58px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      <div className="flex items-center justify-around w-full h-[58px] px-6">
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
              className="relative flex items-center justify-center w-12 h-12 cursor-pointer rounded-xl transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-accent/10 dark:bg-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <div
                className={`relative z-10 flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "text-accent dark:text-white scale-110"
                    : "text-[#555555]/60 dark:text-[#D7D7D7]/60 hover:text-accent dark:hover:text-white"
                }`}
              >
                <Icon size={isActive ? 22 : 19} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-accent dark:bg-white shadow-[0_2px_4px_rgba(201,0,35,0.4)] dark:shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
