import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, Bookmark, RefreshCw, Sparkles, HelpCircle, Laptop, Heart } from "lucide-react";
import { UserProfile } from "../types";
import { Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { userService } from "../services/user.service";
import { useToastStore } from "../stores/toast.store";
import { Loader } from "./Loader";
import { Button } from "./Button";

interface DiscoveryFeedViewProps {
  user: UserProfile;
  theme: "dark" | "light";
  onExploreCategories?: () => void;
  onRefreshStats?: () => void;
}

interface DiscoveryCardProps {
  card: Design;
  user: UserProfile;
  theme: "dark" | "light";
  activeCreator: UserProfile | null;
  handleSwipe: (action: "left" | "right" | "save", designId: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  card,
  user,
  theme,
  activeCreator,
  handleSwipe,
  showToast,
}) => {
  // Encapsulated motion values per card to avoid state leakages and stuck indicators
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0.6, 1, 1, 1, 0.6]);

  const likeIndicatorOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeIndicatorOpacity = useTransform(x, [-120, 0], [1, 0]);
  const saveIndicatorOpacity = useTransform(y, [-120, 0], [1, 0]);

  const cardProps = {
    style: { x, y, rotate, opacity: cardOpacity },
    drag: true,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 1,
    onDragEnd: (e: any, info: any) => {
      const thresholdX = 140;
      const thresholdY = 120;
      const velocityX = info.velocity.x;
      const velocityY = info.velocity.y;

      if (info.offset.x > thresholdX || velocityX > 400) {
        handleSwipe("right", card.id);
      } else if (info.offset.x < -thresholdX || velocityX < -400) {
        handleSwipe("left", card.id);
      } else if (info.offset.y < -thresholdY || velocityY < -400) {
        handleSwipe("save", card.id);
      }
    },
  };

  return (
    <motion.div
      {...cardProps}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.95,
        x: x.get() > 50 ? 500 : x.get() < -50 ? -500 : 0,
        y: y.get() < -50 ? -500 : 50,
        transition: { duration: 0.25 }
      }}
      className="absolute inset-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl transition-shadow border border-divider-light dark:border-white/10 bg-black flex flex-col justify-end cursor-grab active:cursor-grabbing"
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
    >
      {/* 1. Large Hero Design Preview - Immersive Full Screen Cover (Tinder style) */}
      <div className="absolute inset-0 w-full h-full bg-neutral-950 z-0">
        <img
          src={card.imageUrl}
          alt={card.title}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          referrerPolicy="no-referrer"
        />

        {/* Corner End Save Feature */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSwipe("save", card.id);
            showToast("Saved Design to Inspiration", "success");
          }}
          onPointerDown={(e) => e.stopPropagation()} // Stop pointer from triggering card drag
          className="absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:text-amber-400 hover:bg-black/80 cursor-pointer transition-colors shadow-lg"
          title="Save as Inspiration"
        >
          <Bookmark size={20} />
        </button>

        {/* Dynamic Swipe Badges/Indicators on dragging */}
        <>
          {/* LIKE BADGE */}
          <motion.div
            style={{ opacity: likeIndicatorOpacity }}
            className="absolute top-8 left-8 z-30 border-4 border-green-500 text-green-500 font-space font-bold uppercase tracking-widest text-sm px-4 py-2 rounded-xl rotate-[-12deg]"
          >
            LIKE
          </motion.div>

          {/* NOT RELEVANT BADGE */}
          <motion.div
            style={{ opacity: nopeIndicatorOpacity }}
            className="absolute top-8 right-8 z-30 border-4 border-accent text-accent font-space font-bold uppercase tracking-widest text-sm px-4 py-2 rounded-xl rotate-[12deg]"
          >
            NEXT
          </motion.div>

          {/* SAVE BADGE */}
          <motion.div
            style={{ opacity: saveIndicatorOpacity }}
            className="absolute inset-0 z-30 flex items-center justify-center"
          >
            <div className="bg-amber-500/95 text-white font-space font-bold uppercase tracking-widest text-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
              <Bookmark size={18} fill="currentColor" />
              <span>SAVE INSPIRATION</span>
            </div>
          </motion.div>
        </>
      </div>

      {/* 2. Overlaid Premium Tinder Info Details Panel (Absolutely Positioned) */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-6 pt-28 pb-8 flex flex-col gap-3 text-left">
        {/* Creator Avatar & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-white/10 flex items-center justify-center backdrop-blur-sm">
            {activeCreator?.avatarUrl ? (
              <img
                src={activeCreator.avatarUrl}
                alt={activeCreator.username || "Creator"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : activeCreator?.username ? (
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeCreator.id}`}
                alt="Creator"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Laptop size={18} className="text-neutral-400" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold font-space text-white leading-none">
              @{activeCreator?.username || card.userId?.slice(0, 8) || "anonymous"}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-neutral-300 uppercase tracking-wider">
              <span>{card.category || "General"}</span>
              <span>•</span>
              <span>{card.format || "Mockup"}</span>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-bold font-space text-white tracking-tight leading-tight">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-xs text-neutral-300 font-sans line-clamp-2 max-w-md">
              {card.description}
            </p>
          )}
        </div>

        {/* Aesthetic style tags of design */}
        {card.styles && card.styles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/10">
            {card.styles.slice(0, 3).map((sty) => (
              <span
                key={sty}
                className="text-[10px] font-mono font-medium tracking-wide bg-white/10 backdrop-blur-sm text-neutral-200 px-2 py-0.5 rounded-md"
              >
                #{sty}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const DiscoveryFeedView: React.FC<DiscoveryFeedViewProps> = ({
  user,
  theme,
  onExploreCategories,
  onRefreshStats,
}) => {
  const { showToast } = useToastStore();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingOffline, setSyncingOffline] = useState<boolean>(false);
  const [lastDocCursor, setLastDocCursor] = useState<any>(null);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, UserProfile>>({});
  const [activeCreator, setActiveCreator] = useState<UserProfile | null>(null);

  // Dynamically resolve creator profile info
  useEffect(() => {
    if (!designs || designs.length === 0) {
      setActiveCreator(null);
      return;
    }
    const creatorId = designs[0].userId;
    if (!creatorId) {
      setActiveCreator(null);
      return;
    }

    if (creatorProfiles[creatorId]) {
      setActiveCreator(creatorProfiles[creatorId]);
      return;
    }

    const fetchCreator = async () => {
      try {
        const profile = await userService.getUserProfile(creatorId);
        if (profile) {
          setCreatorProfiles((prev) => ({ ...prev, [creatorId]: profile }));
          setActiveCreator(profile);
        } else {
          setActiveCreator(null);
        }
      } catch (err) {
        console.warn("Failed to fetch creator profile:", err);
        setActiveCreator(null);
      }
    };
    fetchCreator();
  }, [designs, creatorProfiles]);

  // Monitor screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Preload next image URLs to guarantee zero lag when cards shift
  useEffect(() => {
    if (designs.length > 0) {
      const preloadList = designs.slice(0, 3);
      preloadList.forEach((d) => {
        if (d.imageUrl) {
          const img = new Image();
          img.src = d.imageUrl;
        }
      });
    }
  }, [designs]);

  // Fetch the feed
  const fetchFeedBatch = async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setLoading(true);
    }
    try {
      const cursor = isRefresh ? null : lastDocCursor;
      const result = await discoveryService.getDiscoveryFeed(user, cursor, 20);
      
      if (isRefresh) {
        setDesigns(result.designs);
      } else {
        setDesigns((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const uniqueNew = result.designs.filter((d) => !existingIds.has(d.id));
          return [...prev, ...uniqueNew];
        });
      }
      setLastDocCursor(result.lastDoc);

      // Increment views on the first design immediately
      if (result.designs.length > 0 && isRefresh) {
        discoveryService.incrementDesignView(result.designs[0].id);
      }
    } catch (err) {
      console.error("Failed to load discovery feed:", err);
      showToast("Failed to fetch discovery cards. Are you offline?", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFeedBatch(true);
  }, [user.id]);

  // Sync offline queue automatically when coming back online
  useEffect(() => {
    const syncOfflineQueue = async () => {
      if (!navigator.onLine) return;
      const queue = JSON.parse(localStorage.getItem("dzinr_offline_swipes") || "[]");
      if (queue.length > 0) {
        setSyncingOffline(true);
        let successCount = 0;
        for (const item of queue) {
          try {
            await discoveryService.recordInteraction(item.userId, item.designId, item.action);
            successCount++;
          } catch (e) {
            console.error("Failed to sync offline action:", e);
          }
        }
        localStorage.removeItem("dzinr_offline_swipes");
        setSyncingOffline(false);
        showToast(`Synchronized ${successCount} offline reviews successfully!`, "success");
        if (onRefreshStats) onRefreshStats();
      }
    };

    window.addEventListener("online", syncOfflineQueue);
    syncOfflineQueue();

    return () => window.removeEventListener("online", syncOfflineQueue);
  }, [onRefreshStats]);

  // Handle Swipe interaction
  const handleSwipe = async (action: "left" | "right" | "save", designId: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== designId));

    if (designs.length > 1) {
      const nextCard = designs[1];
      discoveryService.incrementDesignView(nextCard.id);
    }

    if (designs.length <= 4) {
      fetchFeedBatch(false);
    }

    if (!navigator.onLine) {
      const queue = JSON.parse(localStorage.getItem("dzinr_offline_swipes") || "[]");
      queue.push({
        userId: user.id,
        designId,
        action,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("dzinr_offline_swipes", JSON.stringify(queue));
      showToast("Offline mode. Swiped saved locally and will sync later.", "success");
    } else {
      discoveryService.recordInteraction(user.id, designId, action).then(() => {
        if (onRefreshStats) onRefreshStats();
      }).catch((err) => {
        console.warn("Failed to record background swipe:", err);
      });
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (designs.length === 0 || loading) return;
      const topCard = designs[0];

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipe("left", topCard.id);
        showToast("Swiped Left (Not Useful)", "info");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipe("right", topCard.id);
        showToast("Swiped Right (Liked Design)", "success");
      } else if (e.key === "ArrowUp" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSwipe("save", topCard.id);
        showToast("Saved Design to Inspiration collection", "success");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [designs, loading]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 min-h-[60vh]">
        <Loader id="discovery-feed-batch-loader" size="md" />
        <p className="text-xs font-mono text-[#888888] dark:text-[#A9A9A9] uppercase tracking-widest mt-4 animate-pulse">
          Curation Loop Booting...
        </p>
      </div>
    );
  }

  // Beautiful ended feed state with the "data not found" SVG and custom requested message
  if (designs.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-24 px-6 flex flex-col items-center justify-center text-center animate-fadeIn">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150" />
          <svg className="w-44 h-44 text-accent/30 dark:text-accent/40 relative z-10" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="64" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
            <rect x="55" y="45" width="50" height="70" rx="8" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <line x1="67" y1="65" x2="93" y2="65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="67" y1="80" x2="83" y2="80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="105" cy="115" r="18" stroke="currentColor" strokeWidth="3" fill="none" />
            <line x1="117" y1="127" x2="132" y2="142" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <h3 className="text-xl font-bold font-space tracking-tight text-[#171717] dark:text-white uppercase">
          You're all caught up
        </h3>
        
        <p className="text-sm text-[#555555] dark:text-[#D7D7D7] mt-3 leading-relaxed max-w-xs font-medium">
          We're working on building you fresh feed! Come back in a bit or refresh to see newly indexed designs.
        </p>

        <div className="mt-8 flex flex-col gap-3 w-full">
          <Button
            id="refresh-feed-end"
            onClick={() => fetchFeedBatch(true)}
            className="w-full py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} />
            <span>Refresh Feed</span>
          </Button>

          {onExploreCategories && (
            <button
              onClick={onExploreCategories}
              className="text-xs font-mono font-bold text-[#888888] hover:text-accent uppercase tracking-widest cursor-pointer transition-colors py-2"
            >
              Explore Creative Workspaces
            </button>
          )}
        </div>
      </div>
    );
  }

  const stackedCards = designs.slice(0, 1);

  return (
    <div className="w-full max-w-[440px] md:max-w-[460px] mx-auto flex flex-col items-center justify-center select-none py-2 pb-6 px-2 md:px-0">
      
      {syncingOffline && (
        <div className={`mb-4 text-xs font-mono flex items-center gap-2 animate-pulse ${
          theme === "dark" ? "text-white" : "text-accent"
        }`}>
          <RefreshCw size={12} className="animate-spin" />
          <span>Synchronizing offline reviews with cloud...</span>
        </div>
      )}

      {/* Immersive Tinder-like full size card deck container */}
      <div className="relative w-full h-[76vh] md:h-[80vh] min-h-[580px] max-h-[820px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {stackedCards.map((card) => (
            <DiscoveryCard
              key={card.id}
              card={card}
              user={user}
              theme={theme}
              activeCreator={activeCreator}
              handleSwipe={handleSwipe}
              showToast={showToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
