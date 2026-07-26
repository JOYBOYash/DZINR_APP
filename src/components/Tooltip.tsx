import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  theme?: "dark" | "light";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  theme = "dark"
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Position styles mapping
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  // Animation variants
  const animationVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: position === "top" ? 4 : position === "bottom" ? -4 : 0,
      x: position === "left" ? 4 : position === "right" ? -4 : 0,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.15, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: position === "top" ? 2 : position === "bottom" ? -2 : 0,
      x: position === "left" ? 2 : position === "right" ? -2 : 0,
      transition: { duration: 0.1, ease: "easeIn" }
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`hidden sm:block absolute z-[99999] pointer-events-none whitespace-nowrap px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider font-bold shadow-lg ${positionClasses[position]} ${
              theme === "dark"
                ? "bg-[#1E1E1E] border-white/10 text-white shadow-black/30"
                : "bg-white border-neutral-200 text-neutral-800 shadow-neutral-200/55"
            }`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
