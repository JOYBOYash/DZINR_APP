import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string; // Meaningful unique ID required
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  id,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      id={id}
      className={`bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark rounded-[24px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-200 ${
        hoverable ? 'hover:translate-y-[-2px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-none' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
