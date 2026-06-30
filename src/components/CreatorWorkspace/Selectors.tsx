import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  theme: "dark" | "light";
}

export const CategorySelector: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  theme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
      <label className="text-xs font-space font-semibold uppercase text-[#555555] dark:text-[#D7D7D7]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4.5 py-3.5 border border-[#ECECEC] dark:border-white/10 rounded-[18px] text-sm font-sans bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent dark:focus:border-accent flex items-center justify-between outline-none cursor-pointer select-none transition-all"
      >
        <span className={value ? "" : "text-[#888888]"}>
          {value || `Select ${label}`}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : "text-[#888888]"}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 w-full z-50 border rounded-2xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto bg-white dark:bg-surface-dark border-[#ECECEC] dark:border-white/10 shadow-black/10 dark:shadow-black/40"
        >
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-sans font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-[#F7F7F8] dark:hover:bg-white/5 text-[#171717] dark:text-white"
                }`}
              >
                <span>{opt}</span>
                {isSelected && <Check size={14} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  theme: "dark" | "light";
}

export const TagSelector: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  theme,
}) => {
  const toggleSelection = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((i) => i !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-sans font-bold tracking-wider opacity-60">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleSelection(opt)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded-[20px] transition-all cursor-pointer border ${
                isSelected
                  ? "bg-[#E85002] border-[#E85002] text-white"
                  : theme === "dark"
                    ? "border-white/10 text-white/70 hover:bg-white/5"
                    : "border-black/10 text-black/70 hover:bg-black/5"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
