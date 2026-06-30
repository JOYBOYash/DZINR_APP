import React from "react";
import { motion } from "motion/react";
import { User, LayoutGrid, Compass } from "lucide-react";

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
      initial={{ y: 100, x: "-50%" }}
      animate={{ y: 0, x: "-50%" }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="md:hidden fixed bottom-6 left-1/2 z-[40] rounded-full flex items-center justify-center gap-6 px-6 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#ECECEC] dark:border-white/10 bg-white/80 dark:bg-[#5A0A20]/80 backdrop-blur-md"
      style={{ height: "64px" }}
    >
      {["feed", "profile", "projects"].map((page) => {
        const isActive = currentPage === page;
        const Icon = page === "feed" ? Compass : page === "profile" ? User : LayoutGrid;

        return (
          <button
            key={page}
            onClick={() => setCurrentPage(page as "profile" | "projects")}
            className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-300"
          >
            {isActive && (
              <motion.div
                layoutId="nav-bubble"
                className="absolute inset-0 rounded-full bg-accent shadow-[0_4px_16px_rgba(201,0,35,0.35)]"
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            )}
            <div
              className={`relative z-10 flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "text-white scale-110"
                  : "text-[#555555]/60 dark:text-[#D7D7D7]/60 hover:text-accent dark:hover:text-white"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
          </button>
        );
      })}
    </motion.nav>
  );
};
