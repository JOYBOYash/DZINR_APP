import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Bookmark, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ExternalLink, 
  Share2, 
  Compass, 
  Award,
  Loader2,
  FolderOpen
} from "lucide-react";
import { designService, Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { userService } from "../services/user.service";
import { UserProfile } from "../types";
import { formatLikesCount } from "../utils/likes";
import { useToastStore } from "../stores/toast.store";
import { DesignCarousel } from "./DesignCarousel";

interface ClientShowcaseViewProps {
  userId: string;
  theme: "dark" | "light";
  onClose: () => void;
}

export const ClientShowcaseView: React.FC<ClientShowcaseViewProps> = ({
  userId,
  theme,
  onClose,
}) => {
  const { showToast } = useToastStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [moodboards, setMoodboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-view tab
  const [activeTab, setActiveTab] = useState<"designs" | "moodboards">("designs");

  // Lightbox / Detail view states
  const [lightboxDesign, setLightboxDesign] = useState<Design | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
        // 1. Fetch user profile
        const userProfile = await userService.getUserProfile(userId);
        if (!userProfile) {
          showToast("Creator profile not found.", "error");
          setLoading(false);
          return;
        }
        setProfile(userProfile);

        // 2. Fetch designs published by this user
        const allDesigns = await designService.getDesigns(userId);
        const published = allDesigns.filter((d) => d.status === "published");
        // Sort by likes descending to get the "top-liked" designs first
        published.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
        setDesigns(published);

        // 3. Fetch public moodboards of this user
        // We fetch directly from collection to avoid needing subscription for a public link
        const { db } = await import("../services/firebase");
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const q = query(
          collection(db, "moodboards"),
          where("creatorId", "==", userId),
          where("privacy", "==", "public")
        );
        const moodboardSnap = await getDocs(q);
        const publicBoards: any[] = [];
        moodboardSnap.forEach((doc) => {
          publicBoards.push(doc.data());
        });
        publicBoards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMoodboards(publicBoards);

      } catch (err) {
        console.error("Error fetching client showcase data:", err);
        showToast("Error loading showcase portfolio.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [userId]);

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}?showcase=${userId}`;
    navigator.clipboard.writeText(shareUrl);
    showToast("Showcase link copied to clipboard!", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F8] dark:bg-[#121212] text-[#171717] dark:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="mt-4 font-space text-sm font-bold tracking-tight">Loading client portfolio showcase...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F8] dark:bg-[#121212] px-6 text-center">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-4">
          <X size={32} />
        </div>
        <h3 className="font-space text-lg font-bold text-[#171717] dark:text-white">Showcase Not Found</h3>
        <p className="text-sm text-[#888888] max-w-sm mt-2 font-sans">
          The showcase link is invalid or the creator profile does not exist.
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2.5 rounded-full bg-accent text-white font-space font-bold text-xs shadow-md cursor-pointer"
        >
          Go to Main Application
        </button>
      </div>
    );
  }

  const totalLikes = designs.reduce((sum, d) => sum + (d.stats?.likes || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#121212] text-[#171717] dark:text-white pb-20 transition-colors duration-300">
      
      {/* Dynamic Top Floating header */}
      <header className="sticky top-0 z-[100] border-b border-neutral-200/50 dark:border-white/5 bg-white/70 dark:bg-[#121212]/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center p-1.5 shadow-sm">
            <img
              src="/logo-and-loader.svg"
              alt="D"
              className="w-full h-full object-contain filter invert brightness-0"
            />
          </div>
          <span className="font-space font-bold text-sm tracking-tight hidden sm:inline text-neutral-400">
            Showcase Portfolio
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleShareLink}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-white/10 hover:border-accent dark:hover:border-accent hover:text-accent transition-all text-xs font-space font-bold cursor-pointer"
          >
            <Share2 size={12} />
            <span>Copy Showcase Link</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-white transition-all text-xs font-space font-bold cursor-pointer shadow-sm"
          >
            <Compass size={12} />
            <span>Explore App</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10">
        {/* Creator Bio Header Card */}
        <div className="relative rounded-[28px] border border-neutral-200/60 dark:border-white/5 bg-white dark:bg-[#1C1C1E]/60 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left overflow-hidden">
          
          <div className="relative">
            <div className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-sm -z-10 scale-105" />
            <img
              src={profile.avatarUrl || "/default-avatar.png"}
              alt={profile.username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-accent shadow-lg shadow-accent/15"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black font-space tracking-tight">
                @{profile.username}
              </h1>
              <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-space font-bold text-[10px] tracking-wide uppercase">
                Verified Creator
              </span>
            </div>

            <p className="text-xs font-mono uppercase text-neutral-400 tracking-widest mt-1 sm:mt-1.5">
              {profile.role || "Professional Designer"}
            </p>

            {profile.bio && (
              <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-4 leading-relaxed italic max-w-xl font-sans">
                "{profile.bio}"
              </p>
            )}

            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-mono mt-3 break-all"
              >
                <Globe size={12} />
                <span>{profile.portfolioUrl}</span>
              </a>
            )}
          </div>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 pt-6 md:pt-0 border-t md:border-t-0 border-neutral-200/50 dark:border-white/5">
            <div className="p-3 bg-neutral-50 dark:bg-white/2 rounded-2xl border border-neutral-100 dark:border-white/5 text-center min-w-[76px]">
              <span className="text-base sm:text-lg font-black font-space block leading-none">
                {designs.length}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mt-1.5">
                Designs
              </span>
            </div>
            
            <div className="p-3 bg-neutral-50 dark:bg-white/2 rounded-2xl border border-neutral-100 dark:border-white/5 text-center min-w-[76px]">
              <span className="text-base sm:text-lg font-black font-space text-rose-500 block leading-none flex items-center justify-center gap-0.5">
                <Heart size={12} fill="currentColor" className="text-rose-500" />
                {formatLikesCount(totalLikes)}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mt-1.5">
                Likes
              </span>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-white/2 rounded-2xl border border-neutral-100 dark:border-white/5 text-center min-w-[76px]">
              <span className="text-base sm:text-lg font-black font-space block leading-none">
                {moodboards.length}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mt-1.5">
                Boards
              </span>
            </div>
          </div>

        </div>

        {/* Section Tabs */}
        <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-12 mb-6 border-b border-neutral-200/50 dark:border-white/5 pb-4">
          <button
            onClick={() => setActiveTab("designs")}
            className={`px-5 py-2 rounded-full font-space font-bold text-xs transition-all tracking-tight cursor-pointer ${
              activeTab === "designs"
                ? "bg-accent text-white shadow-md shadow-accent/10"
                : "text-neutral-500 dark:text-neutral-400 hover:text-accent"
            }`}
          >
            Top Liked Showcase ({designs.length})
          </button>
          
          <button
            onClick={() => setActiveTab("moodboards")}
            className={`px-5 py-2 rounded-full font-space font-bold text-xs transition-all tracking-tight cursor-pointer ${
              activeTab === "moodboards"
                ? "bg-accent text-white shadow-md shadow-accent/10"
                : "text-neutral-500 dark:text-neutral-400 hover:text-accent"
            }`}
          >
            Public Moodboards ({moodboards.length})
          </button>
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          {activeTab === "designs" ? (
            <motion.div
              key="designs-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {designs.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-white/5 rounded-[24px]">
                  <p className="text-sm font-mono text-neutral-400">No published designs in showcase.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {designs.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.22 }}
                      onClick={() => {
                        setLightboxDesign(design);
                        setActiveSlideIdx(0);
                      }}
                      className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-neutral-200 dark:border-white/10 bg-[#171717] cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                    >
                      <img
                        src={design.imageUrl}
                        alt={design.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-65 group-hover:opacity-85 transition-opacity" />
                      
                      <div className="absolute inset-x-0 bottom-0 p-4 text-left z-10 flex items-end justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block truncate">
                            {design.category || "Design"}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white font-space mt-0.5 truncate leading-tight block">
                            {design.title}
                          </h4>
                          <span className="text-[9px] font-mono text-neutral-400 block mt-0.5 truncate">
                            @{profile.username}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-sm font-space font-semibold text-[10px] select-none shrink-0">
                          <Heart size={10} className="text-rose-500 fill-rose-500 shrink-0" />
                          <span>{formatLikesCount(design.stats?.likes || 0)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="moodboards-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {moodboards.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-white/5 rounded-[24px]">
                  <FolderOpen size={32} className="text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-mono text-neutral-400">No public moodboards available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {moodboards.map((board) => (
                    <div
                      key={board.id}
                      className="relative rounded-2xl border border-neutral-200/60 dark:border-white/5 bg-white dark:bg-[#1E1E1E]/40 p-5 shadow-sm hover:shadow-md hover:border-accent/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Bookmark size={15} className="text-accent" />
                          <h3 className="font-space font-bold text-base leading-tight">
                            {board.name}
                          </h3>
                        </div>
                        <p className="text-xs font-mono text-neutral-400 mt-1.5">
                          Public Inspiration Vault • {board.designIds?.length || 0} items
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100 dark:border-white/5">
                        <span className="text-[10px] font-mono text-neutral-400">
                          Created {new Date(board.createdAt).toLocaleDateString()}
                        </span>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}?moodboard=${board.id}`);
                            showToast("Moodboard invitation link copied!", "success");
                          }}
                          className="flex items-center gap-1 text-[11px] font-space font-bold text-accent hover:underline cursor-pointer"
                        >
                          <Share2 size={11} />
                          <span>Share Board</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DETAILED INTERACTIVE PREVIEW LIGHTBOX */}
      <AnimatePresence>
        {lightboxDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex flex-col justify-between overflow-y-auto"
          >
            {/* Lightbox Controls */}
            <div className="absolute top-5 right-5 z-20 flex items-center gap-3">
              <button
                id="lightbox-close-button"
                onClick={() => setLightboxDesign(null)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all border border-white/5"
                aria-label="Close interactive preview"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Lightbox Content */}
            <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 sm:p-10 my-auto">
              <div className="w-full flex flex-col md:flex-row gap-8 items-center">
                
                {/* Carousel Preview Panel */}
                <div className="flex-1 w-full aspect-[16/10] sm:aspect-[16/10] max-h-[500px] rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 shadow-2xl relative">
                  <DesignCarousel
                    design={lightboxDesign}
                    activeIndex={activeSlideIdx}
                    onIndexChange={setActiveSlideIdx}
                    scale={1}
                  />
                </div>

                {/* Info and stats block */}
                <div className="w-full md:w-[320px] text-left shrink-0">
                  <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-black">
                    {lightboxDesign.category || "Layout Showcase"}
                  </span>
                  
                  <h2 className="text-xl sm:text-2xl font-black font-space tracking-tight text-white mt-1 leading-tight">
                    {lightboxDesign.title}
                  </h2>

                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    Format: {lightboxDesign.format || "Multi-Slide Format"}
                  </p>

                  <div className="flex items-center gap-1.5 mt-4">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-space font-semibold text-xs select-none">
                      <Heart size={12} className="text-rose-500 fill-rose-500" />
                      <span>{formatLikesCount(lightboxDesign.stats?.likes || 0)} Likes</span>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed font-sans mt-5">
                    {lightboxDesign.description || "A gorgeous custom creation uploaded to the creator's design cabinet."}
                  </p>

                  {/* Styles Tag Pills */}
                  {lightboxDesign.styles && lightboxDesign.styles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-6">
                      {lightboxDesign.styles.map((style, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono uppercase text-neutral-400"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-neutral-500 text-[10px] font-mono">
                    <span>CREATED BY @{profile.username}</span>
                    <span>{new Date(lightboxDesign.createdAt).toLocaleDateString()}</span>
                  </div>

                </div>

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
