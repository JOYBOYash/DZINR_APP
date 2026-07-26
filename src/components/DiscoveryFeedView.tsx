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
  Move,
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
  Shapes,
  Paintbrush,
  Figma,
  Contrast,
  SwatchBook,
  Pipette,
  Spline,
  Crop,
  Frame,
  Ruler
} from "lucide-react";
import { UserProfile } from "../types";
import { Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { userService } from "../services/user.service";
import { useToastStore } from "../stores/toast.store";
import { Loader } from "./Loader";
import { Button } from "./Button";
import { DesignerProfileModal } from "./DesignerProfileModal";

interface AmbientBackgroundMarqueeProps {
  theme: "dark" | "light";
}

const AmbientBackgroundMarquee: React.FC<AmbientBackgroundMarqueeProps> = ({ theme }) => {
  // Generate stable particles on mount
  const particles = React.useMemo(() => {
    const iconList = [
      { icon: Palette },
      { icon: Layers },
      { icon: Compass },
      { icon: Feather },
      { icon: PenTool },
      { icon: Shapes },
      { icon: Paintbrush },
      { icon: Figma },
      { icon: SwatchBook },
      { icon: Pipette },
      { icon: Spline },
      { icon: Frame },
    ];

    const tempParticles = [];
    // We want around 18 stable elements for perfect density without visual clutter
    const totalCount = 18;

    for (let i = 0; i < totalCount; i++) {
      const isLogo = i % 2 === 0; // 50% are the App's logo, 50% are premium design tools
      const x = 5 + (i * 90) / totalCount + (Math.random() * 6 - 3); // nicely distributed to avoid overlapping clusters
      const y = 8 + Math.random() * 84;
      
      // Categorize into depth classes (Fore, Mid, Back)
      // Back: huge, very blurred, slow, low opacity (Bokeh effect)
      // Mid: medium, slightly blurred, medium speed, normal opacity
      // Fore: small, sharp, faster, higher opacity
      const depthRand = Math.random();
      let size = 48;
      let blurClass = "";
      let opacity = 0.05;
      let depthOrder = 1;

      if (depthRand < 0.25) {
        // Back / Bokeh depth
        size = 80 + Math.floor(Math.random() * 40); // 80px - 120px
        blurClass = Math.random() > 0.5 ? "blur-[4px]" : "blur-[6px]";
        opacity = theme === "dark" ? 0.025 : 0.045;
        depthOrder = 1;
      } else if (depthRand < 0.75) {
        // Mid depth
        size = 36 + Math.floor(Math.random() * 24); // 36px - 60px
        blurClass = "blur-[1px]";
        opacity = theme === "dark" ? 0.045 : 0.075;
        depthOrder = 2;
      } else {
        // Fore depth (sharp and crisp)
        size = 18 + Math.floor(Math.random() * 12); // 18px - 30px
        blurClass = "blur-none";
        opacity = theme === "dark" ? 0.075 : 0.11;
        depthOrder = 3;
      }

      // Slightly decrease opacity for design tools
      if (!isLogo) {
        opacity *= 0.85;
      }

      const driftX = (Math.random() * 60 + 20) * (Math.random() > 0.5 ? 1 : -1);
      const driftY = (Math.random() * 60 + 20) * (Math.random() > 0.5 ? 1 : -1);
      const driftDuration = 12 + Math.random() * 15; // 12s - 27s
      const rotationDuration = 25 + Math.random() * 35; // 25s - 60s
      const rotationDir = Math.random() > 0.5 ? 360 : -360;

      // Select a random icon
      const iconIndex = Math.floor(Math.random() * iconList.length);
      const selectedIcon = iconList[iconIndex].icon;

      tempParticles.push({
        id: i,
        isLogo,
        x,
        y,
        size,
        blurClass,
        opacity,
        depthOrder,
        driftX,
        driftY,
        driftDuration,
        rotationDuration,
        rotationDir,
        icon: selectedIcon,
      });
    }

    return tempParticles;
  }, [theme]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Immersive ambient colored nebula glow orbs */}
      <div className="absolute inset-0 z-0">
        {/* Soft crimson ambient orb (brand accent) in the top right corner */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full blur-[140px] transition-colors duration-1000"
          style={{
            background: "radial-gradient(circle, rgba(201, 0, 35, 0.05) 0%, rgba(201, 0, 35, 0) 70%)"
          }}
        />
        {/* Soft warm/dark accent orb in bottom left corner */}
        <div 
          className="absolute bottom-[-15%] left-[-10%] w-[60vw] h-[60vh] rounded-full blur-[160px] transition-colors duration-1000"
          style={{
            background: theme === "dark"
              ? "radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 80%)"
              : "radial-gradient(circle, rgba(201, 0, 35, 0.02) 0%, rgba(201, 0, 35, 0) 80%)"
          }}
        />
      </div>

      {/* Floating particles layer */}
      <div className="absolute inset-0 z-10 w-full h-full">
        {particles.map((p) => {
          const IconComponent = p.icon;

          return (
            <motion.div
              key={p.id}
              className={`absolute flex items-center justify-center ${p.blurClass}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                zIndex: p.depthOrder,
              }}
              animate={{
                x: [0, p.driftX, 0],
                y: [0, p.driftY, 0],
              }}
              transition={{
                duration: p.driftDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className="w-full h-full flex items-center justify-center"
                animate={{
                  rotate: [0, p.rotationDir],
                }}
                transition={{
                  duration: p.rotationDuration,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {p.isLogo ? (
                  <img
                    src="/logo-and-loader.svg"
                    alt=""
                    className="w-full h-full object-contain svg-theme-color"
                    referrerPolicy="no-referrer"
                    style={{
                      // For a premium touch in dark mode, let some of the logos retain a subtle brand tint
                      filter: theme === "dark" && p.id % 3 === 0 
                        ? "drop-shadow(0 0 8px rgba(201, 0, 35, 0.3))" 
                        : undefined
                    }}
                  />
                ) : (
                  <IconComponent
                    size={p.size}
                    strokeWidth={1.2}
                    className={theme === "dark" ? "text-white" : "text-[#C90023]"}
                  />
                )}
              </motion.div>
            </motion.div>
          );
        })}
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
  onDesignerProfile?: (userId: string) => void;
}

const DiscoveryCard = React.memo(({
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
  onDesignerProfile,
}: DiscoveryCardProps) => {
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
        drag: true as const,
        dragSnapToOrigin: true,
        dragElastic: 0.8,
        onDragEnd: (e: any, info: any) => {
          const thresholdX = 120;
          const thresholdY = -100;
          const velocityX = info.velocity.x;
          const velocityY = info.velocity.y;

          if (info.offset.y < thresholdY || velocityY < -300) {
            handleSwipe("save", card.id);
          } else if (info.offset.x > thresholdX || velocityX > 300) {
            handleSwipe("right", card.id);
          } else if (info.offset.x < -thresholdX || velocityX < -300) {
            handleSwipe("left", card.id);
          }
        },
        animate: { opacity: 1, scale: 1 },
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
      className={`absolute inset-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl border border-divider-light dark:border-white/10 ${
        theme === "dark" ? "bg-black" : "bg-neutral-100"
      } flex flex-col justify-end ${
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
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (activeCreator?.id && onDesignerProfile) {
              onDesignerProfile(activeCreator.id);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-3 cursor-pointer group/creator shrink-0 pointer-events-auto"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover/creator:border-white/40 transition-colors">
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
            <span className="text-sm font-bold font-space text-white leading-none group-hover/creator:underline">
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
});

export const DiscoveryFeedView: React.FC<DiscoveryFeedViewProps> = ({
  user,
  theme,
  onExploreCategories,
  onRefreshStats,
}) => {
  const { showToast } = useToastStore();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingOffline, setSyncingOffline] = useState<boolean>(false);
  const [lastDocCursor, setLastDocCursor] = useState<any>(null);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const creatorProfilesRef = useRef<Record<string, UserProfile>>({});
  const [activeCreator, setActiveCreator] = useState<UserProfile | null>(null);
  const [expandedCard, setExpandedCard] = useState<Design | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [showReadyToast, setShowReadyToast] = useState<boolean>(false);
  const [isStackHovered, setIsStackHovered] = useState<boolean>(false);
  const [activeDesignerId, setActiveDesignerId] = useState<string | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem("dzinr_onboarding_completed");
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  // Immersive popup image zoom & pan states (matched with SavedVaultView design)
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const zoomImageRef = useRef<HTMLImageElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const clampTranslate = (x: number, y: number, scale: number) => {
    if (scale <= 1) return { x: 0, y: 0 };
    const container = zoomContainerRef.current;
    const rect = container ? container.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const maxTranslateX = (rect.width * (scale - 1)) / 2;
    const maxTranslateY = (rect.height * (scale - 1)) / 2;
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

  const [showViewerGuide, setShowViewerGuide] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Guide overlay timeout
  useEffect(() => {
    if (expandedCard) {
      setShowViewerGuide(true);
      const timer = setTimeout(() => {
        setShowViewerGuide(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowViewerGuide(false);
    }
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
      setIsDragging(true);
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
        setIsDragging(false);
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
            setIsDragging(true);
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
      setIsDragging(false);
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
    let active = true;

    if (!designs || designs.length === 0) {
      setActiveCreator(null);
      return;
    }
    const creatorId = designs[0].userId;
    if (!creatorId) {
      setActiveCreator(null);
      return;
    }

    if (user && creatorId === user.id) {
      setActiveCreator(user);
      return;
    }

    const cached = creatorProfilesRef.current[creatorId];
    if (cached) {
      setActiveCreator(cached);
      return;
    }

    const fetchCreator = async () => {
      try {
        const profile = await userService.getUserProfile(creatorId);
        if (!active) return;

        if (profile) {
          creatorProfilesRef.current[creatorId] = profile;
          // Verify we are still on the same card when the async fetch completes
          setActiveCreator((currentActive) => {
            if (designs.length > 0 && designs[0].userId === creatorId) {
              return profile;
            }
            return currentActive;
          });
        } else {
          // Creator profile doesn't exist anymore (deleted user).
          // 1. Filter out their designs entirely so they do not appear in the feed.
          setDesigns((prev) => prev.filter((d) => d.userId !== creatorId));
          setActiveCreator(null);

          // 2. Perform Firestore cleanup side effect safely outside the state updater
          const orphaned = designs.filter((d) => d.userId === creatorId);
          if (orphaned.length > 0) {
            import("firebase/firestore").then(async ({ deleteDoc, doc }) => {
              const { db } = await import("../services/firebase");
              for (const design of orphaned) {
                await deleteDoc(doc(db, "designs", design.id)).catch(() => {});
              }
            }).catch((e) => console.warn("Failed to delete orphaned designs:", e));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch creator profile:", err);
        if (active) {
          setActiveCreator(null);
        }
      }
    };
    fetchCreator();

    return () => {
      active = false;
    };
  }, [designs[0]?.id, designs[0]?.userId, user?.id]);

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
          const img = new window.Image();
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
    setError(null);
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
      setError("connection_error");
      showToast("Failed to fetch discovery cards. Are you offline?", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFeedBatch(true);
  }, [user.id]);

  // Ref to hold the latest onRefreshStats to prevent tearing down online event listeners
  const onRefreshStatsRef = useRef(onRefreshStats);
  useEffect(() => {
    onRefreshStatsRef.current = onRefreshStats;
  }, [onRefreshStats]);

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
        if (onRefreshStatsRef.current) onRefreshStatsRef.current();
      }
    };

    window.addEventListener("online", syncOfflineQueue);
    syncOfflineQueue();

    return () => window.removeEventListener("online", syncOfflineQueue);
  }, []);

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

  // Beautiful ended feed state with the "data not found" or "broken error" SVG
  if (designs.length === 0) {
    const isConnectionError = error === "connection_error";
    const graphicSrc = isConnectionError
      ? (theme === "dark" ? "/broken-error-d.svg" : "/broken-error-l.svg")
      : (theme === "dark" ? "/no-data-found-d.svg" : "/no-data-found-l.svg");

    return (
      <div className="w-full max-w-md mx-auto py-24 px-6 flex flex-col items-center justify-center text-center animate-fadeIn relative overflow-hidden">
        <AmbientBackgroundMarquee theme={theme} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="relative mb-6 select-none pointer-events-none">
            <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150" />
            <img 
              src={graphicSrc} 
              alt={isConnectionError ? "No connection error illustration" : "No designs found illustration"}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 transition-transform hover:scale-105 duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          <h3 className="text-xl font-bold font-space tracking-tight text-[#171717] dark:text-white uppercase">
            {isConnectionError ? "Could not connect" : "You're all caught up"}
          </h3>
          
          <p className="text-sm text-[#555555] dark:text-[#D7D7D7] mt-3 leading-relaxed max-w-xs font-medium">
            {isConnectionError 
              ? "We couldn't connect to the design servers. Please check your internet connection or retry."
              : "We're working on building you fresh feed! Come back in a bit or refresh to see newly indexed designs."}
          </p>

          <div className="mt-8 flex flex-col gap-3 w-full animate-fadeIn" style={{ animationDelay: "150ms" }}>
            <Button
              id="refresh-feed-end"
              onClick={() => fetchFeedBatch(true)}
              className="w-full py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={15} />
              <span>{isConnectionError ? "Retry Connection" : "Refresh Feed"}</span>
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
    <>
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 200 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 150) {
            fetchFeedBatch(true);
          }
        }}
        className="w-full max-w-[440px] md:max-w-[1100px] mx-auto flex flex-col items-center justify-center select-none py-2 pb-6 px-2 md:px-0 overflow-visible relative"
      >
        {/* Immersive ambient non-selectable diagonal moving text marquee background */}
        <AmbientBackgroundMarquee theme={theme} />

        <AnimatePresence mode="wait">
          <motion.div
            key={loading ? "loading" : "feed"}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full flex flex-col items-center justify-center overflow-visible"
          >
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
                      onDesignerProfile={(userId) => setActiveDesignerId(userId)}
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
                  className={`absolute -top-4 right-2 z-40 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-lg ${
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
          </motion.div>
        </AnimatePresence>
      </motion.div>

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
            {/* Top Hover Sensor Bar */}
            <div 
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
              className="absolute top-0 left-0 right-0 h-20 z-20 pointer-events-auto"
            />

            {/* Top Close & Meta Bar */}
            <div 
              className={`absolute top-6 left-6 right-6 z-30 flex items-center justify-between text-white pointer-events-none transition-all duration-300 ${
                (zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0) && !isHeaderHovered
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="flex flex-col drop-shadow-md">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Viewing Design</span>
                <h4 className="text-sm font-bold font-space">{expandedCard.title}</h4>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCard(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10 shadow-lg cursor-pointer"
                  title="Close preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scroll/Pan Viewer Guide Popup */}
            <AnimatePresence>
              {showViewerGuide && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute top-24 left-1/2 -translate-x-1/2 z-[130] pointer-events-none flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 shadow-xl backdrop-blur-md border border-white/10 dark:border-black/10 min-w-[100px] sm:min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <ZoomIn size={14} className="text-accent animate-pulse" />
                    <span className="text-[11px] font-sans font-semibold tracking-wide uppercase">Scroll</span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-white/20 dark:bg-neutral-300" />
                  <div className="flex items-center gap-2">
                    <Move size={14} className="text-accent animate-pulse" />
                    <span className="text-[11px] font-sans font-semibold tracking-wide uppercase">Pan</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="w-full h-[82vh] flex items-center justify-center relative overflow-hidden">
              {/* Image Container */}
              <motion.div
                ref={zoomContainerRef}
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative h-full w-full max-w-4xl transition-all duration-300 flex items-center justify-center overflow-visible"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <motion.div
                  className="relative w-full h-full flex items-center justify-center pointer-events-none"
                  animate={{ 
                    x: panOffset.x, 
                    y: panOffset.y, 
                    scale: zoomScale 
                  }}
                  transition={
                    isDragging
                      ? { duration: 0 }
                      : { type: "spring", damping: 30, stiffness: 280 }
                  }
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
            </div>

            {/* Bottom helper tag */}
            <div className={`absolute bottom-6 flex flex-col items-center justify-center text-center text-neutral-400 pointer-events-none drop-shadow-md transition-opacity duration-300 ${
              zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0 ? "opacity-0" : "opacity-100"
            }`}>
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
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 60) {
                setShowReadyToast(false);
              }
            }}
            initial={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            className={`fixed bottom-24 left-1/2 z-[140] w-[90%] max-w-sm border rounded-2xl p-4.5 shadow-2xl flex items-center gap-3.5 backdrop-blur-xl transition-colors duration-300 cursor-grab active:cursor-grabbing select-none ${
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

      {/* Designer Profile Modal */}
      <DesignerProfileModal
        show={!!activeDesignerId}
        theme={theme}
        designerId={activeDesignerId || ""}
        onClose={() => setActiveDesignerId(null)}
        showToast={showToast}
        onOpenProfile={(id) => setActiveDesignerId(id)}
      />
    </>
  );
};
