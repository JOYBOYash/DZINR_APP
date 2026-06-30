import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  id: string; // Unique ID required by guidelines
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-sans font-medium text-[#555555] dark:text-[#D7D7D7] ml-1"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full px-5 py-3.5 bg-transparent border border-[#ECECEC] dark:border-white/10 rounded-[18px] text-[15px] focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none font-sans placeholder:text-[#888888] dark:placeholder:text-[#A9A9A9]/50 text-[#171717] dark:text-white transition-all ${
          error ? 'border-accent focus:ring-2 focus:ring-accent/20' : ''
        } ${className}`}
        {...props}
      />
      <div className="min-h-[16px] ml-1 mt-0.5">
        {error ? (
          <span className="text-[11px] font-sans font-medium text-accent block">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-[10px] sm:text-[11px] font-sans text-[#888888] dark:text-[#A9A9A9] block">
            {helperText}
          </span>
        ) : null}
      </div>
    </div>
  );
});
