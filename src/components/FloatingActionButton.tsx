import React from 'react';

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  icon: React.ReactNode;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  id,
  icon,
  className = '',
  ...props
}) => {
  return (
    <button
      id={id}
      className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-accent hover:bg-accent-hover text-white shadow-[0_12px_36px_rgba(201,0,35,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 border border-white/10 ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
