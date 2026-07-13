import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, Trash2, X, Compass, Calendar, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { UserProfile } from "../types";
import { Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { userService } from "../services/user.service";
import { useToastStore } from "../stores/toast.store";
import { Loader } from "./Loader";
import { EmptyState } from "./EmptyState";

interface SavedVaultViewProps {
  user: UserProfile;
  theme: "dark" | "light";
  onExploreFeed: () => void;
  onLightboxToggle?: (isOpen: boolean) => void;
}

export const SavedVaultView: React.FC<SavedVaultViewProps> = ({
  user,
  theme,
  onExploreFeed,
  onLightboxToggle,
}) => {
  const { showToast } = useToastStore();
  const [savedDesigns, setSavedDesigns] = useState<Design[] | null>(null);
  const [lightboxDesign, setLightboxDesign] = useState<Design | null>(null);
  const [isUnsavingId, setIsUnsavingId] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const imageAreaRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  // Sync lightbox open state to parent to hide global navigation
  useEffect(() => {
    onLightboxToggle?.(!!lightboxDesign);
  }, [lightboxDesign, onLightboxToggle]);

  // Automatically reset collapse state and zoom on mobile vs desktop when design changes
  useEffect(() => {
    if (lightboxDesign) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsPanelCollapsed(isMobile);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [lightboxDesign]);

  // Helper to clamp pan offsets within exact image boundary bounds
  const clampTranslate = (x: number, y: number, scaleVal: number) => {
    const container = imageAreaRef.current;
    const img = imageRef.current;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) {
      return { x: 0, y: 0 };
    }
    const containerRect = container.getBoundingClientRect();
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = img.naturalWidth / img.naturalHeight;

    let W_i = containerRect.width;
    let H_i = containerRect.height;

    if (imageRatio > containerRatio) {
      W_i = containerRect.width;
      H_i = containerRect.width / imageRatio;
    } else {
      H_i = containerRect.height;
      W_i = containerRect.height * imageRatio;
    }

    const maxTranslateX = Math.max(0, (W_i * scaleVal - containerRect.width) / 2);
    const maxTranslateY = Math.max(0, (H_i * scaleVal - containerRect.height) / 2);

    return {
      x: Math.min(Math.max(x, -maxTranslateX), maxTranslateX),
      y: Math.min(Math.max(y, -maxTranslateY), maxTranslateY)
    };
  };

  const stateRef = useRef({ zoomScale, panOffset });
  useEffect(() => {
    stateRef.current = { zoomScale, panOffset };
  }, [zoomScale, panOffset]);

  // WhatsApp-Style Unified Gestures (Mouse Wheel zoom, left-click pan, double tap/click zoom, pinch-to-zoom)
  useEffect(() => {
    const element = imageAreaRef.current;
    if (!element || !lightboxDesign) return;

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

    // --- MOUSE WHEEL ZOOM (Desktop) ---
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

    // --- DESKTOP CLICK-AND-DRAG PAN (Left mouse button) ---
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

    // --- DOUBLE CLICK ZOOM (Desktop) ---
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

    // --- MOBILE TOUCH GESTURES (Double Tap, Pinch, and Single Touch Drag) ---
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
        // Multi-touch pinch-to-zoom
        e.preventDefault();
        isPinching = true;
        isTouchDragging = false;
        initialDistance = getDistance(e.touches);
        initialScale = currentScale;
        initialPan = { ...currentPan };
        initialCenter = getTouchCenter(e.touches);
      } else if (e.touches.length === 1) {
        // Single touch
        const now = Date.now();
        if (now - lastTapTime < 300) {
          // Double Tap Detected
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
          // Normal drag start (if zoomed)
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
      const currentPan = stateRef.current.panOffset;

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

    // Apply cursor
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
  }, [lightboxDesign]);

  // Set up the real-time subscription for saved designs
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = discoveryService.subscribeUserSavedDesigns(user.id, (designs) => {
      setSavedDesigns(designs);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Dynamically resolve usernames for saved designs and filter out deleted users
  useEffect(() => {
    if (!savedDesigns || savedDesigns.length === 0) return;

    const fetchUsernames = async () => {
      const missingUserIds = savedDesigns
        .map((d) => d.userId)
        .filter((id): id is string => !!id && !usernames[id]);

      if (missingUserIds.length === 0) return;

      const resolvedNames: Record<string, string> = {};
      const deletedUserIds = new Set<string>();

      await Promise.all(
        missingUserIds.map(async (id) => {
          try {
            const profile = await userService.getUserProfile(id);
            if (profile) {
              resolvedNames[id] = profile.username;
            } else {
              deletedUserIds.add(id);
            }
          } catch (err) {
            deletedUserIds.add(id);
          }
        })
      );

      if (deletedUserIds.size > 0) {
        // Filter out designs from deleted users
        setSavedDesigns((prev) => prev.filter((d) => !deletedUserIds.has(d.userId)));
      }

      if (Object.keys(resolvedNames).length > 0) {
        setUsernames((prev) => ({ ...prev, ...resolvedNames }));
      }
    };

    fetchUsernames();
  }, [savedDesigns, usernames]);

  const handleUnsave = async (designId: string) => {
    setIsUnsavingId(designId);
    try {
      await discoveryService.unsaveDesign(user.id, designId);
      showToast("Removed design from Saved Inspirations.", "success");
      if (lightboxDesign?.id === designId) {
        setLightboxDesign(null);
      }
    } catch (err) {
      console.error("Failed to unsave design:", err);
      showToast("Could not remove design. Try again.", "error");
    } finally {
      setIsUnsavingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-0 py-4">
      {/* Page Header */}
      <div className="mb-8 text-left">
        <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
          theme === "dark" ? "text-white" : "text-accent"
        }`}>
          Personal Aesthetic Vault
        </span>
        <h1 className="text-3xl font-bold font-space text-[#171717] dark:text-white tracking-tight mt-1">
          Saved Inspirations
        </h1>
        <p className="text-sm text-[#555555] dark:text-[#D7D7D7] mt-2 leading-relaxed max-w-2xl">
          A dedicated, real-time catalog of interface designs, typographic systems, and layouts you have curated from the swiping feed.
        </p>
      </div>

      {savedDesigns === null ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#888888] dark:text-[#A9A9A9]">
          <Loader id="saved-vault-loader" size="md" />
          <span>Synchronizing inspiration vault...</span>
        </div>
      ) : savedDesigns.length === 0 ? (
        <div className="py-12 border border-dashed border-[#ECECEC] dark:border-white/10 rounded-[32px] bg-neutral-50/50 dark:bg-white/1">
          <EmptyState
            id="saved-vault-empty"
            theme={theme}
            title="Aesthetic Vault is Empty"
            description="Interface layouts and mockups you save or bookmark from the discovery feed will synchronize here in real-time."
            actionText="Go to Discovery Feed"
            onAction={onExploreFeed}
            actionIcon={<Compass size={16} />}
          />
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {savedDesigns.map((design) => {
              const creatorUsername = usernames[design.userId] || "Creator";
              return (
                <motion.div
                  key={design.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className="group relative rounded-[20px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-[#171717] aspect-[3/4] cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() => setLightboxDesign(design)}
                >
                  <img
                    src={design.imageUrl}
                    alt={design.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Gradient shade overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />
                  
                  {/* Overlay content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 text-left z-10 pointer-events-none">
                    <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest truncate">
                      {design.category || "Design"}
                    </span>
                    <h4 className="text-sm font-bold text-white font-space tracking-tight mt-0.5 truncate leading-tight">
                      {design.title}
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400 mt-1">
                      @{creatorUsername}
                    </span>
                  </div>

                  {/* Direct Unsave button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsave(design.id);
                    }}
                    disabled={isUnsavingId === design.id}
                    className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10"
                    title="Remove from saved archive"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* WhatsApp/Inspector Style Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 md:left-[80px] backdrop-blur-xl z-[100] flex flex-col md:flex-row overflow-hidden transition-colors duration-300 ${
              theme === "dark" 
                ? "bg-[#4A0517]/98 text-white" 
                : "bg-[#FFFFFF]/98 text-[#171717]"
            }`}
            onClick={() => setLightboxDesign(null)}
          >
            {/* Top Header Controls (Floating on Desktop and Mobile) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none" onClick={(e) => e.stopPropagation()}>
              {/* Creator Info on Left (Only visible if details panel is collapsed to avoid redundancy) */}
              <div className="pointer-events-auto">
                <AnimatePresence>
                  {isPanelCollapsed && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`flex items-center gap-2 p-1.5 pl-2.5 pr-4 rounded-full border shadow-md backdrop-blur-md transition-colors ${
                        theme === "dark"
                          ? "bg-[#5A0A20]/90 border-white/10 text-white"
                          : "bg-white/95 border-neutral-200 text-[#171717]"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 ${
                        theme === "dark"
                          ? "bg-white/10 border border-white/20 text-white"
                          : "bg-accent/20 border border-accent/30 text-accent"
                      }`}>
                        {(usernames[lightboxDesign.userId] || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <span className={`text-xs font-bold font-space truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px] ${
                        theme === "dark" ? "text-white" : "text-[#171717]"
                      }`}>
                        @{usernames[lightboxDesign.userId] || "Creator"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Control Buttons on Right */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Unsave Toggle Button */}
                <button
                  onClick={() => handleUnsave(lightboxDesign.id)}
                  disabled={isUnsavingId === lightboxDesign.id}
                  className={`p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                    theme === "dark"
                      ? "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20"
                      : "bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border-red-200"
                  }`}
                  title="Unsave from Vault"
                >
                  <Trash2 size={18} className="stroke-[2.5]" />
                </button>

                {/* Collapse/Expand Toggle Button */}
                <button
                  onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  className={`p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                    theme === "dark"
                      ? "bg-[#5A0A20]/80 hover:bg-[#68102A] text-white border-[#68102A]"
                      : "bg-white hover:bg-neutral-100 text-[#171717] border-neutral-200"
                  }`}
                  title={isPanelCollapsed ? "Show details" : "Hide details"}
                >
                  <Info size={18} className="stroke-[2.5]" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setLightboxDesign(null)}
                  className={`p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                    theme === "dark"
                      ? "bg-[#5A0A20]/80 hover:bg-[#68102A] text-white border-[#68102A]"
                      : "bg-white hover:bg-neutral-100 text-[#171717] border-neutral-200"
                  }`}
                  title="Close Fullscreen"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Left Content Area - Centers Image on Dark/Light Canvas with Premium Ambient Aura */}
            <div 
              ref={imageAreaRef}
              className={`flex-1 relative flex items-center justify-center select-none h-full md:h-full overflow-hidden transition-all duration-300 ${
                !isPanelCollapsed 
                  ? "p-4 pb-[312px] md:p-0" 
                  : "p-4 pb-[74px] md:p-0"
              }`}
              onClick={() => setLightboxDesign(null)}
            >
              {/* Dynamic Blurred Color Glow (Ambient Back-reflection) */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-35 blur-[120px] scale-110 transition-all duration-500"
                style={{ zIndex: 0 }}
              >
                <img 
                  src={lightboxDesign.imageUrl} 
                  alt=""
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Elegant radial ambient overlay to soften the glow edge */}
              <div 
                className={`absolute inset-0 pointer-events-none z-0 ${
                  theme === "dark" 
                    ? "bg-gradient-to-t from-[#4A0517]/85 via-transparent to-[#4A0517]/85" 
                    : "bg-gradient-to-t from-white/70 via-transparent to-white/70"
                }`}
              />

              {/* Dimming overlay when zoomed to fade background/ambient glow */}
              <div 
                className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
                  zoomScale > 1 
                    ? theme === "dark" 
                      ? "opacity-60 bg-black" 
                      : "opacity-45 bg-black" 
                    : "opacity-0 bg-transparent"
                }`}
              />

              {/* Premium Floating Card Wrapper */}
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.05 }}
                className="relative z-10 w-full h-full flex items-center justify-center overflow-visible"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Visual Accent Format Badge (Floating and static so it does not zoom/drag with the image) */}
                {lightboxDesign.format && (
                  <div className="absolute top-20 left-6 z-20 pointer-events-none select-none hidden md:block">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-semibold backdrop-blur-md bg-black/40 text-white/95 border border-white/10 uppercase tracking-widest shadow-sm">
                      {lightboxDesign.format}
                    </span>
                  </div>
                )}

                <motion.div
                  className="relative w-full h-full flex items-center justify-center"
                  animate={{ 
                    x: panOffset.x, 
                    y: panOffset.y, 
                    scale: zoomScale 
                  }}
                  transition={{ type: "spring", damping: 35, stiffness: 280 }}
                >
                  <img
                    ref={imageRef}
                    src={lightboxDesign.imageUrl}
                    alt={lightboxDesign.title}
                    className="w-full h-full max-w-full max-h-full object-contain select-none"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* DESKTOP Side Panel - WhatsApp Inspector Pane (Horizontal Sidebar) */}
            <motion.div
              animate={{ 
                width: isPanelCollapsed ? 0 : 380,
                opacity: isPanelCollapsed ? 0 : 1
              }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className={`hidden md:flex relative h-full border-l flex-col justify-between shrink-0 z-10 overflow-hidden ${
                theme === "dark" 
                  ? "bg-[#5A0A20] border-divider-dark text-white" 
                  : "bg-white border-neutral-200 text-[#171717]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Creator Info */}
              <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
                theme === "dark" ? "border-divider-dark" : "border-neutral-100"
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 ${
                    theme === "dark"
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-accent/20 border border-accent/30 text-accent"
                  }`}>
                    {(usernames[lightboxDesign.userId] || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-space truncate ${
                      theme === "dark" ? "text-white" : "text-[#171717]"
                    }`}>
                      @{usernames[lightboxDesign.userId] || "Creator"}
                    </p>
                    <span className={`text-[9px] font-mono block ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Creator Profile
                    </span>
                  </div>
                </div>
                
                {/* Collapse Button inside Panel */}
                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className={`p-1.5 rounded-full transition-all cursor-pointer border shrink-0 ${
                    theme === "dark"
                      ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200"
                  }`}
                  title="Collapse panel"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Scrollable Information Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className={`text-xl font-bold font-space tracking-tight leading-snug ${
                    theme === "dark" ? "text-white" : "text-[#171717]"
                  }`}>
                    {lightboxDesign.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-3.5">
                    {lightboxDesign.category && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                        theme === "dark"
                          ? "bg-white/10 text-white border-white/25"
                          : "bg-accent/10 text-accent border-accent/20"
                      }`}>
                        {lightboxDesign.category}
                      </span>
                    )}
                    {lightboxDesign.format && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                        theme === "dark"
                          ? "bg-white/5 text-neutral-300 border-white/10"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}>
                        {lightboxDesign.format}
                      </span>
                    )}
                    {lightboxDesign.styles && lightboxDesign.styles.map((style, idx) => (
                      <span key={idx} className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                        theme === "dark"
                          ? "bg-white/5 text-neutral-300 border-white/10"
                          : "bg-neutral-100 text-neutral-700 border-[#ECECEC]"
                      }`}>
                        {style}
                      </span>
                    ))}
                  </div>
                </div>

                {lightboxDesign.description && (
                  <div className={`pt-5 border-t ${
                    theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                  }`}>
                    <h4 className={`text-[10px] font-mono uppercase tracking-wider mb-2.5 ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Description
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      theme === "dark" ? "text-neutral-300" : "text-neutral-600"
                    }`}>
                      {lightboxDesign.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* MOBILE Bottom Panel - WhatsApp Inspector Pane (Vertical Bottom Sheet) */}
            <motion.div
              animate={{ 
                height: isPanelCollapsed ? 0 : "240px",
                opacity: isPanelCollapsed ? 0 : 1
              }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className={`flex md:hidden absolute inset-x-0 bottom-[58px] flex-col z-40 overflow-hidden rounded-t-3xl transition-colors duration-300 ${
                theme === "dark" 
                  ? "bg-[#5A0A20] border-t border-divider-dark text-white shadow-[0_-15px_40px_rgba(0,0,0,0.5)]" 
                  : "bg-white border-t border-neutral-200 text-[#171717] shadow-[0_-15px_40px_rgba(0,0,0,0.1)]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Creator Info */}
              <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
                theme === "dark" ? "border-divider-dark" : "border-neutral-100"
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 ${
                    theme === "dark"
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-accent/20 border border-accent/30 text-accent"
                  }`}>
                    {(usernames[lightboxDesign.userId] || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-space truncate ${
                      theme === "dark" ? "text-white" : "text-[#171717]"
                    }`}>
                      @{usernames[lightboxDesign.userId] || "Creator"}
                    </p>
                    <span className={`text-[9px] font-mono block ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Creator Profile
                    </span>
                  </div>
                </div>
                
                {/* Collapse Button inside Panel */}
                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className={`p-1.5 rounded-full transition-all cursor-pointer border shrink-0 ${
                    theme === "dark"
                      ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200"
                  }`}
                  title="Collapse panel"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Information Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div>
                  <h3 className={`text-base font-bold font-space tracking-tight leading-snug ${
                    theme === "dark" ? "text-white" : "text-[#171717]"
                  }`}>
                    {lightboxDesign.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lightboxDesign.category && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                        theme === "dark"
                          ? "bg-white/10 text-white border-white/25"
                          : "bg-accent/10 text-accent border-accent/20"
                      }`}>
                        {lightboxDesign.category}
                      </span>
                    )}
                    {lightboxDesign.format && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                        theme === "dark"
                          ? "bg-white/5 text-neutral-300 border-white/10"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}>
                        {lightboxDesign.format}
                      </span>
                    )}
                    {lightboxDesign.styles && lightboxDesign.styles.map((style, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                        theme === "dark"
                          ? "bg-white/5 text-neutral-300 border-white/10"
                          : "bg-neutral-100 text-neutral-700 border-[#ECECEC]"
                      }`}>
                        {style}
                      </span>
                    ))}
                  </div>
                </div>

                {lightboxDesign.description && (
                  <div className={`pt-3 border-t ${
                    theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                  }`}>
                    <h4 className={`text-[9px] font-mono uppercase tracking-wider mb-1 ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Description
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      theme === "dark" ? "text-neutral-300" : "text-neutral-600"
                    }`}>
                      {lightboxDesign.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
