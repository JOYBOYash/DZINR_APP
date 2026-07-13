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
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[110] rounded-t-2xl flex items-center justify-around px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] border-t border-[#ECECEC] dark:border-white/10 bg-white/95 dark:bg-[#4A0517]/95 backdrop-blur-md"
      style={{ height: "58px" }}
    >
      {["feed", "saved", "profile", "projects"].map((page) => {
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
            className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-300"
          >
            {isActive && (
              <motion.div
                layoutId="nav-bubble"
                className="absolute inset-0 rounded-full bg-accent shadow-[0_6px_20px_rgba(201,0,35,0.45)] scale-110"
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            )}
            <div
              className={`relative z-10 flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "text-white scale-125"
                  : "text-[#555555]/60 dark:text-[#D7D7D7]/60 hover:text-accent dark:hover:text-white"
              }`}
            >
              <Icon size={isActive ? 24 : 19} strokeWidth={isActive ? 2.5 : 2} />
            </div>
          </button>
        );
      })}
    </motion.nav>
  );
};
