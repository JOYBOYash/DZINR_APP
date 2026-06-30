import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface ImportMethodCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  theme: 'dark' | 'light';
}

export const ImportMethodCard: React.FC<ImportMethodCardProps> = ({ title, description, icon: Icon, onClick, theme }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center justify-center p-8 border rounded-[24px] transition-all duration-300 group cursor-pointer ${
        theme === 'dark' 
          ? 'border-white/10 hover:border-[#E85002]/50 bg-white/5 hover:bg-black/20 text-white' 
          : 'border-black/10 hover:border-[#E85002]/50 bg-black/5 hover:bg-white text-black'
      }`}
    >
      <div className="w-16 h-16 rounded-full bg-[#E85002]/10 text-[#E85002] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <h3 className="font-sans font-black text-lg tracking-tight">{title}</h3>
      <p className="text-sm opacity-60 mt-2 text-center max-w-[200px] leading-relaxed">{description}</p>
    </button>
  );
};
