import React from 'react';

interface AvatarProps {
  src?: string | null;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  username = 'Designer',
  size = 'md',
  theme = 'dark',
  className = '',
}) => {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
    xl: 'h-24 w-24 text-xl',
  };

  const fallbackSvg = theme === 'dark' ? '/avatar-d.svg' : '/avatar-l.svg';

  // State to check if image fails to load
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={`relative rounded-full overflow-hidden border border-[#ECECEC] dark:border-white/10 bg-accent flex items-center justify-center shrink-0 ${sizes[size]} ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={username}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="h-full w-full object-cover select-none"
        />
      ) : (
        <img
          src={fallbackSvg}
          alt="Avatar Placeholder"
          className="h-full w-full object-cover select-none"
        />
      )}
    </div>
  );
};
