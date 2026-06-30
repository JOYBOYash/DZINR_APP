import React from 'react';

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onClick,
  className = '',
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-xs font-sans font-medium transition-all duration-200 cursor-pointer border ${
        active
          ? 'bg-accent dark:bg-white text-white dark:text-[#171717] border-accent dark:border-white shadow-[0_4px_12px_rgba(201,0,35,0.15)] scale-[1.02]'
          : 'bg-[#F7F7F8] dark:bg-surface-dark text-[#555555] dark:text-[#D7D7D7] border-[#ECECEC] dark:border-white/10 hover:bg-[#ECECEC] dark:hover:bg-white/5'
      } ${!onClick ? 'cursor-default pointer-events-none' : 'active:scale-[0.97]'} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};
