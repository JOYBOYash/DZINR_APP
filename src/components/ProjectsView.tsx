import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Heart,
  Upload,
  FileArchive,
  Image as ImageIcon,
  Layers,
  X,
  Edit3,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Move,
  ZoomIn,
} from "lucide-react";
import { UserProfile } from "../types";
import { formatLikesCount } from "../utils/likes";
import { designService, Design } from "../services/design.service";
import { DesignCommentsSection } from "./DesignCommentsSection";
import { DesignerProfileModal } from "./DesignerProfileModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { zipImportService } from "../services/zipImport.service";
import { cloudinaryService } from "../services/cloudinary.service";
import { imageCompressionService } from "../services/imageCompression.service";
import { useUploadStore } from "../stores/upload.store";
import { useToastStore } from "../stores/toast.store";
import { Button } from "./Button";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { ImportMethodCard } from "./CreatorWorkspace/ImportMethodCard";
import { CategorySelector, TagSelector } from "./CreatorWorkspace/Selectors";
import { DesignCarousel } from "./DesignCarousel";
import { Tooltip } from "./Tooltip";
import { Modal } from "./Modal";

const CATEGORIES = [
  "Carousels",
  "UI/UX",
  "Branding",
  "Posters",
  "Logos",
  "Brochures",
  "Infographics",
  "Banners",
  "Presentations",
  "Packaging",
  "Motion",
  "3D",
];
const STYLES = [
  "Minimal",
  "Brutalist",
  "Neo Brutalist",
  "Glassmorphism",
  "Editorial",
  "Luxury",
  "Corporate",
  "Dark UI",
  "Futuristic",
  "Experimental",
];

interface ProjectsViewProps {
  user: UserProfile;
  theme: "dark" | "light";
  onBackToProfile?: () => void;
  onEditDraft?: (id: string) => void;
  onCreateNew?: () => void;
  onLightboxToggle?: (isOpen: boolean, isZoomed?: boolean) => void;
}

type Tab = "drafts" | "published";

export const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  user, 
  theme, 
  onEditDraft, 
  onCreateNew,
  onLightboxToggle,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<Tab>("drafts");
  const [draftToDelete, setDraftToDelete] = useState<Design | null>(null);
  const [activeDesignerId, setActiveDesignerId] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Lightbox and interactive preview states
  const [lightboxDesign, setLightboxDesign] = useState<Design | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );
  const [isPanelFullyExpanded, setIsPanelFullyExpanded] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchAreaRef = useRef<HTMLDivElement>(null);

  // Programmatic swipe gesture handler for mobile viewer with { passive: false } to override browser defaults
  useEffect(() => {
    const element = touchAreaRef.current;
    if (!element) return;

    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (zoomScale === 1 && e.touches.length === 1) {
        startX = e.touches[0].clientX;
        endX = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (zoomScale === 1 && e.touches.length === 1) {
        endX = e.touches[0].clientX;
        const diffX = Math.abs(startX - endX);
        // If swiping horizontally, prevent standard scrolling / back gesture
        if (diffX > 8) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (zoomScale === 1 && startX !== 0) {
        const diffX = startX - endX;
        const minSwipeDistance = 40; // responsive threshold
        const currentUrls = (lightboxDesign?.imageUrls && lightboxDesign.imageUrls.length > 0)
          ? lightboxDesign.imageUrls
          : [lightboxDesign?.imageUrl].filter(Boolean);

        if (currentUrls.length > 1) {
          if (diffX > minSwipeDistance) {
            // Swipe left -> Next image
            setActiveSlideIdx((prev) => (prev < currentUrls.length - 1 ? prev + 1 : 0));
          } else if (diffX < -minSwipeDistance) {
            // Swipe right -> Previous image
            setActiveSlideIdx((prev) => (prev > 0 ? prev - 1 : currentUrls.length - 1));
          }
        }
      }
      startX = 0;
      endX = 0;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [lightboxDesign, zoomScale]);

  // Swipe gesture state for mobile viewer
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeEndX, setSwipeEndX] = useState<number | null>(null);

  // Automatically reset collapse state, zoom, and slide on mobile vs desktop when design changes
  useEffect(() => {
    if (lightboxDesign) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsPanelCollapsed(isMobile);
      setIsPanelFullyExpanded(false);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setActiveSlideIdx(0);
    } else {
      setIsPanelFullyExpanded(false);
    }
  }, [lightboxDesign]);

  // Reset zoom and pan on slide change
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [activeSlideIdx]);

  // Sync lightbox open state to parent to hide global navigation
  useEffect(() => {
    const isZoomed = !!lightboxDesign && (zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0);
    onLightboxToggle?.(!!lightboxDesign, isZoomed);
  }, [lightboxDesign, zoomScale, panOffset, onLightboxToggle]);

  const [showViewerGuide, setShowViewerGuide] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Guide overlay timeout and auto-dismiss on user interaction
  useEffect(() => {
    if (lightboxDesign) {
      setShowViewerGuide(true);

      const dismissGuide = () => {
        setShowViewerGuide(false);
      };

      // 3 second timer
      const timer = setTimeout(dismissGuide, 3000);

      // Listeners for click, scroll/wheel, or touch (registered after a slight delay)
      const setupListenersTimer = setTimeout(() => {
        window.addEventListener("mousedown", dismissGuide, { passive: true });
        window.addEventListener("wheel", dismissGuide, { passive: true });
        window.addEventListener("touchstart", dismissGuide, { passive: true });
        window.addEventListener("touchmove", dismissGuide, { passive: true });
      }, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(setupListenersTimer);
        window.removeEventListener("mousedown", dismissGuide);
        window.removeEventListener("wheel", dismissGuide);
        window.removeEventListener("touchstart", dismissGuide);
        window.removeEventListener("touchmove", dismissGuide);
      };
    } else {
      setShowViewerGuide(false);
    }
  }, [lightboxDesign]);

  useEffect(() => {
    if (lightboxDesign && (zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0)) {
      setIsPanelCollapsed(true);
    }
  }, [zoomScale, panOffset, lightboxDesign]);

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

  // WhatsApp-Style Unified Gestures for Projects Lightbox (Mouse Wheel zoom, left-click pan, double tap/click zoom, pinch-to-zoom)
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

    const handleTouchEnd = () => {
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
  }, [lightboxDesign, activeSlideIdx]);

  const {
    drafts,
    setDrafts,
    addDraft,
    updateDraft,
    removeDraft,
    selectedDrafts,
    toggleDraftSelection,
    clearSelection,
  } = useUploadStore();

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["designs", user.id],
    queryFn: () => designService.getDesigns(user.id),
    enabled: !!user.id,
  });

  useEffect(() => {
    if (designs.length > 0) {
      setDrafts(designs.filter((d) => d.status === "draft"));
    }
  }, [designs, setDrafts]);

  const publishedDesigns = designs.filter((d) => d.status === "published");

  const deleteMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) => 
      designService.deleteDesign(id, user.id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["designs", user.id] });
      removeDraft(id);
      if (lightboxDesign?.id === id) {
        setLightboxDesign(null);
      }
      showToast("Design removed.", "success");
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "draft" | "published" }) => {
      await designService.deleteDesigns(ids, user.id, status);
      return { ids, status };
    },
    onSuccess: ({ ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ["designs", user.id] });
      if (status === "draft") {
        ids.forEach(id => removeDraft(id));
      }
      if (lightboxDesign && ids.includes(lightboxDesign.id)) {
        setLightboxDesign(null);
      }
      clearSelection();
      setSelectedPublished(new Set());
      showToast("Selected designs deleted.", "success");
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      showToast(error?.message || "Failed to delete some designs.", "error");
    }
  });

  const publishMutation = useMutation({
    mutationFn: (ids: string[]) => designService.publishDrafts(ids, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs", user.id] });
      clearSelection();
      setActiveTab("published");
      showToast("Designs published successfully!", "success");
    },
  });

  // Local state for published selection
  const [selectedPublished, setSelectedPublished] = useState<Set<string>>(new Set());
  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState<"draft" | "published" | null>(null);

  const togglePublishedSelection = (id: string) => {
    const newSelected = new Set(selectedPublished);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPublished(newSelected);
  };

  const clearPublishedSelection = () => {
    setSelectedPublished(new Set());
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-fade-in text-left pb-24 px-4 sm:px-6 pt-4 sm:pt-6 md:pt-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 pb-0.5">
        <button
          onClick={() => setActiveTab("drafts")}
          className={`py-2 px-4 rounded-full text-xs font-space font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "drafts" 
              ? "bg-[#171717] text-white dark:bg-white dark:text-black shadow-sm" 
              : "bg-neutral-100 text-[#888888] hover:bg-neutral-200 dark:bg-white/5 dark:text-[#A9A9A9] dark:hover:bg-white/10"
          }`}
        >
          Drafts ({drafts.length})
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`py-2 px-4 rounded-full text-xs font-space font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "published" 
              ? "bg-[#171717] text-white dark:bg-white dark:text-black shadow-sm" 
              : "bg-neutral-100 text-[#888888] hover:bg-neutral-200 dark:bg-white/5 dark:text-[#A9A9A9] dark:hover:bg-white/10"
          }`}
        >
          Published ({publishedDesigns.length})
        </button>
      </div>

      {/* Grid lists */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-accent" size={28} />
          <span className="text-xs font-mono text-[#888888] uppercase tracking-wider">Crawl indices active...</span>
        </div>
      ) : activeTab === "drafts" ? (
        <div className="space-y-6">
          {/* Selected items publisher banner bar */}
          {selectedDrafts.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-0 left-0 right-0 md:top-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[90%] md:max-w-xl md:rounded-[22px] md:border md:border-accent/30 rounded-none border-t-0 border-x-0 border-b border-accent/20 md:bg-white/95 md:dark:bg-[#1E1E1E]/95 bg-white dark:bg-[#1E1E1E] backdrop-blur-md shadow-lg md:shadow-2xl z-[150] flex flex-row items-center justify-between gap-4 p-4 m-0 animate-fade-in"
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-[11px] sm:text-xs font-space font-bold uppercase tracking-wider text-[#171717] dark:text-white shrink-0">
                  {selectedDrafts.size} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-[10px] sm:text-xs font-mono text-[#888888] hover:text-accent underline cursor-pointer shrink-0"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Button
                  onClick={() => setShowMultiDeleteConfirm("draft")}
                  variant="secondary"
                  loading={deleteSelectedMutation.isPending}
                  className="py-1.5 sm:py-2 px-3 sm:px-5 text-[10px] sm:text-xs h-auto !border-red-500 !text-red-500 hover:!bg-red-500/10"
                >
                  <span className="sm:hidden">Delete</span>
                  <span className="hidden sm:inline">Delete Selected</span>
                </Button>
                <Button
                  loading={publishMutation.isPending}
                  onClick={() => setShowPublishConfirm(true)}
                  variant="primary"
                  className="py-1.5 sm:py-2 px-3 sm:px-5 text-[10px] sm:text-xs h-auto cursor-pointer"
                >
                  <span className="sm:hidden">Publish</span>
                  <span className="hidden sm:inline">Publish for Feedback</span>
                </Button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Elegant visual creation card preceding other drafts */}
            <Card
              onClick={() => onCreateNew?.()}
              className="overflow-hidden bg-[#F7F7F8] dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 hover:shadow-[0_8px_24px_rgba(201,0,35,0.08)] flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group min-h-[340px] h-full rounded-[24px] border-none"
            >
              <div className="flex flex-col items-center justify-center space-y-4 my-auto">
                <div className="w-16 h-16 rounded-full bg-accent/5 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                  <Plus className="text-accent dark:text-white group-hover:text-white transition-colors" size={28} strokeWidth={2.5} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-space font-bold text-[#171717] dark:text-white group-hover:text-accent transition-colors">
                    Create New Post
                  </h4>
                  <p className="text-xs text-[#888888] max-w-[200px] leading-relaxed mx-auto font-sans">
                    Craft a new layout mockup, portfolio post, or upload custom design assets
                  </p>
                </div>
              </div>
            </Card>

            {drafts.map((draft) => (
              <Card
                key={draft.id}
                className="overflow-hidden hover:border-accent hover:shadow-[0_8px_24px_rgba(201,0,35,0.06)] relative group"
              >
                {/* Select Checkbox */}
                <button
                  onClick={() => toggleDraftSelection(draft.id)}
                  className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                    selectedDrafts.has(draft.id) 
                      ? "bg-accent border-accent text-white" 
                      : "bg-black/40 border-white/40 text-transparent hover:border-white"
                  }`}
                >
                  {selectedDrafts.has(draft.id) && <CheckCircle2 size={14} className="stroke-[3]" />}
                </button>

                <div 
                  onClick={() => setLightboxDesign(draft)}
                  className="relative w-full aspect-[16/10] bg-neutral-100 dark:bg-neutral-900 overflow-hidden cursor-pointer"
                >
                  <DesignCarousel
                    imageUrls={draft.imageUrls}
                    fallbackUrl={draft.imageUrl}
                    title={draft.title || "Untitled Draft"}
                    className="w-full h-full"
                  />
                  
                  {/* Hover triggers - always visible as an overlay block on mobile/touch screens, hover-only on desktop */}
                  <div className="absolute inset-0 bg-black/40 sm:bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 sm:p-4 z-10 pointer-events-none">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDraft?.(draft.id);
                        }}
                        className="text-[10px] sm:text-xs font-space font-bold uppercase text-white flex items-center justify-center gap-1.5 hover:text-accent cursor-pointer bg-black/70 sm:bg-transparent px-2.5 py-2 sm:p-0 rounded-xl sm:rounded-none border border-white/15 sm:border-transparent pointer-events-auto shadow-md sm:shadow-none transition-all"
                      >
                        <Edit3 size={11} className="sm:w-[13px] sm:h-[13px]" /> Edit Layout
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxDesign(draft);
                        }}
                        className="text-[10px] sm:text-xs font-space font-bold uppercase text-white flex items-center justify-center gap-1.5 hover:text-accent cursor-pointer bg-black/70 sm:bg-transparent px-2.5 py-2 sm:p-0 rounded-xl sm:rounded-none border border-white/15 sm:border-transparent pointer-events-auto shadow-md sm:shadow-none transition-all"
                      >
                        Preview Draft
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 
                    onClick={() => setLightboxDesign(draft)}
                    className="font-space font-semibold text-sm text-[#171717] dark:text-white truncate cursor-pointer hover:text-accent transition-colors text-left"
                  >
                    {draft.title || "Untitled Draft Mockup"}
                  </h4>
                  <p className="text-xs text-[#555555] dark:text-[#D7D7D7] truncate text-left font-sans">
                    {draft.description || "No description set"}
                  </p>
                  <div className="flex items-end justify-between pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="brand" className="capitalize text-[9px] px-2 py-0.5">{draft.source} Upload</Badge>
                      {draft.category && (
                        <Badge variant="secondary" className="text-[9px] px-2 py-0.5">{draft.category}</Badge>
                      )}
                      {draft.styles?.slice(0, 2).map((s) => (
                        <Badge key={s} variant="outline" className="text-[9px] px-2 py-0.5">{s}</Badge>
                      ))}
                      {draft.styles && draft.styles.length > 2 && (
                        <Badge variant="outline" className="text-[9px] px-2 py-0.5">+{draft.styles.length - 2}</Badge>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDraftToDelete(draft);
                      }}
                      className="text-[#888888] hover:text-red-500 transition-colors shrink-0 pb-1 cursor-pointer"
                      title="Delete Draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : publishedDesigns.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-[#F7F7F8] dark:bg-surface-dark/40 rounded-[24px] border-none">
          <img 
            src={theme === 'dark' ? '/no-data-found-d.svg' : '/no-data-found-l.svg'} 
            alt="No published designs found" 
            className="w-48 h-auto opacity-70 mb-2"
          />
          <span className="text-xs font-mono text-[#888888] uppercase tracking-widest max-w-sm text-center">
            No designs published to feedback loop yet. Complete details on drafting mockups and publish.
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected items publisher banner bar for published designs */}
          {selectedPublished.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-0 left-0 right-0 md:top-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[90%] md:max-w-xl md:rounded-[22px] md:border md:border-accent/30 rounded-none border-t-0 border-x-0 border-b border-accent/20 md:bg-white/95 md:dark:bg-[#1E1E1E]/95 bg-white dark:bg-[#1E1E1E] backdrop-blur-md shadow-lg md:shadow-2xl z-[150] flex flex-row items-center justify-between gap-4 p-4 m-0 animate-fade-in"
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-[11px] sm:text-xs font-space font-bold uppercase tracking-wider text-[#171717] dark:text-white shrink-0">
                  {selectedPublished.size} selected
                </span>
                <button
                  onClick={clearPublishedSelection}
                  className="text-[10px] sm:text-xs font-mono text-[#888888] hover:text-accent underline cursor-pointer shrink-0"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Button
                  onClick={() => setShowMultiDeleteConfirm("published")}
                  variant="secondary"
                  loading={deleteSelectedMutation.isPending}
                  className="py-1.5 sm:py-2 px-3 sm:px-5 text-[10px] sm:text-xs h-auto !border-red-500 !text-red-500 hover:!bg-red-500/10"
                >
                  <span className="sm:hidden">Delete</span>
                  <span className="hidden sm:inline">Delete Selected</span>
                </Button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedDesigns.map((design) => (
              <Card
                key={design.id}
                className={`overflow-hidden hover:border-accent ${selectedPublished.has(design.id) ? 'border-accent ring-1 ring-accent' : ''}`}
              >
                <div 
                  onClick={() => setLightboxDesign(design)}
                  className="relative aspect-[16/10] w-full shrink-0 group cursor-pointer"
                >
                  <DesignCarousel
                    imageUrls={design.imageUrls}
                    fallbackUrl={design.imageUrl}
                    title={design.title}
                    className="w-full h-full"
                  />
                  
                  {/* Hover triggers - always visible as an overlay block on mobile/touch screens, hover-only on desktop */}
                  <div className="absolute inset-0 bg-black/30 sm:bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4 z-10 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxDesign(design);
                      }}
                      className="text-[10px] sm:text-xs font-space font-bold uppercase text-white bg-black/60 sm:bg-accent px-3 py-1.5 rounded-full border border-white/10 sm:border-transparent pointer-events-auto shadow-md cursor-pointer transition-colors hover:scale-105"
                    >
                      Preview Design
                    </button>
                  </div>

                  {/* Select Checkbox */}
                  <div className="absolute top-4 left-4 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePublishedSelection(design.id);
                      }}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                        selectedPublished.has(design.id) 
                          ? 'bg-accent border-accent text-white' 
                          : 'bg-black/20 border-white/40 text-transparent hover:border-white'
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2 text-left">
                  <h4 
                    onClick={() => setLightboxDesign(design)}
                    className="font-space font-semibold text-sm text-[#171717] dark:text-white truncate cursor-pointer hover:text-accent transition-colors"
                  >
                    {design.title}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {design.category && (
                      <Badge variant="secondary" className="text-[9px] px-2 py-0.5">{design.category}</Badge>
                    )}
                    {design.styles?.slice(0, 2).map((s) => (
                      <Badge key={s} variant="outline" className="text-[9px] px-2 py-0.5">{s}</Badge>
                    ))}
                    {design.styles && design.styles.length > 2 && (
                      <Badge variant="outline" className="text-[9px] px-2 py-0.5">+{design.styles.length - 2}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      {/* Beautiful modern pill-shaped like indicator */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 text-[#C90023] dark:text-red-400 font-space font-black text-xs select-none hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer" title={`${design.stats.likes} likes`}>
                        <Heart 
                          size={13} 
                          fill="currentColor" 
                          className="text-[#C90023] dark:text-red-400 shrink-0" 
                        />
                        <span>
                          {formatLikesCount(design.stats.likes)}
                        </span>
                      </div>
                      
                      {/* Published details */}
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono text-[#888888] uppercase tracking-wider leading-none">Published</span>
                        <span className="text-[11px] font-space font-medium text-[#555555] dark:text-[#CCCCCC] mt-0.5">
                          {new Date(design.publishedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDraftToDelete(design);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#888888] hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 shrink-0 cursor-pointer"
                      title="Delete Published Design"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Deletion dialog Modal */}
      <ConfirmationModal
        show={!!draftToDelete}
        theme={theme}
        title="Delete Design"
        iconType="trash"
        variant="danger"
        confirmText="Delete Design"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (draftToDelete) {
            deleteMutation.mutate({
              id: draftToDelete.id,
              status: draftToDelete.status,
            });
          }
          setDraftToDelete(null);
        }}
        onClose={() => setDraftToDelete(null)}
        description={
          <p>
            Are you sure you want to permanently delete <span className="font-semibold text-white">"{draftToDelete?.title || "Untitled Draft"}"</span>? This action cannot be undone.
          </p>
        }
      />

      {/* Multi-Deletion dialog Modal */}
      <ConfirmationModal
        show={!!showMultiDeleteConfirm}
        theme={theme}
        title={showMultiDeleteConfirm ? `Delete ${showMultiDeleteConfirm === 'draft' ? selectedDrafts.size : selectedPublished.size} Designs?` : "Delete Designs?"}
        iconType="trash"
        variant="danger"
        confirmText="Delete Selected"
        cancelText="Cancel"
        isLoading={deleteSelectedMutation.isPending}
        onConfirm={() => {
          if (showMultiDeleteConfirm) {
            const ids = Array.from(showMultiDeleteConfirm === 'draft' ? selectedDrafts : selectedPublished) as string[];
            deleteSelectedMutation.mutate({ ids, status: showMultiDeleteConfirm });
          }
          setShowMultiDeleteConfirm(null);
        }}
        onClose={() => setShowMultiDeleteConfirm(null)}
        description={
          <p>
            Are you sure you want to permanently delete the selected designs? This action cannot be undone.
          </p>
        }
      />



      {/* Dynamic Projects Preview Lightbox */}
      <AnimatePresence>
        {lightboxDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 backdrop-blur-xl z-[130] flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${
              theme === "dark" 
                ? "bg-[#121212]/98 text-white" 
                : "bg-[#FFFFFF]/98 text-[#171717]"
            }`}
            onClick={() => setLightboxDesign(null)}
          >
            {/* Top Hover Sensor Bar */}
            <div 
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
              className="absolute top-0 left-0 right-0 h-20 z-20 pointer-events-auto"
            />

            {/* Top Header Controls */}
            <div 
              className={`absolute top-4 left-4 right-4 ${!isPanelCollapsed ? "md:right-[396px]" : "md:right-4"} flex items-center justify-between z-30 pointer-events-none transition-all duration-300 ${
                (zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0) && !isHeaderHovered
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`} 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Draft vs Published Identifier Info */}
              <div className="pointer-events-auto">
                <div 
                  className={`flex items-center gap-2 p-1.5 pl-3 pr-4 rounded-full border shadow-md backdrop-blur-md transition-colors ${
                    theme === "dark"
                      ? "bg-[#1E1E1E]/90 border-white/10 text-white"
                      : "bg-white/95 border-neutral-200 text-[#171717]"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${lightboxDesign.status === 'draft' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-[10px] font-space font-bold uppercase tracking-widest">
                    {lightboxDesign.status === 'draft' ? 'Draft Layout' : 'Published'}
                  </span>
                </div>
              </div>

              {/* Controls on Right */}
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                {/* Edit Layout Button - Visible ONLY for drafts */}
                {lightboxDesign.status === "draft" && (
                  <Tooltip content="Edit Layout Details" theme={theme} position="bottom">
                    <button
                      onClick={() => {
                        onEditDraft?.(lightboxDesign.id);
                        setLightboxDesign(null);
                      }}
                      className="p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-sans font-bold tracking-tight flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      <Edit3 size={13} className="shrink-0" />
                      <span className="hidden sm:inline">Edit Layout</span>
                    </button>
                  </Tooltip>
                )}

                {/* Delete Design Button */}
                <Tooltip content="Delete Design" theme={theme} position="bottom">
                  <button
                    onClick={() => setDraftToDelete(lightboxDesign)}
                    className={`p-2.5 sm:p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20"
                        : "bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border-red-200"
                    }`}
                  >
                    <Trash2 size={18} className="stroke-[2.5]" />
                  </button>
                </Tooltip>

                {/* Collapse/Expand Side Panel Toggle */}
                <Tooltip content={isPanelCollapsed ? "Show Details" : "Hide Details"} theme={theme} position="bottom">
                  <button
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    className={`p-2.5 sm:p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-[#1E1E1E]/80 hover:bg-[#2B2B2B] text-white border-[#2B2B2B]"
                        : "bg-white hover:bg-neutral-100 text-[#171717] border-neutral-200"
                    }`}
                  >
                    <Info size={18} className="stroke-[2.5]" />
                  </button>
                </Tooltip>

                {/* Close Button */}
                <Tooltip content="Close Viewer" theme={theme} position="bottom">
                  <button
                    onClick={() => setLightboxDesign(null)}
                    className={`p-2.5 sm:p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-[#1E1E1E]/80 hover:bg-[#2B2B2B] text-white border-[#2B2B2B]"
                        : "bg-white hover:bg-neutral-100 text-[#171717] border-neutral-200"
                    }`}
                  >
                    <X size={18} className="stroke-[2.5]" />
                  </button>
                </Tooltip>
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

            {/* Left Content Area - Zoom, Pan, Carousel Controls */}
            {(() => {
              const currentUrls = (lightboxDesign.imageUrls && lightboxDesign.imageUrls.length > 0)
                ? lightboxDesign.imageUrls
                : [lightboxDesign.imageUrl].filter(Boolean);
              const activeUrl = currentUrls[activeSlideIdx] || lightboxDesign.imageUrl;

              return (
                <div 
                  ref={imageAreaRef}
                  className={`flex-1 relative flex items-center justify-center select-none h-full md:h-full overflow-hidden transition-all duration-300 ${
                    !isPanelCollapsed 
                      ? (isPanelFullyExpanded ? "p-4 pb-[calc(100vh-120px)] md:p-0" : "p-4 pb-[324px] md:p-0")
                      : "p-4 pb-[74px] md:p-0"
                  }`}
                  onClick={() => setLightboxDesign(null)}
                >
                  {/* Blurred Ambient Glow Back-reflection */}
                  {activeUrl && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-35 blur-[120px] scale-110 transition-all duration-500"
                      style={{ zIndex: 0 }}
                    >
                      <img 
                        src={activeUrl} 
                        alt=""
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Gradient Radial Cover */}
                  <div 
                    className={`absolute inset-0 pointer-events-none z-0 ${
                      theme === "dark" 
                        ? "bg-gradient-to-t from-[#121212]/85 via-transparent to-[#121212]/85" 
                        : "bg-gradient-to-t from-white/70 via-transparent to-white/70"
                    }`}
                  />

                  {/* Dark mask on zoom */}
                  <div 
                    className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
                      zoomScale > 1 
                        ? theme === "dark" 
                          ? "opacity-60 bg-black" 
                          : "opacity-45 bg-black" 
                        : "opacity-0 bg-transparent"
                    }`}
                  />

                  {/* Active Slide Image Wrapper */}
                  <motion.div
                    ref={touchAreaRef}
                    initial={{ scale: 0.94, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: 15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.05 }}
                    className="relative z-10 w-full h-full flex items-center justify-center overflow-visible touch-pan-y"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Carousel Nav Button Left */}
                    {currentUrls.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlideIdx((prev) => (prev > 0 ? prev - 1 : currentUrls.length - 1));
                        }}
                        className={`absolute left-4 p-3 rounded-full border shadow-md backdrop-blur-md z-30 transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-[#1E1E1E]/80 hover:bg-[#2B2B2B] text-white border-[#2B2B2B]"
                            : "bg-white hover:bg-neutral-100 text-[#171717] border-neutral-200"
                        }`}
                      >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                      </button>
                    )}

                    {/* Carousel Nav Button Right */}
                    {currentUrls.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlideIdx((prev) => (prev < currentUrls.length - 1 ? prev + 1 : 0));
                        }}
                        className={`absolute right-4 p-3 rounded-full border shadow-md backdrop-blur-md z-30 transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-[#1E1E1E]/80 hover:bg-[#2B2B2B] text-white border-[#2B2B2B]"
                            : "bg-white hover:bg-neutral-100 text-[#171717] border-neutral-200"
                        }`}
                      >
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </button>
                    )}

                    {/* Static Slide Numbers Indicator */}
                    {currentUrls.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md bg-black/50 text-white/95 shadow-sm border border-white/10 select-none">
                        {activeSlideIdx + 1} of {currentUrls.length} Slides
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
                      {activeUrl ? (
                        <img
                          ref={imageRef}
                          src={activeUrl}
                          alt={lightboxDesign.title}
                          className="w-full h-full max-w-full max-h-full object-contain select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center py-12">
                          <ImageIcon size={48} className="mx-auto text-neutral-400 mb-2" />
                          <p className="text-xs text-neutral-500 font-mono">No mockup image loaded</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              );
            })()}

            {/* Side Panel (Desktop) */}
            <motion.div
              animate={{ 
                width: isPanelCollapsed ? 0 : 380,
                opacity: isPanelCollapsed ? 0 : 1
              }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className={`hidden md:flex relative h-full border-l flex-col justify-between shrink-0 z-10 overflow-hidden ${
                theme === "dark" 
                  ? "bg-[#1E1E1E] border-divider-dark text-white" 
                  : "bg-white border-neutral-200 text-[#171717]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Side Panel Header */}
              <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
                theme === "dark" ? "border-divider-dark" : "border-neutral-100"
              }`}>
                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group/creator hover:opacity-85 transition-opacity"
                  onClick={() => setActiveDesignerId(user.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 overflow-hidden transition-colors group-hover/creator:border-accent ${
                    theme === "dark"
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-accent/20 border border-accent/30 text-accent"
                  }`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username || "user"} className="w-full h-full object-cover" />
                    ) : (
                      user.username ? user.username.slice(0, 1).toUpperCase() : "M"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-space truncate group-hover/creator:text-accent transition-colors ${
                      theme === "dark" ? "text-white" : "text-[#171717]"
                    }`}>
                      @{user.username || "me"}
                    </p>
                    <span className={`text-[9px] font-mono block ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Author Workspace
                    </span>
                  </div>
                </div>
                
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

              {/* Side Panel Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                <div>
                  <h3 className={`text-xl font-bold font-space tracking-tight leading-snug ${
                    theme === "dark" ? "text-white" : "text-[#171717]"
                  }`}>
                    {lightboxDesign.title || "Untitled Project Layout"}
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

                <div>
                  <h4 className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${
                    theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                  }`}>
                    Details
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#888888]">LIKES:</span>
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <Heart size={11} className="fill-current text-rose-500" />
                        {formatLikesCount(lightboxDesign.stats?.likes || lightboxDesign.stats?.rightSwipes || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888888]">STATUS:</span>
                      <span className={`font-bold capitalize ${lightboxDesign.status === 'draft' ? 'text-amber-500' : 'text-green-500'}`}>
                        {lightboxDesign.status}
                      </span>
                    </div>
                    {lightboxDesign.publishedAt && (
                      <div className="flex justify-between">
                        <span className="text-[#888888]">PUBLISHED:</span>
                        <span>{new Date(lightboxDesign.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#888888]">CREATED:</span>
                      <span>{new Date(lightboxDesign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {lightboxDesign.description && (
                  <div>
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

                {/* Comments & Feedback */}
                <div className={`pt-5 border-t ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}>
                  <DesignCommentsSection design={lightboxDesign} user={user} theme={theme} onOpenProfile={(id) => setActiveDesignerId(id)} />
                </div>
              </div>
            </motion.div>

            {/* Mobile Bottom Panel */}
            <motion.div
              animate={{ 
                height: isPanelCollapsed ? 0 : (isPanelFullyExpanded ? "calc(100vh - 120px)" : "250px"),
                opacity: isPanelCollapsed ? 0 : 1
              }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className={`flex md:hidden absolute inset-x-0 bottom-[64px] flex-col z-40 overflow-hidden rounded-t-3xl transition-colors duration-300 ${
                theme === "dark" 
                  ? "bg-[#1E1E1E] border-t border-divider-dark text-white shadow-[0_-15px_40px_rgba(0,0,0,0.5)]" 
                  : "bg-white border-t border-neutral-200 text-[#171717] shadow-[0_-15px_40px_rgba(0,0,0,0.1)]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div 
                onClick={() => setIsPanelFullyExpanded(!isPanelFullyExpanded)}
                className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 cursor-pointer ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}
              >
                <div 
                  className="flex items-center gap-2 min-w-0 cursor-pointer group/creator hover:opacity-85 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDesignerId(user.id);
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 overflow-hidden transition-colors group-hover/creator:border-accent ${
                    theme === "dark"
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-accent/20 border border-accent/30 text-accent"
                  }`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username || "user"} className="w-full h-full object-cover" />
                    ) : (
                      user.username ? user.username.slice(0, 1).toUpperCase() : "M"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-space truncate group-hover/creator:text-accent transition-colors ${
                      theme === "dark" ? "text-white" : "text-[#171717]"
                    }`}>
                      @{user.username || "me"}
                    </p>
                    <span className={`text-[9px] font-mono block ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Creator Profile
                    </span>
                  </div>
                </div>

                {/* Drag Handle Indicator */}
                <div className="hidden xs:flex flex-col items-center gap-0.5 pointer-events-none">
                  <div className={`w-8 h-1 rounded-full ${theme === "dark" ? "bg-white/20" : "bg-neutral-300"}`} />
                  <span className={`text-[8px] font-mono tracking-wider uppercase ${theme === "dark" ? "text-neutral-500" : "text-neutral-400"}`}>
                    {isPanelFullyExpanded ? "Tap to Shrink" : "Tap to Expand"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setIsPanelFullyExpanded(!isPanelFullyExpanded)}
                    className={`p-1.5 rounded-full transition-all cursor-pointer border shrink-0 ${
                      theme === "dark"
                        ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200"
                    }`}
                    title={isPanelFullyExpanded ? "Shrink details" : "Fully expand details"}
                  >
                    {isPanelFullyExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>

                  <button
                    onClick={() => {
                      setIsPanelCollapsed(true);
                      setIsPanelFullyExpanded(false);
                    }}
                    className={`p-1.5 rounded-full transition-all cursor-pointer border shrink-0 ${
                      theme === "dark"
                        ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200"
                    }`}
                    title="Hide Panel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left">
                <div>
                  <h3 className={`text-base font-bold font-space tracking-tight leading-snug ${
                    theme === "dark" ? "text-white" : "text-[#171717]"
                  }`}>
                    {lightboxDesign.title || "Untitled Project Layout"}
                  </h3>
                </div>

                {lightboxDesign.description && (
                  <div>
                    <p className={`text-xs leading-relaxed ${
                      theme === "dark" ? "text-neutral-300" : "text-neutral-600"
                    }`}>
                      {lightboxDesign.description}
                    </p>
                  </div>
                )}

                {/* Mobile Comments & Feedback */}
                <div className={`pt-3 border-t ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}>
                  <DesignCommentsSection design={lightboxDesign} user={user} theme={theme} onOpenProfile={(id) => setActiveDesignerId(id)} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        show={showPublishConfirm}
        theme={theme}
        title="Publish this design?"
        iconType="warning"
        variant="info"
        confirmText="Publish Design"
        cancelText="Cancel"
        onConfirm={() => {
          setShowPublishConfirm(false);
          publishMutation.mutate(Array.from(selectedDrafts));
        }}
        onClose={() => setShowPublishConfirm(false)}
        description={
          <p>
            Your design will become publicly visible and start receiving community feedback immediately.
          </p>
        }
      />

      {/* Designer Profile Modal */}
      {activeDesignerId && (
        <DesignerProfileModal
          show={!!activeDesignerId}
          theme={theme}
          designerId={activeDesignerId}
          onClose={() => setActiveDesignerId(null)}
          showToast={showToast}
          onOpenProfile={(id) => setActiveDesignerId(id)}
        />
      )}

    </div>
  );
};
