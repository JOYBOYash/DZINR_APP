import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  id,
  spacing = 'lg',
  ...props
}) => {
  const spacingClasses = {
    sm: "py-4 md:py-6",
    md: "py-6 md:py-8",
    lg: "py-8 md:py-12",
    xl: "py-12 md:py-16",
  };

  return (
    <section
      id={id}
      className={`w-full ${spacingClasses[spacing]} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
};
