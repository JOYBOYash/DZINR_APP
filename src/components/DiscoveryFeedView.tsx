import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Bookmark, 
  RefreshCw, 
  Sparkles, 
  HelpCircle, 
  Laptop, 
  Heart, 
  X, 
  ZoomIn,
  Palette, 
  Layers, 
  Compass, 
  Feather, 
  PenTool, 
  Eye, 
  Component, 
  Triangle, 
  Crown, 
  Gem, 
  Box, 
  Grid, 
  Aperture, 
  Maximize2,
  Command,
  Cpu,
  Shapes,
  Workflow,
  Atom,
  Infinity,
  Paintbrush,
  Flame,
  Zap,
  Code2,
  Terminal,
  Sliders,
  Braces,
  Target,
  Hash,
  Disc,
  Wind
} from "lucide-react";
import { UserProfile } from "../types";
import { Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { userService } from "../services/user.service";
import { useToastStore } from "../stores/toast.store";
import { Loader } from "./Loader";
import { Button } from "./Button";

interface MarqueeIconRowProps {
  icons: React.ComponentType<any>[];
  speed: number;
  theme: "dark" | "light";
  size?: number;
  strokeWidth?: number;
  opacityClass?: string;
  accentOpacityClass?: string;
}

const MarqueeIconRow: React.FC<MarqueeIconRowProps> = ({ 
  icons, 
  speed, 
  theme,
  size = 40,
  strokeWidth = 1.25,
  opacityClass,
  accentOpacityClass
}) => {
  // Repeat the icons array to ensure smooth continuous scroll
  const repeatedIcons = [...icons, ...icons, ...icons, ...icons, ...icons, ...icons];
  
  const iconColor = opacityClass || (theme === "dark" 
    ? "text-white/[0.07]" 
    : "text-neutral-900/[0.045]");

  const accentColor = accentOpacityClass || (theme === "dark"
    ? "text-[#C90023]/[0.16]"
    : "text-[#C90023]/[0.11]");

  return (
    <div className="flex whitespace-nowrap w-full overflow-hidden select-none pointer-events-none my-1.5 md:my-2">
      <motion.div
        className="flex gap-20 items-center select-none"
        animate={{ x: ["-33.333%", "0%"] }}
        transition={{
          ease: "linear",
          duration: speed,
          repeat: Infinity,
        }}
      >
        {repeatedIcons.map((IconComponent, idx) => {
          const isAccent = idx % 5 === 0;
          return (
            <div 
              key={idx} 
              className={`flex items-center justify-center shrink-0 transition-colors ${
                isAccent ? accentColor : iconColor
              }`}
            >
              <IconComponent size={size} strokeWidth={strokeWidth} />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

interface AmbientBackgroundMarqueeProps {
  theme: "dark" | "light";
}

const AmbientBackgroundMarquee: React.FC<AmbientBackgroundMarqueeProps> = ({ theme }) => {
  const row1 = [Paintbrush, Sparkles, Command, Palette, Layers, Infinity];
  const row2 = [Gem, Target, Eye, Aperture, Cpu, Compass];
  const row3 = [Code2, Terminal, Braces, Flame, Zap, Sliders];
  const row4 = [Workflow, Crown, Shapes, Box, Grid, Triangle];
  const row5 = [Atom, Feather, PenTool, Maximize2, Component, Disc];
  const row6 = [Wind, Hash, Palette, Layers, Compass, Gem];
  const row7 = [Command, Cpu, Aperture, Sparkles, Target, Infinity];
  const row8 = [Paintbrush, Flame, Zap, Shapes, Workflow, Atom];
  const row9 = [Code2, Terminal, Sliders, Braces, Eye, Crown];
  const row10 = [Component, Triangle, Gem, Box, Grid, Feather];
  const row11 = [PenTool, Maximize2, Disc, Wind, Hash, Palette];
  const row12 = [Layers, Compass, Sparkles, Eye, Command, Sliders];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
      {/* Dense container rotated 45 degrees to align diagonal streams perfectly from top-left to bottom-right */}
      <div className="absolute w-[220vw] h-[220vh] flex flex-col justify-between rotate-[45deg] scale-105 opacity-100">
        <MarqueeIconRow icons={row1} speed={45} theme={theme} size={36} strokeWidth={1.5} />
        <MarqueeIconRow icons={row2} speed={55} theme={theme} size={48} strokeWidth={1.0} />
        <MarqueeIconRow icons={row3} speed={38} theme={theme} size={40} strokeWidth={1.3} />
        <MarqueeIconRow icons={row4} speed={65} theme={theme} size={52} strokeWidth={0.8} />
        <MarqueeIconRow icons={row5} speed={48} theme={theme} size={44} strokeWidth={1.2} />
        <MarqueeIconRow icons={row6} speed={52} theme={theme} size={38} strokeWidth={1.4} />
        <MarqueeIconRow icons={row7} speed={42} theme={theme} size={46} strokeWidth={1.1} />
        <MarqueeIconRow icons={row8} speed={60} theme={theme} size={34} strokeWidth={1.6} />
        <MarqueeIconRow icons={row9} speed={50} theme={theme} size={50} strokeWidth={0.9} />
        <MarqueeIconRow icons={row10} speed={58} theme={theme} size={42} strokeWidth={1.2} />
        <MarqueeIconRow icons={row11} speed={46} theme={theme} size={48} strokeWidth={1.0} />
        <MarqueeIconRow icons={row12} speed={54} theme={theme} size={36} strokeWidth={1.5} />
      </div>
    </div>
  );
};

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
  index: number;
  totalInStack: number;
  onExpand: () => void;
  isMobile: boolean;
  isStackHovered?: boolean;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  card,
  user,
  theme,
  activeCreator,
  handleSwipe,
  showToast,
  index,
  totalInStack,
  onExpand,
  isMobile,
  isStackHovered = false,
}) => {
  const isTopCard = index === 0;

  // Encapsulated motion values per card to avoid state leakages and stuck indicators
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0.6, 1, 1, 1, 0.6]);

  const likeIndicatorOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeIndicatorOpacity = useTransform(x, [-120, 0], [1, 0]);
  const saveIndicatorOpacity = useTransform(y, [-120, 0], [1, 0]);

  // Handle active card dragging and background cards passive layering
  const cardProps = isTopCard
    ? {
        style: { x, y, rotate, opacity: cardOpacity, zIndex: totalInStack - index },
        drag: "x" as const, // constrain dragging on horizontal axis for robust UX
        dragConstraints: { left: 0, right: 0 },
        dragElastic: 0.7,
        onDragEnd: (e: any, info: any) => {
          const thresholdX = 140;
          const velocityX = info.velocity.x;

          if (info.offset.x > thresholdX || velocityX > 400) {
            handleSwipe("right", card.id);
          } else if (info.offset.x < -thresholdX || velocityX < -400) {
            handleSwipe("left", card.id);
          }
        },
        animate: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
      }
    : {
        style: { pointerEvents: "none" as const, zIndex: totalInStack - index },
        drag: false,
        animate: isMobile
          ? {
              scale: 1 - index * 0.045,
              y: -index * 14, // shift UP like a beautiful physical folder tab!
              x: 0,
              rotate: index === 1 ? -1 : 1, // slight rotation for natural stacked aesthetic
              opacity: 1 - index * 0.35,
            }
          : (() => {
              if (isStackHovered) {
                // Desktop dynamic horizontal fan-out when hovered!
                const side = index % 2 === 1 ? -1 : 1; // Left or Right wing
                const depth = Math.ceil(index / 2); // Layer distance
                return {
                  scale: 0.94 - depth * 0.05,
                  x: side * depth * 175, // shift horizontally left/right
                  y: depth * 12, // slightly cascade downward
                  rotate: side * depth * 8, // rotate outward
                  opacity: 1 - depth * 0.2,
                };
              } else {
                // Stacked neatly in folder form when not hovered
                return {
                  scale: 1 - index * 0.035,
                  x: 0,
                  y: -index * 12,
                  rotate: index * 1.5 * (index % 2 === 1 ? -1 : 1),
                  opacity: 1 - index * 0.2,
                };
              }
            })(),
      };

  // Premium variants with subtle hover scale, elevation, and infinite breathing crimson/dark glow pulse matching brand style
  const shadowColor = theme === "dark" 
    ? "rgba(201, 0, 35, 0.38)" // brand accent glow (crimson) for dark theme
    : "rgba(201, 0, 35, 0.25)";   // brand accent glow (crimson) for light theme mode

  const topCardVariants = {
    hover: {
      scale: 1.025,
      y: -5,
      boxShadow: [
        theme === "dark" ? "0 20px 40px -15px rgba(0,0,0,0.8)" : "0 15px 30px -10px rgba(201, 0, 35, 0.15)",
        `0 25px 50px -12px ${shadowColor}`,
        theme === "dark" ? "0 20px 40px -15px rgba(0,0,0,0.8)" : "0 15px 30px -10px rgba(201, 0, 35, 0.15)",
      ],
      transition: {
        boxShadow: {
          repeat: Infinity,
          duration: 2.2,
          ease: "easeInOut"
        },
        scale: { type: "spring", stiffness: 300, damping: 20 },
        y: { type: "spring", stiffness: 300, damping: 20 }
      }
    },
    tap: {
      scale: 0.985,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      {...cardProps}
      initial={isTopCard ? { opacity: 0, scale: 0.95, y: 30 } : false}
      exit={
        isTopCard
          ? {
              opacity: 0,
              scale: 0.95,
              x: x.get() > 50 ? 500 : x.get() < -50 ? -500 : 0,
              transition: { duration: 0.25 },
            }
          : undefined
      }
      whileHover={isTopCard ? "hover" : undefined}
      whileTap={isTopCard ? "tap" : undefined}
      variants={isTopCard ? topCardVariants : undefined}
      className={`absolute inset-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl border border-divider-light dark:border-white/10 bg-black flex flex-col justify-end ${
        isTopCard ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
    >
      {/* 1. Large Hero Design Preview - Click to Expand Area */}
      <div
        onClick={(e) => {
          if (isTopCard) {
            onExpand();
          }
        }}
        className={`absolute inset-0 w-full h-full bg-neutral-950 z-0 ${
          isTopCard ? "cursor-zoom-in" : ""
        }`}
      >
        <img
          src={card.imageUrl}
          alt={card.title}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 1b. Corner End Save Feature (Positioned strictly outside click-to-expand wrapper to prevent zoom trigger) */}
      {isTopCard && !isMobile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleSwipe("save", card.id);
            showToast("Saved Design to Inspiration", "success");
          }}
          onPointerDown={(e) => {
            e.stopPropagation(); // Stop pointer from triggering card drag
          }}
          className="absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:text-amber-400 hover:bg-black/80 cursor-pointer transition-colors shadow-lg"
          title="Save as Inspiration"
        >
          <Bookmark size={20} />
        </button>
      )}

      {/* Dynamic Swipe Badges/Indicators on dragging */}
      {isTopCard && (
        <>
          {/* LIKE BADGE (Heart) */}
          <motion.div
            style={{ opacity: likeIndicatorOpacity }}
            className="absolute top-8 left-8 z-30 w-16 h-16 rounded-full bg-emerald-500/95 text-white flex items-center justify-center shadow-lg border border-emerald-400/20 backdrop-blur-md pointer-events-none"
          >
            <Heart size={30} fill="currentColor" />
          </motion.div>

          {/* NEXT/DISLIKE BADGE (X) */}
          <motion.div
            style={{ opacity: nopeIndicatorOpacity }}
            className="absolute top-8 right-8 z-30 w-16 h-16 rounded-full bg-rose-500/95 text-white flex items-center justify-center shadow-lg border border-rose-400/20 backdrop-blur-md pointer-events-none"
          >
            <X size={30} className="stroke-[2.5]" />
          </motion.div>

          {/* SAVE BADGE (Bookmark) */}
          <motion.div
            style={{ opacity: saveIndicatorOpacity }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/95 text-white flex items-center justify-center shadow-2xl border border-amber-400/20 backdrop-blur-md">
              <Bookmark size={36} fill="currentColor" />
            </div>
          </motion.div>
        </>
      )}

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
              @{activeCreator?.username || "Creator"}
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
  const [expandedCard, setExpandedCard] = useState<Design | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [showReadyToast, setShowReadyToast] = useState<boolean>(false);
  const [isStackHovered, setIsStackHovered] = useState<boolean>(false);

  useEffect(() => {
    const completed = localStorage.getItem("dzinr_onboarding_completed");
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  // Immersive popup image zoom & pan states (matched with SavedVaultView design)
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const zoomImageRef = useRef<HTMLImageElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const clampTranslate = (x: number, y: number, scale: number) => {
    if (scale <= 1) return { x: 0, y: 0 };
    // Safe boundary clamping depending on zoom ratio
    const maxTranslateX = (scale - 1) * 350;
    const maxTranslateY = (scale - 1) * 450;
    return {
      x: Math.min(Math.max(x, -maxTranslateX), maxTranslateX),
      y: Math.min(Math.max(y, -maxTranslateY), maxTranslateY)
    };
  };

  const stateRef = useRef({ zoomScale, panOffset });
  useEffect(() => {
    stateRef.current = { zoomScale, panOffset };
  }, [zoomScale, panOffset]);

  // Reset scale and offset when design popup opens or closes
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [expandedCard]);

  // Unified WhatsApp-style gestures for popup zoom & pan
  useEffect(() => {
    const element = zoomContainerRef.current;
    if (!element || !expandedCard) return;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => {
      if (touches.length < 2) return { x: 0, y: 0 };
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    // --- MOUSE WHEEL ZOOM ---
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentScale = stateRef.current.zoomScale;
      const currentPan = stateRef.current.panOffset;
      const zoomFactor = 1.15;
      const direction = e.deltaY < 0 ? 1 : -1;
      
      const nextScale = direction > 0 ? currentScale * zoomFactor : currentScale / zoomFactor;
      const clampedScale = Math.min(Math.max(nextScale, 1), 4);
      
      let nextPan = { x: 0, y: 0 };
      if (clampedScale > 1) {
        const rect = element.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        const ratio = clampedScale / currentScale;
        const targetX = mouseX - (mouseX - currentPan.x) * ratio;
        const targetY = mouseY - (mouseY - currentPan.y) * ratio;
        
        nextPan = clampTranslate(targetX, targetY, clampedScale);
      }
      
      setZoomScale(clampedScale);
      setPanOffset(nextPan);
      element.style.cursor = clampedScale > 1 ? "grab" : "zoom-in";
    };

    // --- DESKTOP CLICK-AND-DRAG PAN ---
    let isMouseDragging = false;
    let mouseDragStart = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      const currentScale = stateRef.current.zoomScale;
      const currentPan = stateRef.current.panOffset;
      if (currentScale <= 1) return;
      e.preventDefault();
      isMouseDragging = true;
      mouseDragStart = {
        x: e.clientX - currentPan.x,
        y: e.clientY - currentPan.y,
      };
      element.style.cursor = "grabbing";
      
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMouseDragging) return;
      const currentScale = stateRef.current.zoomScale;
      const newX = e.clientX - mouseDragStart.x;
      const newY = e.clientY - mouseDragStart.y;
      const clampedPan = clampTranslate(newX, newY, currentScale);
      setPanOffset(clampedPan);
    };

    const handleGlobalMouseUp = () => {
      if (isMouseDragging) {
        isMouseDragging = false;
        const currentScale = stateRef.current.zoomScale;
        element.style.cursor = currentScale > 1 ? "grab" : "zoom-in";
      }
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };

    // --- DOUBLE CLICK ZOOM ---
    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      const currentScale = stateRef.current.zoomScale;
      if (currentScale > 1) {
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        element.style.cursor = "zoom-in";
      } else {
        const rect = element.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        const targetScale = 2.5;
        const targetX = mouseX - mouseX * targetScale;
        const targetY = mouseY - mouseY * targetScale;
        const clampedPan = clampTranslate(targetX, targetY, targetScale);
        
        setZoomScale(targetScale);
        setPanOffset(clampedPan);
        element.style.cursor = "grab";
      }
    };

    // --- MOBILE TOUCH GESTURES ---
    let initialDistance = 0;
    let initialScale = 1;
    let initialPan = { x: 0, y: 0 };
    let initialCenter = { x: 0, y: 0 };
    let isPinching = false;
    let isTouchDragging = false;
    let touchDragStart = { x: 0, y: 0 };
    let lastTapTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const currentScale = stateRef.current.zoomScale;
      const currentPan = stateRef.current.panOffset;

      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        isTouchDragging = false;
        initialDistance = getDistance(e.touches);
        initialScale = currentScale;
        initialPan = { ...currentPan };
        initialCenter = getTouchCenter(e.touches);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          e.preventDefault();
          if (currentScale > 1) {
            setZoomScale(1);
            setPanOffset({ x: 0, y: 0 });
          } else {
            const rect = element.getBoundingClientRect();
            const touch = e.touches[0];
            const tapX = touch.clientX - rect.left - rect.width / 2;
            const tapY = touch.clientY - rect.top - rect.height / 2;
            
            const targetScale = 2.5;
            const targetX = tapX - tapX * targetScale;
            const targetY = tapY - tapY * targetScale;
            const clampedPan = clampTranslate(targetX, targetY, targetScale);
            
            setZoomScale(targetScale);
            setPanOffset(clampedPan);
          }
        } else {
          if (currentScale > 1) {
            isTouchDragging = true;
            touchDragStart = {
              x: e.touches[0].clientX - currentPan.x,
              y: e.touches[0].clientY - currentPan.y,
            };
          }
        }
        lastTapTime = now;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentScale = stateRef.current.zoomScale;

      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const currentCenter = getTouchCenter(e.touches);
        if (initialDistance > 0 && currentDistance > 0) {
          const ratio = currentDistance / initialDistance;
          const nextScale = Math.min(Math.max(initialScale * ratio, 1), 4);
          
          const rect = element.getBoundingClientRect();
          const initialCenterX = initialCenter.x - rect.left - rect.width / 2;
          const initialCenterY = initialCenter.y - rect.top - rect.height / 2;
          const currentCenterX = currentCenter.x - rect.left - rect.width / 2;
          const currentCenterY = currentCenter.y - rect.top - rect.height / 2;
          
          const scaleRatio = nextScale / initialScale;
          const targetPanX = currentCenterX - (initialCenterX - initialPan.x) * scaleRatio;
          const targetPanY = currentCenterY - (initialCenterY - initialPan.y) * scaleRatio;
          
          const clampedPan = clampTranslate(targetPanX, targetPanY, nextScale);
          
          setZoomScale(nextScale);
          setPanOffset(clampedPan);
        }
      } else if (isTouchDragging && e.touches.length === 1) {
        e.preventDefault();
        const newX = e.touches[0].clientX - touchDragStart.x;
        const newY = e.touches[0].clientY - touchDragStart.y;
        const clampedPan = clampTranslate(newX, newY, currentScale);
        setPanOffset(clampedPan);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const currentScale = stateRef.current.zoomScale;
      if (isPinching) {
        isPinching = false;
        if (currentScale < 1.05) {
          setZoomScale(1);
          setPanOffset({ x: 0, y: 0 });
        }
      }
      isTouchDragging = false;
    };

    const currentScale = stateRef.current.zoomScale;
    element.style.cursor = currentScale > 1 ? "grab" : "zoom-in";

    element.addEventListener("touchstart", handleTouchStart, { passive: false });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchEnd);
    element.addEventListener("wheel", handleWheel, { passive: false });
    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("dblclick", handleDoubleClick);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      element.removeEventListener("wheel", handleWheel);
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("dblclick", handleDoubleClick);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [expandedCard]);

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
          // Creator profile doesn't exist anymore (deleted user).
          // Filter out their designs entirely so they do not appear in the feed.
          setDesigns((prev) => prev.filter((d) => d.userId !== creatorId));
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
      setIsMobile(window.innerWidth < 520);
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
    // Subtle physical feedback on compatible mobile devices
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      if (action === "right") {
        navigator.vibrate([15, 30, 15]); // double pulse for Like
      } else if (action === "save") {
        navigator.vibrate([20, 50, 20]); // double pulse with longer spacing for Save
      } else {
        navigator.vibrate(10); // single subtle tap for Skip
      }
    }

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
      <div className="w-full flex flex-col items-center justify-center py-24 min-h-[60vh] relative overflow-hidden">
        <AmbientBackgroundMarquee theme={theme} />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Loader id="discovery-feed-batch-loader" size="md" />
          <p className="text-xs font-mono text-[#888888] dark:text-[#A9A9A9] uppercase tracking-widest mt-4 animate-pulse">
            Curation Loop Booting...
          </p>
        </div>
      </div>
    );
  }

  // Beautiful ended feed state with the "data not found" SVG and custom requested message
  if (designs.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-24 px-6 flex flex-col items-center justify-center text-center animate-fadeIn relative overflow-hidden">
        <AmbientBackgroundMarquee theme={theme} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
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
      </div>
    );
  }

  const maxVisibleCards = isMobile ? 1 : Math.min(5, designs.length);
  const stackedCards = designs.slice(0, maxVisibleCards);

  return (
    <div className="w-full max-w-[440px] md:max-w-[1100px] mx-auto flex flex-col items-center justify-center select-none py-2 pb-6 px-2 md:px-0 overflow-visible relative">
      {/* Immersive ambient non-selectable diagonal moving text marquee background */}
      <AmbientBackgroundMarquee theme={theme} />

      <div className="relative z-10 w-full flex flex-col items-center justify-center overflow-visible">
        {syncingOffline && (
          <div className={`mb-4 text-xs font-mono flex items-center gap-2 animate-pulse ${
            theme === "dark" ? "text-white" : "text-accent"
          }`}>
            <RefreshCw size={12} className="animate-spin" />
            <span>Synchronizing offline reviews with cloud...</span>
          </div>
        )}

        {/* Immersive Tinder-like full size card deck container */}
        <div 
          onMouseEnter={() => setIsStackHovered(true)}
          onMouseLeave={() => setIsStackHovered(false)}
          className="relative w-full max-w-[440px] md:max-w-[440px] h-[76vh] md:h-[80vh] min-h-[580px] max-h-[820px] flex items-center justify-center overflow-visible"
        >
          {/* Render background cards first so top card is rendered last in DOM order for focus/drag overlay correctness */}
          <AnimatePresence>
            {stackedCards.slice().reverse().map((card) => {
              const index = stackedCards.indexOf(card);
              return (
                <DiscoveryCard
                  key={card.id}
                  card={card}
                  user={user}
                  theme={theme}
                  activeCreator={activeCreator}
                  handleSwipe={handleSwipe}
                  showToast={showToast}
                  index={index}
                  totalInStack={stackedCards.length}
                  onExpand={() => setExpandedCard(card)}
                  isMobile={isMobile}
                  isStackHovered={isStackHovered}
                />
              );
            })}
          </AnimatePresence>

          {/* Sticky Question Mark Help Icons */}
          {isMobile ? (
            <button
              onClick={() => {
                setOnboardingStep(0);
                setShowOnboarding(true);
              }}
              className={`absolute -top-12 right-2 z-40 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-lg ${
                theme === "dark" 
                  ? "bg-surface-dark/90 border-white/10 text-white hover:bg-elevated-dark" 
                  : "bg-white/95 border-neutral-200/80 text-[#171717] hover:bg-neutral-50"
              }`}
              title="Gestures Tutorial"
            >
              <HelpCircle size={18} className="text-accent" />
            </button>
          ) : (
            <button
              onClick={() => {
                setOnboardingStep(0);
                setShowOnboarding(true);
              }}
              className={`absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all shadow-xl cursor-pointer font-sans ${
                theme === "dark" 
                  ? "bg-[#171717] hover:bg-neutral-800 border-white/10 text-neutral-300 hover:text-white" 
                  : "bg-white hover:bg-neutral-50 border-neutral-200/80 text-[#555555] hover:text-[#171717]"
              }`}
              title="Show Feed Gestures Tutorial"
            >
              <HelpCircle size={15} className="text-accent" />
              <span>Gestures Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* IMMERSIVE FULL SCREEN IMAGE ZOOM PREVIEW POPUP */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedCard(null)}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-8 select-none"
          >
            {/* Top Close & Meta Bar */}
            <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between text-white pointer-events-none">
              <div className="flex flex-col drop-shadow-md">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Viewing Design</span>
                <h4 className="text-sm font-bold font-space">{expandedCard.title}</h4>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCard(null);
                }}
                className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10 shadow-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Fully Uncropped Centered Design Layout */}
            <motion.div
              ref={zoomContainerRef}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-4xl h-[82vh] flex items-center justify-center overflow-visible"
              onClick={(e) => {
                e.stopPropagation();
                if (zoomScale <= 1) {
                  setExpandedCard(null);
                }
              }}
            >
              <motion.div
                className="relative w-full h-full flex items-center justify-center pointer-events-none"
                animate={{ 
                  x: panOffset.x, 
                  y: panOffset.y, 
                  scale: zoomScale 
                }}
                transition={{ type: "spring", damping: 35, stiffness: 280 }}
              >
                <img
                  ref={zoomImageRef}
                  src={expandedCard.imageUrl}
                  alt={expandedCard.title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/5 select-none"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </motion.div>

            {/* Bottom helper tag */}
            <div className="absolute bottom-6 flex flex-col items-center justify-center text-center text-neutral-400 pointer-events-none drop-shadow-md">
              <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500">
                {zoomScale > 1 ? "Drag to pan • Double-tap or Wheel to zoom" : "Click anywhere, or backdrop, to transition back"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ONBOARDING OVERLAY */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[9999] backdrop-blur-xl flex items-center justify-center p-4 select-none transition-colors duration-300 ${
              theme === "dark" ? "bg-black/85" : "bg-neutral-950/30"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-[32px] p-8 text-center flex flex-col items-center justify-center shadow-2xl border relative transition-all duration-300 ${
                theme === "dark"
                  ? "bg-surface-dark border-white/10 text-white shadow-black/40"
                  : "bg-white border-neutral-200/80 text-[#171717] shadow-xl"
              }`}
            >
              {/* Skip button top right */}
              <button
                onClick={() => {
                  localStorage.setItem("dzinr_onboarding_completed", "true");
                  setShowOnboarding(false);
                  setShowReadyToast(true);
                  setTimeout(() => setShowReadyToast(false), 5000);
                }}
                className={`absolute top-6 right-6 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  theme === "dark" ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-[#171717]"
                }`}
              >
                Skip
              </button>

              {/* Progress Indicator dots */}
              <div className="flex gap-1.5 mb-6">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === onboardingStep 
                        ? "w-6 bg-accent" 
                        : theme === "dark" ? "w-1.5 bg-white/10" : "w-1.5 bg-neutral-200"
                    }`}
                  />
                ))}
              </div>

              {/* Visual Demo Slot */}
              {onboardingStep === 0 && (
                <div className="w-24 h-24 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6 animate-pulse">
                  <Sparkles size={40} />
                </div>
              )}

              {onboardingStep === 1 && (
                <div className={`relative w-44 h-24 rounded-xl flex items-center justify-center mb-6 overflow-hidden border ${
                  theme === "dark" 
                    ? "bg-black/40 border-red-500/15" 
                    : "bg-neutral-50 border-red-500/10"
                }`}>
                  <motion.div 
                    animate={{ x: [-10, -35, -10], rotate: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className={`w-24 h-14 rounded-lg flex items-center justify-center gap-1.5 text-red-500 shadow-md font-mono text-[9px] uppercase font-bold border ${
                      theme === "dark" 
                        ? "bg-elevated-dark border-white/5" 
                        : "bg-white border-neutral-200"
                    }`}
                  >
                    <X size={12} />
                    <span>Skip</span>
                  </motion.div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className={`relative w-44 h-24 rounded-xl flex items-center justify-center mb-6 overflow-hidden border ${
                  theme === "dark" 
                    ? "bg-black/40 border-emerald-500/15" 
                    : "bg-neutral-50 border-emerald-500/10"
                }`}>
                  <motion.div 
                    animate={{ x: [10, 35, 10], rotate: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className={`w-24 h-14 rounded-lg flex items-center justify-center gap-1.5 text-emerald-500 dark:text-emerald-400 shadow-md font-mono text-[9px] uppercase font-bold border ${
                      theme === "dark" 
                        ? "bg-elevated-dark border-white/5" 
                        : "bg-white border-neutral-200"
                    }`}
                  >
                    <Heart size={11} className="fill-emerald-400/20" />
                    <span>Like</span>
                  </motion.div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className={`relative w-44 h-24 rounded-xl flex items-center justify-center mb-6 overflow-hidden border ${
                  theme === "dark" 
                    ? "bg-black/40 border-blue-500/15" 
                    : "bg-neutral-50 border-blue-500/10"
                }`}>
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-blue-500 dark:text-blue-400 shadow-md font-mono text-[9px] uppercase font-bold border ${
                      theme === "dark" 
                        ? "bg-elevated-dark border-white/5" 
                        : "bg-white border-neutral-200"
                    }`}
                  >
                    <ZoomIn size={14} className="mb-0.5" />
                    <span>Zoom</span>
                  </motion.div>
                </div>
              )}

              {/* Title & Body */}
              <h3 className={`text-xl font-bold font-space tracking-tight leading-none mb-2 ${
                theme === "dark" ? "text-white" : "text-[#171717]"
              }`}>
                {onboardingStep === 0 && "Rate & Curate Designs"}
                {onboardingStep === 1 && "Swipe Left to Skip"}
                {onboardingStep === 2 && "Swipe Right to Like"}
                {onboardingStep === 3 && "Tap to Zoom & Pan"}
              </h3>

              <p className={`text-xs font-sans leading-relaxed max-w-xs mb-8 ${
                theme === "dark" ? "text-neutral-400" : "text-[#555555]"
              }`}>
                {onboardingStep === 0 && "Welcome to Dzinr's discovery feed! Tap 'Get Started' to see the simple gestural guidelines on how to rate and curate design aesthetics."}
                {onboardingStep === 1 && "If a project or layout doesn't fit your taste, simply swipe the card left (or press ArrowLeft). This skips the design and trains your feed."}
                {onboardingStep === 2 && "Swipe a card right (or press ArrowRight) if you love the design. This records a positive review, likes the mockup, and curates more similar styles."}
                {onboardingStep === 3 && "Tap any image card to open a full uncropped view. Use pinch, mouse wheel, or dragging to inspect details up close."}
              </p>

              {/* Navigation Button */}
              <Button
                id="onboarding-nav-btn"
                onClick={() => {
                  if (onboardingStep < 3) {
                    setOnboardingStep((prev) => prev + 1);
                  } else {
                    localStorage.setItem("dzinr_onboarding_completed", "true");
                    setShowOnboarding(false);
                    setShowReadyToast(true);
                    setTimeout(() => setShowReadyToast(false), 5000);
                  }
                }}
                className="w-full py-3.5 px-6 font-semibold flex items-center justify-center gap-2 rounded-2xl"
              >
                <span>
                  {onboardingStep === 0 && "Get Started →"}
                  {onboardingStep === 1 && "Next: How to Like →"}
                  {onboardingStep === 2 && "Next: Zoom Preview →"}
                  {onboardingStep === 3 && "Got it, I'm ready!"}
                </span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "You're Ready Now!" Popup */}
      <AnimatePresence>
        {showReadyToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            className={`fixed bottom-24 left-1/2 z-[140] w-[90%] max-w-sm border rounded-2xl p-4.5 shadow-2xl flex items-center gap-3.5 backdrop-blur-xl transition-colors duration-300 ${
              theme === "dark"
                ? "bg-surface-dark/95 border-emerald-500/30 text-white"
                : "bg-white/95 border-emerald-500/25 text-[#171717]"
            }`}
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div className="flex-1 text-left">
              <h4 className={`text-xs font-space font-bold uppercase tracking-wider ${
                theme === "dark" ? "text-white" : "text-[#171717]"
              }`}>You're Ready Now!</h4>
              <p className={`text-[11px] font-sans mt-0.5 leading-relaxed ${
                theme === "dark" ? "text-neutral-400" : "text-neutral-600"
              }`}>
                Swipe left to skip, right to like, and tap any card to zoom. Happy curating!
              </p>
            </div>
            <button 
              onClick={() => setShowReadyToast(false)}
              className={`text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                theme === "dark" ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-[#171717]"
              }`}
            >
              Start
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
