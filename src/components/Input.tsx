import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string; // Meaningful unique ID attribute required by guidelines
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label ? (
        <label 
          htmlFor={id} 
          className="text-[10px] font-space font-bold uppercase tracking-widest text-[#2b313f]/60 dark:text-[#F8FAFC]/60"
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={`w-full px-4 py-3 bg-white border border-[#2b313f]/20 text-sm focus:border-[#ff2d51] focus:outline-none uppercase tracking-wider font-space placeholder-[#2b313f]/40 text-[#2b313f] transition-all ${
          error ? 'border-[#ff2d51] focus:ring-1 focus:ring-[#ff2d51]' : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-[10px] font-space font-medium uppercase tracking-wider text-[#ff2d51]">
          {error}
        </span>
      ) : null}
    </div>
  );
};
