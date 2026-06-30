// Motion System Design Tokens
export const motionTokens = {
  durations: {
    fast: 0.18,    // 180ms
    standard: 0.24, // 240ms
    slow: 0.3,     // 300ms
  },
  easings: {
    spring: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
    easeOut: [0.16, 1, 0.3, 1], // Custom calm cubic-bezier
    easeInOut: [0.65, 0, 0.35, 1],
  },
  transitions: {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 12 },
    },
    scaleUp: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
    },
  },
};
