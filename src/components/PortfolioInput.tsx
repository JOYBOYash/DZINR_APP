import React, { useState, useEffect } from 'react';
import { Link, Globe, Check, AlertTriangle, HelpCircle } from 'lucide-react';

interface PortfolioInputProps {
  portfolioUrl: string;
  onUrlChange: (url: string) => void;
  onValidationStatusChange: (isValid: boolean) => void;
  theme: 'light' | 'dark';
}

interface PortfolioPreset {
  name: string;
  placeholder: string;
  color: string;
}

const PRESETS: PortfolioPreset[] = [
  { name: 'Behance', placeholder: 'behance.net/username', color: '#0057ff' },
  { name: 'Webflow', placeholder: 'webflow.com/username', color: '#4353ff' },
  { name: 'Framer', placeholder: 'framer.website/your-design', color: '#00c3ff' },
  { name: 'Notion', placeholder: 'notion.so/workspace/page-id', color: '#000000' },
  { name: 'Personal Website', placeholder: 'yourname.com', color: '#ff2d51' },
];

export const PortfolioInput: React.FC<PortfolioInputProps> = ({
  portfolioUrl,
  onUrlChange,
  onValidationStatusChange,
  theme,
}) => {
  const [localUrl, setLocalUrl] = useState(portfolioUrl);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Validate URL format (needs a basic structure or tld)
  useEffect(() => {
    const trimmed = localUrl.trim();
    if (!trimmed) {
      setUrlError('A portfolio URL is required to proceed.');
      onValidationStatusChange(false);
      return;
    }

    // Comprehensive URL pattern matching both http/https and custom domains (e.g. name.com or behance.net/user)
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    
    if (!urlPattern.test(trimmed)) {
      setUrlError('Please enter a valid website address or domain.');
      onValidationStatusChange(false);
    } else {
      setUrlError(null);
      
      // Auto prefix http if missing for standard DB records
      let finalUrl = trimmed;
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      onUrlChange(finalUrl);
      onValidationStatusChange(true);
    }
  }, [localUrl]);

  const selectPreset = (preset: PortfolioPreset) => {
    setActivePreset(preset.name);
    // Auto populate placeholder template to make it easy for user
    if (!localUrl || localUrl === 'https://') {
      setLocalUrl(preset.placeholder);
    } else {
      // If there's already something, suggest they replace or keep
      setLocalUrl(preset.placeholder);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-sm">
      {/* Quick selection presets */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
          Select Portfolio Directory
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              id={`portfolio-preset-${preset.name.toLowerCase().replace(' ', '-')}`}
              key={preset.name}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`h-9 px-3 rounded-full text-[10px] font-space font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                activePreset === preset.name
                  ? 'bg-[#ff2d51] border-[#ff2d51] text-white shadow-md'
                  : theme === 'dark'
                    ? 'border-white/10 hover:border-[#ff2d51]/50 bg-white/5 text-[#F8FAFC]'
                    : 'border-[#2b313f]/15 hover:border-[#ff2d51]/50 bg-black/5 text-[#2b313f]'
              }`}
            >
              <Globe size={11} />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main input group */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
          Portfolio URL Link
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 opacity-50">
            <Link size={15} />
          </div>
          <input
            id="portfolio-input-field"
            type="text"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            className={`w-full h-12 pl-11 pr-11 text-xs font-mono font-bold border rounded-sm outline-none transition-all ${
              theme === 'dark'
                ? 'bg-[#2b313f]/40 border-white/10 text-[#F8FAFC] focus:border-[#ff2d51]/70'
                : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]/70'
            }`}
            placeholder="e.g. behance.net/joyboy_dzinr"
          />

          <div className="absolute right-4 flex items-center justify-center">
            {urlError ? (
              <div className="w-5 h-5 rounded-full bg-[#ff2d51]/10 text-[#ff2d51] flex items-center justify-center">
                <AlertTriangle size={11} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                <Check size={11} strokeWidth={3} />
              </div>
            )}
          </div>
        </div>

        {urlError ? (
          <p className="text-[9px] font-space font-semibold uppercase tracking-wider text-[#ff2d51] mt-0.5 pl-1">
            {urlError}
          </p>
        ) : (
          <p className="text-[9px] font-mono uppercase tracking-wider opacity-40 mt-0.5 pl-1">
            Will be stored as portfolioUrl inside your user profile.
          </p>
        )}
      </div>

      {/* Helper guide box */}
      <div className="p-4 border border-[#ff2d51]/15 bg-[#ff2d51]/5 rounded-sm flex gap-3">
        <div className="text-[#ff2d51] shrink-0 mt-0.5">
          <HelpCircle size={15} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-space font-black uppercase tracking-wider text-[#ff2d51]">
            Curator Advisory
          </p>
          <p className="text-[9px] leading-relaxed opacity-75">
            Dzinr automatically parses links to cache preview shots of your works on Webflow or Behance, accelerating initial curation feedback.
          </p>
        </div>
      </div>
    </div>
  );
};
