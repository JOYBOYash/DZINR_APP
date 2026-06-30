import React from 'react';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  variant?: 'canvas' | 'surface' | 'elevated';
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  className = '',
  id,
  variant = 'surface',
  ...props
}) => {
  const styles = {
    canvas: "bg-canvas-light dark:bg-canvas-dark text-text-primary-light dark:text-text-primary-dark",
    surface: "bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark text-text-primary-light dark:text-text-primary-dark rounded-[24px]",
    elevated: "bg-[#FFFFFF] dark:bg-elevated-dark border border-divider-light dark:border-divider-dark text-text-primary-light dark:text-text-primary-dark rounded-[24px] shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)]"
  };

  return (
    <div
      id={id}
      className={`${styles[variant]} transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
