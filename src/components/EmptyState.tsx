import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  id: string;
  theme?: 'dark' | 'light';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  theme = 'dark',
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  const illustration = theme === 'dark' ? '/no-data-found-d.svg' : '/no-data-found-l.svg';

  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto"
    >
      <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
        <img
          src={illustration}
          alt={title}
          className="w-full h-full object-contain select-none"
        />
      </div>
      <h3 className="font-space font-medium text-lg text-[#171717] dark:text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="font-sans text-sm text-[#555555] dark:text-[#D7D7D7] mb-6 leading-relaxed max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          id={`${id}-action`}
          onClick={onAction}
          variant="primary"
          className="w-auto px-6 py-3"
        >
          {actionIcon && <span>{actionIcon}</span>}
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
};
