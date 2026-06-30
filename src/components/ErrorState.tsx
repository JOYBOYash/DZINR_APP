import React from 'react';
import { Button } from './Button';
import { RotateCw } from 'lucide-react';

interface ErrorStateProps {
  id: string;
  theme?: 'dark' | 'light';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  id,
  theme = 'dark',
  title = "Something went wrong",
  description = "We couldn't load this section. Please try again.",
  actionText = "Retry Connection",
  onAction,
}) => {
  const illustration = theme === 'dark' ? '/broken-error-d.svg' : '/broken-error-l.svg';

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
      {onAction && (
        <Button
          id={`${id}-retry`}
          onClick={onAction}
          variant="secondary"
          className="w-auto px-6 py-3 flex items-center gap-2"
        >
          <RotateCw className="h-4 w-4" strokeWidth={2} />
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
};
