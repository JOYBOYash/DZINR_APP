import React from 'react';

interface PageHeaderProps {
  id: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  id,
  title,
  description,
  actions,
}) => {
  return (
    <div id={id} className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 text-left">
      <div className="flex flex-col">
        <h1 className="font-space font-bold text-2xl sm:text-3xl text-[#171717] dark:text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="font-sans text-sm text-[#555555] dark:text-[#D7D7D7] mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};
