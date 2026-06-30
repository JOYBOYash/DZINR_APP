import React from 'react';

interface SectionHeaderProps {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  id,
  title,
  description,
  action,
}) => {
  return (
    <div id={id} className="w-full flex items-center justify-between gap-4 mb-6">
      <div className="flex flex-col text-left">
        <h4 className="font-space font-semibold text-base sm:text-lg text-[#171717] dark:text-white tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="font-sans text-xs text-[#888888] dark:text-[#A9A9A9] mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
