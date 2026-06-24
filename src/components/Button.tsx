import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent-outline';
  loading?: boolean;
  id: string; // Meaningful unique ID attribute required by guidelines
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
  const baseStyle = "w-full py-3.5 px-6 font-space font-bold uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-[#ff2d51] text-[#F8FAFC] hover:bg-[#e02043] font-bold accent-glow",
    secondary: "bg-[#2b313f] text-[#F8FAFC] border border-[#F8FAFC]/20 hover:bg-[#1f242f]",
    outline: "bg-transparent text-[#2b313f] border-[1.5px] border-[#2b313f] hover:bg-[#2b313f] hover:text-[#F8FAFC]",
    'accent-outline': "bg-transparent text-[#ff2d51] border-[1.5px] border-[#ff2d51] hover:bg-[#ff2d51] hover:text-[#F8FAFC]"
  };

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
      className={`${baseStyle} ${variants[variant]} ${disabled || loading ? 'opacity-55 cursor-not-allowed active:scale-100' : ''} ${className}`}
      {...props}
    >
      {loading ? spinner : null}
      {children}
    </button>
  );
};
