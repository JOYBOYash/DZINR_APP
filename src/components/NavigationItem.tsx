import React from 'react';

interface NavigationItemProps {
  id: string;
  active?: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  collapsed?: boolean;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  id,
  active = false,
  label,
  icon,
  onClick,
  collapsed = false,
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[18px] transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-accent text-white shadow-[0_4px_12px_rgba(201,0,35,0.15)] scale-[1.01]'
          : 'text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="font-sans font-medium text-sm tracking-tight text-left">
          {label}
        </span>
      )}
    </button>
  );
};
