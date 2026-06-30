import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "motion/react";
import { ArrowLeft, ArrowRight, Bookmark, RefreshCw, Sparkles, HelpCircle, Laptop, Heart } from "lucide-react";
import { UserProfile } from "../types";
import { Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { useToastStore } from "../stores/toast.store";
import { Loader } from "./Loader";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";
import { Chip } from "./Chip";

interface DiscoveryFeedViewProps {
  user: UserProfile;
  theme: "dark" | "light";
  onExploreCategories?: () => void;
  onRefreshStats?: () => void;
}

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

  // Drag state trackers for index 0 card
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform drag offset to rotation and opacity values for top card
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0.6, 1, 1, 1, 0.6]);

  // Next card scaling transforms: scales up from 0.95 to 1.0 as the top card is dragged away
  const nextScale = useTransform(x, [-160, 0, 160], [1, 0.95, 1]);
  const nextOpacity = useTransform(x, [-160, 0, 160], [1, 0.75, 1]);

  // Swipe indicators opacity based on drag direction
  const likeIndicatorOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeIndicatorOpacity = useTransform(x, [-120, 0], [1, 0]);
  const saveIndicatorOpacity = useTransform(y, [-120, 0], [1, 0]);

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
          // Avoid duplicates
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
    // Trigger immediately in case we just booted up online
    syncOfflineQueue();

    return () => window.removeEventListener("online", syncOfflineQueue);
  }, [onRefreshStats]);

  // Handle Swipe interaction (Optimistic UI + Background persist)
  const handleSwipe = async (action: "left" | "right" | "save", designId: string) => {
    // 1. Optimistic local state update (immediately remove from local feed array)
    setDesigns((prev) => prev.filter((d) => d.id !== designId));

    // Reset motion values for next card
    x.set(0);
    y.set(0);

    // Increment view counter of the next card in line (optimistically the card at index 1)
    if (designs.length > 1) {
      const nextCard = designs[1];
      discoveryService.incrementDesignView(nextCard.id);
    }

    // If designs array drops below threshold, pre-fetch next batch in background
    if (designs.length <= 4) {
      fetchFeedBatch(false);
    }

    // 2. Offline check and queue or Firestore write
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
      // Async database write
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

  // Empty state
  if (designs.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 flex flex-col items-center">
        <EmptyState
          id="empty-discovery-feed-state"
          theme={theme}
          title="You're all caught up."
          description="We'll bring you fresh designs as creators publish them."
          actionText="Refresh Feed"
          onAction={() => fetchFeedBatch(true)}
          actionIcon={<RefreshCw size={14} className="mr-1.5" />}
        />
        {onExploreCategories && (
          <button
            onClick={onExploreCategories}
            className="mt-4 text-xs font-mono font-medium text-[#888888] hover:text-[#ff2d51] underline underline-offset-4 cursor-pointer"
          >
            Explore Categories (future placeholder)
          </button>
        )}
      </div>
    );
  }

  const topCard = designs[0];
  const stackedCards = designs.slice(0, 3); // Current, Next, Next+1

  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col items-center justify-center select-none py-2 pb-16 px-4">
      
      {/* Syncing Indicators */}
      {syncingOffline && (
        <div className="mb-4 text-xs font-mono text-accent flex items-center gap-2 animate-pulse">
          <RefreshCw size={12} className="animate-spin" />
          <span>Synchronizing offline reviews with cloud...</span>
        </div>
      )}

      {/* Keyboard Shortcut Ribbon */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
            Loop Stream Active
          </span>
        </div>
        <button
          onClick={() => setIsKeyboardHelpOpen(!isKeyboardHelpOpen)}
          className="text-xs font-mono text-[#888888] hover:text-accent flex items-center gap-1 cursor-pointer transition-colors"
        >
          <HelpCircle size={12} />
          <span>Shortcuts</span>
        </button>
      </div>

      {isKeyboardHelpOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full mb-4 p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-neutral-50 dark:bg-white/2 text-left space-y-2"
        >
          <h4 className="text-xs font-bold font-space uppercase text-[#171717] dark:text-white">
            Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#555555] dark:text-[#D7D7D7]">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-accent">← Left Arrow</span>
              <span>Not Relevant</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-green-500">→ Right Arrow</span>
              <span>Like / Useful</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-amber-500">↑ Up or 'S' Key</span>
              <span>Save & Pin</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* The Swipe Deck Container */}
      <div className="relative w-full aspect-[3/4] max-h-[580px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {stackedCards.map((card, idx) => {
            const isTop = idx === 0;

            // Framer motion properties per stack depth
            const cardProps = isTop
              ? {
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
                      // Swipe Right (Like)
                      handleSwipe("right", card.id);
                    } else if (info.offset.x < -thresholdX || velocityX < -400) {
                      // Swipe Left (Not Useful)
                      handleSwipe("left", card.id);
                    } else if (info.offset.y < -thresholdY || velocityY < -400) {
                      // Swipe Up (Save)
                      handleSwipe("save", card.id);
                    }
                  },
                }
              : {
                  style: {
                    scale: nextScale,
                    opacity: nextOpacity,
                    zIndex: 10 - idx,
                  },
                };

            return (
              <motion.div
                key={card.id}
                {...cardProps}
                className={`absolute inset-0 w-full h-full rounded-[32px] overflow-hidden shadow-2xl transition-shadow border border-divider-light dark:border-divider-dark bg-white dark:bg-[#4A0517] flex flex-col justify-between ${
                  isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
                }`}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
              >
                
                {/* 1. Large Hero Design Preview */}
                <div className="relative w-full flex-1 bg-black overflow-hidden group">
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />

                  {/* Dark Vignette Overlay for Title/Labels */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 pt-16 flex flex-col justify-end">
                    <h3 className="text-lg md:text-xl font-bold font-space text-white tracking-tight leading-tight">
                      {card.title}
                    </h3>
                    {card.description && (
                      <p className="text-xs text-neutral-300 font-sans mt-1 line-clamp-2 max-w-md">
                        {card.description}
                      </p>
                    )}
                  </div>

                  {/* Dynamic Swipe Badges/Indicators on dragging */}
                  {isTop && (
                    <>
                      {/* LIKE BADGE */}
                      <motion.div
                        style={{ opacity: likeIndicatorOpacity }}
                        className="absolute top-8 left-8 border-4 border-green-500 text-green-500 font-space font-bold uppercase tracking-widest text-sm px-4 py-2 rounded-xl rotate-[-12deg]"
                      >
                        LIKE
                      </motion.div>

                      {/* NOT RELEVANT BADGE */}
                      <motion.div
                        style={{ opacity: nopeIndicatorOpacity }}
                        className="absolute top-8 right-8 border-4 border-accent text-accent font-space font-bold uppercase tracking-widest text-sm px-4 py-2 rounded-xl rotate-[12deg]"
                      >
                        NEXT
                      </motion.div>

                      {/* SAVE BADGE */}
                      <motion.div
                        style={{ opacity: saveIndicatorOpacity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="bg-amber-500/90 text-white font-space font-bold uppercase tracking-widest text-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
                          <Bookmark size={18} fill="currentColor" />
                          <span>SAVE INSPIRATION</span>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* 2. Compact Bottom Card Layout (Design itself is the focus) */}
                <div className="p-5 flex flex-col gap-3.5 bg-white dark:bg-[#5A0A20]/80">
                  <div className="flex items-center justify-between">
                    {/* Creator Avatar & Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-divider-light dark:border-white/10 shrink-0 bg-neutral-100 flex items-center justify-center">
                        {card.userId ? (
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${card.userId}`}
                            alt="Creator"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Laptop size={16} className="text-neutral-400" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold font-space text-[#171717] dark:text-white leading-none">
                          @{card.userId?.slice(0, 8) || "anonymous"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-[#888888] dark:text-[#A9A9A9] uppercase tracking-wider">
                          <span>{card.category || "General"}</span>
                          <span>•</span>
                          <span>{card.format || "Mockup"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Save Pin Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe("save", card.id);
                        showToast("Saved Design to Inspiration", "success");
                      }}
                      className="w-10 h-10 rounded-full border border-divider-light dark:border-white/10 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-white/5 text-[#555555] dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer transition-colors shadow-sm"
                      title="Save as Inspiration"
                    >
                      <Bookmark size={18} />
                    </button>
                  </div>

                  {/* Aesthetic style tags of design */}
                  {card.styles && card.styles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-divider-light/60 dark:border-white/5">
                      {card.styles.slice(0, 3).map((sty) => (
                        <span
                          key={sty}
                          className="text-[10px] font-mono font-medium tracking-wide bg-neutral-100 dark:bg-white/5 text-[#555555] dark:text-[#D7D7D7] px-2 py-0.5 rounded-md"
                        >
                          #{sty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Manual Button Triggers for accessibility/easy interaction */}
      <div className="flex items-center justify-center gap-5 mt-6 w-full max-w-sm px-4">
        {/* Dislike/Left action */}
        <button
          onClick={() => handleSwipe("left", topCard.id)}
          className="w-14 h-14 rounded-full border border-divider-light dark:border-white/10 flex items-center justify-center bg-white dark:bg-[#5A0A20]/80 hover:bg-neutral-50 dark:hover:bg-white/10 text-accent transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Not relevant to me (Left)"
        >
          <ArrowLeft size={22} className="stroke-[2.5]" />
        </button>

        {/* Save/Pin action */}
        <button
          onClick={() => handleSwipe("save", topCard.id)}
          className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 shadow-amber-500/20"
          title="Save to Inspiration (Up)"
        >
          <Bookmark size={24} fill="currentColor" />
        </button>

        {/* Like/Right action */}
        <button
          onClick={() => handleSwipe("right", topCard.id)}
          className="w-14 h-14 rounded-full border border-divider-light dark:border-white/10 flex items-center justify-center bg-white dark:bg-[#5A0A20]/80 hover:bg-neutral-50 dark:hover:bg-white/10 text-green-500 dark:text-green-400 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Like design (Right)"
        >
          <ArrowRight size={22} className="stroke-[2.5]" />
        </button>
      </div>

    </div>
  );
};
