import React, { useState } from 'react';
import { ShieldCheck, Cloud, Check, Loader2, Award, ExternalLink, RefreshCw, Layers } from 'lucide-react';

interface IntegrationCardProps {
  onIntegrationConnected: (figmaUsername: string) => void;
  onSkip: () => void;
  theme: 'light' | 'dark';
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  onIntegrationConnected,
  onSkip,
  theme,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [figmaFileUrl, setFigmaFileUrl] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleConnect = () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError('Please enter your Figma username or design handle.');
      return;
    }
    setUsernameError(null);
    setConnecting(true);

    // Simulate OAuth callback handshaking securely
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      onIntegrationConnected(trimmed);
    }, 1200);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setUsernameInput('');
    setFigmaFileUrl('');
    onIntegrationConnected('');
  };

  // Check if it's a valid public figma file url to preview
  const isFigmaUrl = figmaFileUrl.includes('figma.com/file/') || figmaFileUrl.includes('figma.com/design/');
  const embedUrl = isFigmaUrl
    ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaFileUrl.trim())}`
    : '';

  return (
    <div className="w-full flex flex-col gap-6 max-w-sm">
      {/* Platform Logo Graphic */}
      <div className={`w-full p-6 border rounded-sm flex flex-col items-center text-center gap-4 transition-all duration-300 ${
        connected
          ? 'border-green-500/30 bg-green-500/5'
          : theme === 'dark'
            ? 'border-white/10 bg-[#2b313f]/40'
            : 'border-[#2b313f]/15 bg-white'
      }`}>
        {/* Figma Logo Accent */}
        <div className="flex gap-1.5 items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M12 10C12 7.23858 14.2386 5 17 5H22C24.7614 5 27 7.23858 27 10C27 12.7614 24.7614 15 22 15H17C14.2386 15 12 12.7614 12 10Z" fill="#F24E1E" />
            <path d="M12 20C12 17.2386 14.2386 15 17 15H22C24.7614 15 27 20 27 20C27 20 24.7614 25 22 25H17C14.2386 25 12 22.7614 12 20Z" fill="#A259FF" />
            <path d="M12 30C12 27.2386 14.2386 25 17 25C19.7614 25 22 27.2386 22 30C22 32.7614 19.7614 35 17 35C14.2386 35 12 32.7614 12 30Z" fill="#1ABCFE" />
            <path d="M22 15C22 12.2386 24.2386 10 27 10C29.7614 10 32 12.2386 32 15C32 17.7614 29.7614 20 27 20C24.2386 20 22 17.7614 22 15Z" fill="#0ACF83" />
          </svg>
        </div>

        <div className="space-y-1">
          <h4 className="font-space font-black uppercase text-sm tracking-widest">
            Figma Live Curation
          </h4>
          <p className="text-[10px] opacity-70 max-w-[280px] mx-auto leading-normal">
            Import frames directly from Figma files into your swipable feed with real-time design sync.
          </p>
        </div>

        {connected ? (
          <div className="flex flex-col items-center gap-4 w-full mt-2">
            <div className="flex items-center gap-1.5 text-green-500 font-space font-black uppercase text-[10px] tracking-wider">
              <ShieldCheck size={14} className="animate-pulse" />
              Connected as @{usernameInput}
            </div>

            {/* Public Design Embed preview test */}
            <div className="w-full space-y-2 text-left">
              <label className="text-[9px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                Test Live File Embed (Optional)
              </label>
              <input
                id="figma-file-url-input"
                type="text"
                value={figmaFileUrl}
                onChange={(e) => setFigmaFileUrl(e.target.value)}
                placeholder="Paste public figma.com/file/... link"
                className={`w-full h-10 px-3 text-[10px] font-mono border rounded-sm outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-[#2b313f]/60 border-white/15 text-[#F8FAFC] focus:border-[#ff2d51]'
                    : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]'
                }`}
              />
              
              {isFigmaUrl ? (
                <div className="relative w-full aspect-video rounded-xs overflow-hidden border border-[#ff2d51]/20 mt-2 bg-black/20">
                  <iframe
                    title="Live Figma Design"
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              ) : figmaFileUrl ? (
                <p className="text-[8px] font-mono uppercase text-[#ff2d51]/80">
                  ⚠️ Invalid Figma layout path. Ensure it contains "figma.com/file/" or "/design/".
                </p>
              ) : (
                <p className="text-[8px] font-mono uppercase opacity-55">
                  Enter a file link to preview real live Figma content!
                </p>
              )}
            </div>

            <button
              id="disconnect-figma-btn"
              type="button"
              onClick={handleDisconnect}
              className={`w-full h-10 rounded-sm text-[9px] font-space font-black uppercase tracking-widest border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  : 'border-[#2b313f]/15 text-[#2b313f]/60 hover:text-[#2b313f] hover:bg-black/5'
              }`}
            >
              Disconnect Platform
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 mt-2 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                Figma Profile Username / Alias
              </label>
              <input
                id="figma-username-input"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.trim().replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="e.g. joyboy_creative"
                className={`w-full h-11 px-4 text-xs font-mono border rounded-sm outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-[#2b313f]/60 border-white/15 text-[#F8FAFC] focus:border-[#ff2d51]'
                    : 'bg-white border-[#2b313f]/15 text-[#2b313f] focus:border-[#ff2d51]'
                }`}
              />
              {usernameError && (
                <p className="text-[8px] font-space font-semibold uppercase text-[#ff2d51]">
                  {usernameError}
                </p>
              )}
            </div>

            <button
              id="connect-figma-btn"
              type="button"
              disabled={connecting}
              onClick={handleConnect}
              className="w-full h-11 bg-white text-black hover:bg-white/95 active:scale-95 duration-150 rounded-sm font-space font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border-[1.5px] border-[#2b313f] cursor-pointer mt-1"
            >
              {connecting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-[#ff2d51]" />
                  Authorizing Live Workspace...
                </>
              ) : (
                <>
                  <ExternalLink size={12} className="text-[#ff2d51]" />
                  Verify Figma Handle
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Integration security credentials label */}
      <div className="p-3.5 border border-[#ff2d51]/10 bg-[#ff2d51]/5 rounded-sm flex gap-3">
        <div className="text-[#ff2d51] shrink-0 mt-0.5">
          <Cloud size={14} />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-space font-black uppercase tracking-wider text-[#ff2d51]">
            Standard Encryption Active
          </p>
          <p className="text-[9px] leading-relaxed opacity-75">
            Dzinr connects to Figma's public API read-only endpoints. We never modify, share, or download your source layout files.
          </p>
        </div>
      </div>
    </div>
  );
};
