import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'disabled';
  loading?: boolean;
  id: string; // Unique ID required by guidelines
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  id,
  ...props
}) => {
  // 18px border radius used for buttons as requested
  const baseStyle = "px-6 py-3.5 rounded-[18px] font-sans font-medium text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2 select-none active:scale-[0.98] outline-none cursor-pointer text-center";
  
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-[0_4px_12px_rgba(201,0,35,0.15)] focus:ring-2 focus:ring-accent/40",
    secondary: "bg-transparent text-[#171717] dark:text-white border border-[#ECECEC] dark:border-white/10 hover:bg-[#F7F7F8] dark:hover:bg-white/5",
    ghost: "bg-transparent text-[#555555] dark:text-[#D7D7D7] hover:bg-[#F7F7F8] dark:hover:bg-white/5",
    disabled: "bg-[#E7E7E7] dark:bg-white/5 text-[#888888] dark:text-white/20 cursor-not-allowed pointer-events-none"
  };

  const currentVariant = disabled ? 'disabled' : variant;

  const spinner = (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <button
      id={id}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[currentVariant]} ${className}`}
      {...props}
    >
      {loading ? spinner : null}
      {children}
    </button>
  );
};
