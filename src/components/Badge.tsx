import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  className = '',
}) => {
  const styles = {
    primary: "bg-accent text-white",
    secondary: "bg-[#F7F7F8] dark:bg-surface-dark text-[#171717] dark:text-white border border-[#ECECEC] dark:border-white/10",
    accent: "bg-[#ff2d51]/10 text-accent dark:text-white dark:bg-accent/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20",
    outline: "border border-[#ECECEC] dark:border-white/10 text-[#555555] dark:text-[#D7D7D7] bg-transparent",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-sans font-medium transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
