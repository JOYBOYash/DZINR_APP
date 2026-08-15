import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, Trash2, X, Compass, Calendar, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Move, ZoomIn, Grid, Layers, Heart, FolderPlus, FolderOpen, Lock, Globe, Users, Share2, Plus, Image, Edit3, MessageSquare, Sparkles } from "lucide-react";
import { formatLikesCount } from "../utils/likes";
import { UserProfile } from "../types";
import { Design } from "../services/design.service";
import { discoveryService } from "../services/discovery.service";
import { userService } from "../services/user.service";
import { useToastStore } from "../stores/toast.store";
import { Loader } from "./Loader";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import { MoodboardSelectionModal } from "./MoodboardSelectionModal";
import { CreateMoodboardModal } from "./CreateMoodboardModal";
import { DesignerProfileModal } from "./DesignerProfileModal";
import { DesignCommentsSection } from "./DesignCommentsSection";
import { ConfirmationModal } from "./ConfirmationModal";

interface SavedVaultViewProps {
  user: UserProfile;
  theme: "dark" | "light";
  onExploreFeed: () => void;
  onLightboxToggle?: (isOpen: boolean, isZoomed?: boolean) => void;
}

export const SavedVaultView: React.FC<SavedVaultViewProps> = ({
  user,
  theme,
  onExploreFeed,
  onLightboxToggle,
}) => {
  const { showToast } = useToastStore();
  const [verifiedDesigns, setVerifiedDesigns] = useState<Design[] | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [lightboxDesign, setLightboxDesign] = useState<Design | null>(null);
  const [isUnsavingId, setIsUnsavingId] = useState<string | null>(null);
  const [designToDelete, setDesignToDelete] = useState<Design | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [selectedStyle, setSelectedStyle] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grouped" | "grid" | "moodboards">("grouped");
  const [activeDesignerId, setActiveDesignerId] = useState<string | null>(null);

  // Moodboard states
  const [selectionDesign, setSelectionDesign] = useState<Design | null>(null);
  const [showCreateMoodboard, setShowCreateMoodboard] = useState<boolean>(false);
  const [moodboards, setMoodboards] = useState<any[]>([]);
  const [activeMoodboard, setActiveMoodboard] = useState<any | null>(null);
  const [activeMoodboardDesigns, setActiveMoodboardDesigns] = useState<Design[]>([]);
  const [loadingActiveMoodboard, setLoadingActiveMoodboard] = useState<boolean>(false);

  // Edit Moodboard states
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editPrivacy, setEditPrivacy] = useState<"public" | "private" | "shared">("private");
  const [boardToDelete, setBoardToDelete] = useState<any | null>(null);

  // Subscribe to user's moodboards
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = discoveryService.subscribeUserMoodboards(user.id, (boards) => {
      setMoodboards(boards);
      if (activeMoodboard) {
        const updated = boards.find(b => b.id === activeMoodboard.id);
        if (updated) {
          setActiveMoodboard(updated);
        }
      }
    });
    return unsubscribe;
  }, [user?.id, activeMoodboard?.id]);

  // Fetch designs for the selected active moodboard
  useEffect(() => {
    if (!activeMoodboard) {
      setActiveMoodboardDesigns([]);
      return;
    }
    const fetchActiveMoodboardDesigns = async () => {
      const designIds = activeMoodboard.designIds || [];
      if (designIds.length === 0) {
        setActiveMoodboardDesigns([]);
        return;
      }
      setLoadingActiveMoodboard(true);
      try {
        const { db } = await import("../services/firebase");
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const designs: Design[] = [];
        
        // Chunk query by max 30 items
        const chunks: string[][] = [];
        for (let i = 0; i < designIds.length; i += 30) {
          chunks.push(designIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
          const q = query(collection(db, "designs"), where("id", "in", chunk));
          const snap = await getDocs(q);
          snap.forEach((doc) => {
            designs.push({ id: doc.id, ...doc.data() } as Design);
          });
        }
        setActiveMoodboardDesigns(designs);
      } catch (err) {
        console.error("Failed to fetch active moodboard designs:", err);
      } finally {
        setLoadingActiveMoodboard(false);
      }
    };
    fetchActiveMoodboardDesigns();
  }, [activeMoodboard, moodboards]); // trigger refetch if moodboard changes or updates (e.g. item added/removed)

  const handleCreateMoodboard = async (name: string, description: string, privacy: "public" | "private" | "shared", collaborators: string[]) => {
    try {
      await discoveryService.createMoodboard(user.id, name, privacy, user.username, collaborators, description);
      showToast(`Moodboard "${name}" created successfully!`, "success");
      setShowCreateMoodboard(false);
    } catch (err) {
      console.error(err);
      showToast("Could not create moodboard. Try again.", "error");
    }
  };

  const handleUpdateMoodboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMoodboard || !editName.trim()) return;
    try {
      await discoveryService.updateMoodboard(activeMoodboard.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        privacy: editPrivacy,
      });
      showToast("Moodboard details updated successfully!", "success");
      setIsEditingDetails(false);
    } catch (err) {
      console.error(err);
      showToast("Could not update moodboard details.", "error");
    }
  };

  // Get all unique styles that exist in the user's saved designs (using primary style)
  const availableStyles = React.useMemo(() => {
    if (!verifiedDesigns) return [];
    const stylesSet = new Set<string>();
    verifiedDesigns.forEach((design) => {
      const pStyle = (design as any).primaryStyle || (design.styles && design.styles[0]) || "Minimalist";
      stylesSet.add(pStyle);
    });
    return Array.from(stylesSet).sort();
  }, [verifiedDesigns]);

  // Group the designs by their primary style aesthetics
  const groupedDesigns = React.useMemo(() => {
    if (!verifiedDesigns) return {} as Record<string, Design[]>;
    const groups: Record<string, Design[]> = {};
    
    verifiedDesigns.forEach((design) => {
      const pStyle = (design as any).primaryStyle || (design.styles && design.styles[0]) || "Minimalist";
      if (!groups[pStyle]) {
        groups[pStyle] = [];
      }
      groups[pStyle].push(design);
    });
    return groups;
  }, [verifiedDesigns]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );
  const [isPanelFullyExpanded, setIsPanelFullyExpanded] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const imageAreaRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Sync lightbox open state to parent to hide global navigation
  useEffect(() => {
    const isZoomed = !!lightboxDesign && (zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0);
    onLightboxToggle?.(!!lightboxDesign, isZoomed);
  }, [lightboxDesign, zoomScale, panOffset, onLightboxToggle]);

  // Automatically reset collapse state and zoom on mobile vs desktop when design changes
  useEffect(() => {
    if (lightboxDesign) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsPanelCollapsed(isMobile);
      setIsPanelFullyExpanded(false);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setIsPanelFullyExpanded(false);
    }
  }, [lightboxDesign]);

  // Lightbox interaction states
  const [showViewerGuide, setShowViewerGuide] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Sync like status when opening a design in lightbox
  useEffect(() => {
    if (!lightboxDesign || !user?.id) return;
    setLikesCount(lightboxDesign.stats?.likes || lightboxDesign.stats?.rightSwipes || 0);
    discoveryService.checkIfUserLikedDesign(user.id, lightboxDesign.id).then((liked) => {
      setIsLiked(liked);
    });
  }, [lightboxDesign, user?.id]);

  const handleToggleLike = async () => {
    if (!lightboxDesign || !user?.id) return;
    setLikeLoading(true);
    try {
      const res = await discoveryService.toggleLikeDesign(user.id, lightboxDesign.id);
      setIsLiked(res.liked);
      setLikesCount(res.newCount);
      
      setVerifiedDesigns(prev => prev ? prev.map(d => {
        if (d.id === lightboxDesign.id) {
          return {
            ...d,
            stats: {
              ...d.stats,
              likes: res.newCount,
              rightSwipes: res.newCount
            }
          };
        }
        return d;
      }) : null);

      setLightboxDesign(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          likes: res.newCount,
          rightSwipes: res.newCount
        }
      } : null);

      showToast(res.liked ? "Added design to your likes!" : "Unliked design.", "success");
    } catch (err) {
      console.error("Failed to toggle like:", err);
      showToast("Failed to update like status.", "error");
    } finally {
      setLikeLoading(false);
    }
  };

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

  const usernamesRef = useRef<Record<string, string>>({});

  // Set up the real-time subscription for saved designs
  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    const unsubscribe = discoveryService.subscribeUserSavedDesigns(user.id, (rawDesigns) => {
      if (!active) return;
      setVerifiedDesigns(rawDesigns);
      setIsValidating(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id]);

  const verifiedDesignsIdsString = verifiedDesigns?.map(d => `${d.id}-${d.userId}`).join(",") || "";

  // Fetch missing usernames in the background without blocking the subscription
  useEffect(() => {
    if (!verifiedDesigns || verifiedDesigns.length === 0) return;

    const fetchMissingUsernames = async () => {
      const uniqueCreatorIds = Array.from(
        new Set(verifiedDesigns.map((d) => d.userId).filter(Boolean))
      ) as string[];

      const missingIds = uniqueCreatorIds.filter((id) => !usernamesRef.current[id]);

      if (missingIds.length === 0) return;

      // Optimistically lock to avoid duplicate parallel fetches
      missingIds.forEach((id) => {
        usernamesRef.current[id] = "Loading...";
      });

      const newNames: Record<string, string> = {};
      const deletedIds: string[] = [];

      await Promise.all(
        missingIds.map(async (creatorId) => {
          try {
            const profile = await userService.getUserProfile(creatorId);
            if (profile) {
              newNames[creatorId] = profile.username;
              usernamesRef.current[creatorId] = profile.username;
            } else {
              deletedIds.push(creatorId);
              usernamesRef.current[creatorId] = "deleted_account";
            }
          } catch (err) {
            console.warn("Error fetching user profile for verification:", creatorId, err);
            deletedIds.push(creatorId);
            usernamesRef.current[creatorId] = "deleted_account";
          }
        })
      );

      if (deletedIds.length > 0) {
        // 1. Cleanly update designs state synchronously
        setVerifiedDesigns((prev) => {
          if (!prev) return prev;
          return prev.filter((d) => !deletedIds.includes(d.userId));
        });

        // 2. Perform Firestore deletion side effect safely in the async context outside the state updater
        const orphanedDesigns = verifiedDesigns.filter(d => deletedIds.includes(d.userId));
        if (orphanedDesigns.length > 0) {
          import("firebase/firestore").then(async ({ deleteDoc, doc }) => {
            const { db } = await import("../services/firebase");
            for (const design of orphanedDesigns) {
              await deleteDoc(doc(db, "designs", design.id)).catch(() => {});
            }
          }).catch((e) => console.warn("Failed to delete orphaned designs:", e));
        }
      }

      setUsernames((prev) => ({ ...prev, ...newNames }));
    };

    fetchMissingUsernames();
  }, [verifiedDesignsIdsString]);

  // Lazy loading (infinite scrolling) observer
  useEffect(() => {
    if (!verifiedDesigns || verifiedDesigns.length <= visibleCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Add a smooth visual delay to loading next blocks
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 10, verifiedDesigns.length));
          }, 250);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = loaderRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [verifiedDesigns, visibleCount]);

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
      setDesignToDelete(null);
    }
  };

  const displayedDesigns = (verifiedDesigns || []).slice(0, visibleCount);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-0 py-4 pt-6">
      {verifiedDesigns === null ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#888888] dark:text-[#A9A9A9]">
          <Loader id="saved-vault-loader" size="md" />
          <span>Synchronizing inspiration vault...</span>
        </div>
      ) : verifiedDesigns.length === 0 ? (
        <div className="py-12 rounded-[32px] bg-neutral-50/30 dark:bg-white/2">
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
        <div className="w-full flex flex-col">
          {/* Aesthetic Controls & Mode Switcher */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
            {/* Horizontal Filter Row */}
            {viewMode !== "moodboards" ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setSelectedStyle("All")}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedStyle === "All"
                      ? "bg-[#171717] text-white dark:bg-white dark:text-black shadow-sm"
                      : "bg-neutral-100 text-[#555555] hover:bg-neutral-200 dark:bg-white/5 dark:text-[#A9A9A9] dark:hover:bg-white/10"
                  }`}
                >
                  <span>All Aesthetics</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    selectedStyle === "All"
                      ? "bg-white/20 text-white dark:bg-black/10 dark:text-black"
                      : "bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-[#A9A9A9]"
                  }`}>
                    {verifiedDesigns.length}
                  </span>
                </button>

                {availableStyles.map((style) => {
                  const count = groupedDesigns[style]?.length || 0;
                  return (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        selectedStyle === style
                          ? "bg-[#171717] text-white dark:bg-white dark:text-black shadow-sm"
                          : "bg-neutral-100 text-[#555555] hover:bg-neutral-200 dark:bg-white/5 dark:text-[#A9A9A9] dark:hover:bg-white/10"
                      }`}
                    >
                      <span>{style}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        selectedStyle === style
                          ? "bg-white/20 text-white dark:bg-black/10 dark:text-black"
                          : "bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-[#A9A9A9]"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* View Mode Switcher Toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setViewMode("grouped")}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  viewMode === "grouped"
                    ? "bg-white dark:bg-white/10 text-[#171717] dark:text-white shadow-sm"
                    : "text-[#555555] dark:text-[#A9A9A9] hover:text-[#171717] dark:hover:text-white"
                }`}
                title="Grouped by Style"
                aria-label="Grouped by Style"
              >
                <Layers size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-white/10 text-[#171717] dark:text-white shadow-sm"
                    : "text-[#555555] dark:text-[#A9A9A9] hover:text-[#171717] dark:hover:text-white"
                }`}
                title="Continuous Grid"
                aria-label="Continuous Grid"
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode("moodboards")}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  viewMode === "moodboards"
                    ? "bg-white dark:bg-white/10 text-[#171717] dark:text-white shadow-sm"
                    : "text-[#555555] dark:text-[#A9A9A9] hover:text-[#171717] dark:hover:text-white"
                }`}
                title="My Moodboards"
                aria-label="My Moodboards"
              >
                <FolderPlus size={15} />
              </button>
            </div>
          </div>

          {/* Design Cards Render Section */}
          <AnimatePresence mode="wait">
            {viewMode === "grouped" ? (
              <motion.div
                key="grouped-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-12"
              >
                {(Object.entries(groupedDesigns) as [string, Design[]][])
                  .filter(([style]) => selectedStyle === "All" || style === selectedStyle)
                  .map(([style, styleDesigns]) => (
                    <div key={style} className="text-left">
                      {/* Style Section Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h2 className="text-sm font-bold font-space uppercase tracking-wider text-[#171717] dark:text-white">
                            {style}
                          </h2>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-[#555555] dark:text-[#A9A9A9] font-medium border border-neutral-200/55 dark:border-white/5">
                            {styleDesigns.length} {styleDesigns.length === 1 ? "Inspiration" : "Inspirations"}
                          </span>
                        </div>
                      </div>

                      {/* Style Specific Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {styleDesigns.map((design) => {
                          const creatorUsername = usernames[design.userId] || "loading...";
                          return (
                            <motion.div
                              key={`${style}-${design.id}`}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="group relative flex flex-col cursor-pointer"
                              onClick={() => setLightboxDesign(design)}
                            >
                              <div className="relative rounded-[20px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-[#171717] aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300">
                                <img
                                  src={design.imageUrl}
                                  alt={design.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Direct Save to Moodboard button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectionDesign(design);
                                  }}
                                  className="absolute top-3 right-12 p-2.5 bg-black/60 hover:bg-[#C90023] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10"
                                  title="Save to Moodboard"
                                >
                                  <FolderPlus size={13} />
                                </button>

                                {/* Direct Unsave button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDesignToDelete(design);
                                  }}
                                  disabled={isUnsavingId === design.id}
                                  className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10"
                                  title="Remove from saved archive"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              {/* Info Box sits cleanly below the design image */}
                              <div className="mt-2.5 px-1 text-left">
                                <h4 className="text-xs font-bold text-[#171717] dark:text-white font-space tracking-tight truncate leading-tight block">
                                  {design.title}
                                </h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span 
                                    className="text-[10px] font-mono text-neutral-500 dark:text-[#A9A9A9] truncate max-w-[70%] hover:text-accent hover:underline transition-colors pointer-events-auto cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDesignerId(design.userId);
                                    }}
                                  >
                                    @{creatorUsername}
                                  </span>
                                  <div className="flex items-center gap-1 text-[#555555] dark:text-[#A9A9A9] font-space text-[10px] font-medium shrink-0">
                                    <Heart size={10} className="text-rose-500 fill-rose-500 shrink-0" />
                                    <span>{formatLikesCount(design.stats?.likes || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full flex flex-col"
              >
                {/* Continuous Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {verifiedDesigns
                    .filter((design) => {
                      if (selectedStyle === "All") return true;
                      const pStyle = (design as any).primaryStyle || (design.styles && design.styles[0]) || "Minimalist";
                      return pStyle === selectedStyle;
                    })
                    .slice(0, visibleCount)
                    .map((design) => {
                      const creatorUsername = usernames[design.userId] || "loading...";
                      return (
                        <motion.div
                          key={`grid-${design.id}`}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className="group relative flex flex-col cursor-pointer"
                          onClick={() => setLightboxDesign(design)}
                        >
                          <div className="relative rounded-[20px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-[#171717] aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300">
                            <img
                              src={design.imageUrl}
                              alt={design.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Direct Save to Moodboard button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectionDesign(design);
                              }}
                              className="absolute top-3 right-12 p-2.5 bg-black/60 hover:bg-[#C90023] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10"
                              title="Save to Moodboard"
                            >
                              <FolderPlus size={13} />
                            </button>

                            {/* Direct Unsave button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDesignToDelete(design);
                              }}
                              disabled={isUnsavingId === design.id}
                              className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10"
                              title="Remove from saved archive"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Info Box sits cleanly below the design image */}
                          <div className="mt-2.5 px-1 text-left">
                            <h4 className="text-xs font-bold text-[#171717] dark:text-white font-space tracking-tight truncate leading-tight block">
                              {design.title}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                              <span 
                                className="text-[10px] font-mono text-neutral-500 dark:text-[#A9A9A9] truncate max-w-[70%] hover:text-accent hover:underline transition-colors pointer-events-auto cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDesignerId(design.userId);
                                }}
                              >
                                @{creatorUsername}
                              </span>
                              <div className="flex items-center gap-1 text-[#555555] dark:text-[#A9A9A9] font-space text-[10px] font-medium shrink-0">
                                <Heart size={10} className="text-rose-500 fill-rose-500 shrink-0" />
                                <span>{formatLikesCount(design.stats?.likes || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>

                {/* Infinite Scroll / Lazy Loading Sentinel */}
                {verifiedDesigns.filter((design) => {
                  if (selectedStyle === "All") return true;
                  const pStyle = (design as any).primaryStyle || (design.styles && design.styles[0]) || "Minimalist";
                  return pStyle === selectedStyle;
                }).length > visibleCount && (
                  <div 
                    ref={loaderRef}
                    className="w-full py-12 flex justify-center items-center text-xs font-mono text-[#888888] dark:text-[#A9A9A9]"
                  >
                    <Loader id="lazy-loading-designs" size="sm" />
                    <span className="ml-2 animate-pulse">Loading more curations...</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="moodboards-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full text-left"
              >
                {activeMoodboard ? (
                  <div className="space-y-6">
                    {/* Active Moodboard Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveMoodboard(null)}
                          className="p-2 rounded-full hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-500 dark:text-neutral-400 cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div>
                          <h2 className="text-lg font-bold font-space flex items-center gap-2 text-neutral-900 dark:text-white uppercase tracking-wide">
                            <FolderOpen size={20} className="text-[#C90023]" />
                            {activeMoodboard.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="uppercase">{activeMoodboard.privacy} board</span>
                            <span>•</span>
                            <Bookmark size={12} className="text-[#C90023] fill-[#C90023] shrink-0" />
                            <span>{activeMoodboard.designIds?.length || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditName(activeMoodboard.name);
                            setEditDescription(activeMoodboard.description || "");
                            setEditPrivacy(activeMoodboard.privacy || "private");
                            setIsEditingDetails(true);
                          }}
                          className="text-xs uppercase font-bold tracking-wide flex items-center gap-2"
                        >
                          <Edit3 size={14} />
                          <span>Edit Details</span>
                        </Button>
                        {activeMoodboard.privacy === "public" && (
                          <Button
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = `${window.location.origin}?moodboard=${activeMoodboard.id}`;
                              navigator.clipboard.writeText(link);
                              showToast(`Moodboard "${activeMoodboard.name}" link copied!`, "success");
                            }}
                            className="text-xs uppercase font-bold tracking-wide flex items-center gap-2"
                          >
                            <Share2 size={14} />
                            <span>Share Board</span>
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          onClick={() => {
                            setBoardToDelete(activeMoodboard);
                          }}
                          className="text-xs uppercase font-bold tracking-wide flex items-center gap-2 bg-[#C90023] hover:bg-red-700 text-white"
                        >
                          <Trash2 size={14} />
                          <span>Delete Board</span>
                        </Button>
                      </div>
                    </div>

                    {/* Active Moodboard Description */}
                    <div className="bg-neutral-50 dark:bg-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#C90023]">
                          Board Description
                        </span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          {activeMoodboard.description || "No description provided for this board. Click \"Edit Details\" to add a description, or choose custom cover posters from the designs below."}
                        </p>
                      </div>
                      {activeMoodboard.coverUrl && (
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            try {
                              await discoveryService.updateMoodboard(activeMoodboard.id, { coverUrl: "" });
                              showToast("Cover image reset to default thumbnail.", "success");
                              setActiveMoodboard((prev: any) => prev ? { ...prev, coverUrl: "" } : null);
                            } catch (err) {
                              console.error(err);
                              showToast("Failed to reset cover image.", "error");
                            }
                          }}
                          className="text-[10px] uppercase font-bold tracking-wide h-8"
                        >
                          Reset Cover
                        </Button>
                      )}
                    </div>

                    {loadingActiveMoodboard ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader id="moodboard-designs-loader" size="md" />
                        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest animate-pulse">
                          Syncing board inspiration...
                        </span>
                      </div>
                    ) : activeMoodboardDesigns.length === 0 ? (
                      <div className="py-16 text-center border border-dashed border-neutral-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-neutral-400">
                        <Layers size={32} className="mb-2 opacity-30 text-[#C90023]" />
                        <p className="text-xs font-mono uppercase tracking-widest">
                          No designs inside this moodboard yet.
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto text-center">
                          You can add designs here from your Saved Grid or Grouped views.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {activeMoodboardDesigns.map((design) => {
                          const creatorUsername = usernames[design.userId] || "loading...";
                          return (
                            <motion.div
                              key={`mb-${design.id}`}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="group relative rounded-[20px] overflow-hidden border border-neutral-200 dark:border-white/10 bg-[#171717] aspect-[3/4] cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                              onClick={() => setLightboxDesign(design)}
                            >
                              <img
                                src={design.imageUrl}
                                alt={design.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />
                              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-left z-10 pointer-events-none">
                                <div className="flex-1 min-w-0 pr-2">
                                  <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest truncate block">
                                    {design.category || "Design"}
                                  </span>
                                  <h4 className="text-sm font-bold text-white font-space tracking-tight mt-0.5 truncate leading-tight block">
                                    {design.title}
                                  </h4>
                                  <span 
                                    className="text-[10px] font-mono text-neutral-400 block truncate mt-0.5 hover:text-accent hover:underline transition-colors pointer-events-auto cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDesignerId(design.userId);
                                    }}
                                  >
                                    @{creatorUsername}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md font-space font-semibold text-[11px] select-none hover:scale-105 active:scale-95 transition-all duration-200 pointer-events-auto" title={`${design.stats?.likes || 0} likes`}>
                                  <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" />
                                  <span>{formatLikesCount(design.stats?.likes || 0)}</span>
                                </div>
                              </div>

                              {/* Set as Cover button */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await discoveryService.updateMoodboard(activeMoodboard.id, { coverUrl: design.imageUrl });
                                    showToast("Cover image set successfully!", "success");
                                    setActiveMoodboard((prev: any) => prev ? { ...prev, coverUrl: design.imageUrl } : null);
                                  } catch (err) {
                                    console.error(err);
                                    showToast("Failed to set cover image.", "error");
                                  }
                                }}
                                className={`absolute top-3 left-3 p-2.5 rounded-full transition-all duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10 ${
                                  activeMoodboard.coverUrl === design.imageUrl
                                    ? "bg-[#C90023] text-white opacity-100 scale-110"
                                    : "bg-black/60 hover:bg-[#C90023] text-white opacity-0 group-hover:opacity-100"
                                }`}
                                title={activeMoodboard.coverUrl === design.imageUrl ? "Current Cover Image" : "Set as Cover Image"}
                              >
                                <Image size={13} />
                              </button>

                              {/* Save/Remove from moodboard toggle button */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const added = await discoveryService.toggleDesignInMoodboard(activeMoodboard.id, design.id);
                                    if (!added) {
                                      showToast(`Removed from "${activeMoodboard.name}"`, "info");
                                      // update local active moodboard designIds
                                      setActiveMoodboard((prev: any) => prev ? {
                                        ...prev,
                                        designIds: prev.designIds.filter((id: string) => id !== design.id)
                                      } : null);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    showToast("Could not remove design from moodboard", "error");
                                  }
                                }}
                                className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer backdrop-blur-sm z-20 border border-white/10"
                                title="Remove from moodboard"
                              >
                                <Trash2 size={13} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-6">
                    {moodboards.length === 0 ? (
                      <div className="py-24 text-center flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-white/10 rounded-3xl p-8">
                        <FolderPlus size={44} className="mb-3 text-[#C90023]/50" />
                        <h4 className="text-base font-bold font-space text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                          No Moodboards Found
                        </h4>
                        <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto leading-relaxed">
                          Organize your saved mockups and layout inspirations into beautiful public, private, or collaborative shared moodboards.
                        </p>
                        <Button
                          onClick={() => setShowCreateMoodboard(true)}
                          className="mt-6 text-xs uppercase font-bold tracking-wide"
                        >
                          Create first board
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
                        {/* New Moodboard Folder Card */}
                        <div
                          onClick={() => setShowCreateMoodboard(true)}
                          className="group relative mt-6 h-[230px] text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                        >
                          {/* Folder Tab Placeholder */}
                          <div className={`absolute top-0 left-0 w-28 h-[26px] -translate-y-[25px] rounded-t-2xl border-t border-x border-dashed transition-all duration-300 flex items-center justify-center gap-1.5 z-20 ${
                            theme === "dark"
                              ? "bg-[#1E1E1E]/50 border-white/10 text-neutral-500 group-hover:border-accent/40"
                              : "bg-white/80 border-neutral-300 text-neutral-500 group-hover:border-[#C90023]/40 shadow-2xs"
                          }`}>
                            <Plus size={10} className="text-[#C90023]" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                              New Board
                            </span>
                          </div>

                          {/* Main Folder Body Dotted */}
                          <div className={`w-full h-full relative rounded-tr-3xl rounded-b-3xl border border-dashed flex flex-col items-center justify-center text-center p-6 transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-[#1E1E1E]/30 border-white/10 hover:border-accent/40 hover:bg-white/[0.02]"
                              : "bg-neutral-50/60 border-neutral-300 hover:border-[#C90023]/40 hover:bg-neutral-100/50"
                          }`}>
                            <div className="w-10 h-10 rounded-full border border-dashed border-neutral-300 dark:border-white/10 group-hover:border-[#C90023]/30 group-hover:bg-[#C90023]/10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:text-[#C90023] transition-all mb-3">
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold font-space text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white uppercase tracking-wide">
                              Create Board
                            </span>
                          </div>
                        </div>

                        {/* Existing Boards */}
                        {moodboards.map((board) => {
                          const boardDesigns = (board.designIds || [])
                            .map((id: string) => (verifiedDesigns || []).find((d) => d.id === id))
                            .filter((d: any): d is Design => !!d);
                          const previewSlots = [0, 1, 2, 3];

                          return (
                            <div
                              key={board.id}
                              onClick={() => setActiveMoodboard(board)}
                              className="group relative mt-6 h-[230px] text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                            >
                              {/* Folder Tab */}
                              <div className={`absolute top-0 left-0 w-28 h-[26px] -translate-y-[25px] rounded-t-2xl border-t border-x transition-all duration-300 flex items-center justify-center gap-1.5 z-20 ${
                                theme === "dark"
                                  ? "bg-[#1E1E1E] border-white/10 text-neutral-400 group-hover:border-accent/40"
                                  : "bg-white border-neutral-300 text-neutral-600 group-hover:border-[#C90023]/40 shadow-2xs"
                              }`}>
                                {board.privacy === "private" && <Lock size={10} />}
                                {board.privacy === "public" && <Globe size={10} className="text-[#C90023]" />}
                                {board.privacy === "shared" && <Users size={10} className="text-blue-400" />}
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                                  {board.privacy}
                                </span>
                              </div>

                              {/* Main Folder Body */}
                              <div className={`w-full h-full relative rounded-tr-3xl rounded-b-3xl border flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                                theme === "dark"
                                  ? "bg-[#1E1E1E] border-white/10 group-hover:border-accent/40"
                                  : "bg-white border-neutral-300 group-hover:border-[#C90023]/40"
                              }`}>
                                {/* Upper 2x2 Grid Preview Area */}
                                <div className="relative h-[145px] p-2.5 bg-neutral-100/90 dark:bg-black/40 border-b border-neutral-200 dark:border-white/10 overflow-hidden">
                                  <div className="grid grid-cols-2 gap-1.5 h-full w-full">
                                    {previewSlots.map((idx) => {
                                      const designItem = boardDesigns[idx];
                                      return designItem ? (
                                        <div key={idx} className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                                          <img
                                            src={designItem.imageUrl}
                                            alt={designItem.title}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          key={idx}
                                          className={`w-full h-full rounded-xl border border-dashed flex items-center justify-center transition-colors ${
                                            theme === "dark"
                                              ? "border-white/10 bg-white/[0.03] text-neutral-600"
                                              : "border-neutral-200 bg-white/60 text-neutral-300"
                                          }`}
                                        >
                                          <Sparkles size={11} className="opacity-40" />
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Top Bar Floating Quick Actions */}
                                  <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
                                    {board.privacy === "public" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const link = `${window.location.origin}?moodboard=${board.id}`;
                                          navigator.clipboard.writeText(link);
                                          showToast(`Moodboard "${board.name}" link copied!`, "success");
                                        }}
                                        className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                                          theme === "dark"
                                            ? "bg-black/60 border-white/20 text-neutral-300 hover:bg-black/90 hover:text-white"
                                            : "bg-white/95 border-neutral-300 text-neutral-700 hover:bg-white hover:text-black shadow-xs"
                                        }`}
                                        title="Copy public link"
                                      >
                                        <Share2 size={11} />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBoardToDelete(board);
                                      }}
                                      className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                                        theme === "dark"
                                          ? "bg-black/60 border-white/20 text-neutral-300 hover:bg-red-950/80 hover:border-red-500 hover:text-red-400"
                                          : "bg-white/95 border-neutral-300 text-neutral-700 hover:bg-red-50 hover:border-red-400 hover:text-red-600 shadow-xs"
                                      }`}
                                      title="Delete board"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                {/* Bottom Info Panel */}
                                <div className={`p-3.5 flex items-center justify-between z-20 transition-colors ${
                                  theme === "dark"
                                    ? "bg-[#181818] text-white"
                                    : "bg-neutral-50/90 text-[#171717]"
                                }`}>
                                  <div className="min-w-0 flex-1 pr-2">
                                    <h4 className={`text-xs font-bold font-space truncate uppercase tracking-wide ${
                                      theme === "dark" ? "text-white" : "text-neutral-900"
                                    }`}>
                                      {board.name}
                                    </h4>
                                    
                                    <p className={`text-[10px] truncate mt-0.5 ${
                                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                                    }`}>
                                      {board.description || "No description provided."}
                                    </p>
                                  </div>

                                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border shrink-0 ${
                                    theme === "dark"
                                      ? "bg-white/5 border-white/10 text-neutral-300"
                                      : "bg-white border-neutral-200 text-neutral-700 shadow-2xs"
                                  }`}>
                                    <Bookmark size={10} className="text-[#C90023] fill-[#C90023]" />
                                    <span className="text-[10px] font-mono font-bold">
                                      {board.designIds?.length || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* WhatsApp/Inspector Style Fullscreen Lightbox */}
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

            {/* Top Header Controls (Floating on Desktop and Mobile) */}
            <div 
              className={`absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none transition-all duration-300 ${
                (zoomScale > 1 || panOffset.x !== 0 || panOffset.y !== 0) && !isHeaderHovered
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`} 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Creator Info on Left (Only visible if details panel is collapsed to avoid redundancy) */}
              <div className="pointer-events-auto">
                <AnimatePresence>
                  {isPanelCollapsed && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`flex items-center gap-2 p-1.5 pl-2.5 pr-4 rounded-full border shadow-md backdrop-blur-md transition-all cursor-pointer hover:border-accent hover:bg-accent/5 hover:scale-105 ${
                        theme === "dark"
                          ? "bg-[#1E1E1E]/90 border-white/10 text-white"
                          : "bg-white/95 border-neutral-200 text-[#171717]"
                      }`}
                      onClick={() => setActiveDesignerId(lightboxDesign.userId)}
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
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                {/* Unsave Toggle Button */}
                <Tooltip content="Remove from Saved" theme={theme} position="bottom">
                  <button
                    onClick={() => setDesignToDelete(lightboxDesign)}
                    disabled={isUnsavingId === lightboxDesign.id}
                    className={`p-2.5 sm:p-3 rounded-full transition-all cursor-pointer backdrop-blur-md border shadow-sm flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20"
                        : "bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border-red-200"
                    }`}
                  >
                    <Trash2 size={18} className="stroke-[2.5]" />
                  </button>
                </Tooltip>

                {/* Collapse/Expand Toggle Button */}
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

            {/* Left Content Area - Centers Image on Dark/Light Canvas with Premium Ambient Aura */}
            <div 
              ref={imageAreaRef}
              className={`flex-1 relative flex items-center justify-center select-none h-full md:h-full overflow-hidden transition-all duration-300 ${
                !isPanelCollapsed 
                  ? (isPanelFullyExpanded ? "p-4 pb-[calc(100vh-120px)] md:p-0" : "p-4 pb-[314px] md:p-0")
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
                    ? "bg-gradient-to-t from-[#121212]/85 via-transparent to-[#121212]/85" 
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
                  ? "bg-[#1E1E1E] border-divider-dark text-white" 
                  : "bg-white border-neutral-200 text-[#171717]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Creator Info */}
              <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
                theme === "dark" ? "border-divider-dark" : "border-neutral-100"
              }`}>
                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group/creator hover:opacity-85 transition-opacity"
                  onClick={() => setActiveDesignerId(lightboxDesign.userId)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 transition-colors group-hover/creator:border-accent ${
                    theme === "dark"
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-accent/20 border border-accent/30 text-accent"
                  }`}>
                    {(usernames[lightboxDesign.userId] || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-space truncate group-hover/creator:text-accent transition-colors ${
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
                </div>

                {/* Likes Button */}
                <div>
                  <button
                    onClick={handleToggleLike}
                    disabled={likeLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      isLiked
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30"
                        : theme === "dark" 
                          ? "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                    }`}
                  >
                    <Heart size={16} className={isLiked ? "fill-rose-500 text-rose-500" : "text-rose-500"} />
                    <span>{formatLikesCount(likesCount)} Likes</span>
                  </button>
                </div>

                {/* Category & Style Tags Section (Separate from Likes) */}
                {(lightboxDesign.category || lightboxDesign.format || (lightboxDesign.styles && lightboxDesign.styles.length > 0)) && (
                  <div>
                    <h4 className={`text-[10px] font-mono uppercase tracking-wider mb-2.5 ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Tags & Style Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
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
                )}

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

                {/* Comments & Feedback Section */}
                <div className={`pt-5 border-t ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}>
                  <DesignCommentsSection
                    design={lightboxDesign}
                    user={user}
                    theme={theme}
                    onOpenProfile={(id) => setActiveDesignerId(id)}
                  />
                </div>
              </div>
            </motion.div>

            {/* MOBILE Bottom Panel - WhatsApp Inspector Pane (Vertical Bottom Sheet) */}
            <motion.div
              animate={{ 
                height: isPanelCollapsed ? 0 : (isPanelFullyExpanded ? "calc(100vh - 120px)" : "240px"),
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
              {/* Header with Creator Info */}
              <div 
                onClick={() => setIsPanelFullyExpanded(!isPanelFullyExpanded)}
                className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 cursor-pointer ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}
              >
                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group/creator hover:opacity-85 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDesignerId(lightboxDesign.userId);
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-space shrink-0 transition-colors group-hover/creator:border-accent ${
                    theme === "dark"
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-accent/20 border border-accent/30 text-accent"
                  }`}>
                    {(usernames[lightboxDesign.userId] || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-space truncate group-hover/creator:text-accent transition-colors ${
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

                {/* Drag Handle Indicator */}
                <div className="hidden xs:flex flex-col items-center gap-0.5 pointer-events-none">
                  <div className={`w-8 h-1 rounded-full ${theme === "dark" ? "bg-white/20" : "bg-neutral-300"}`} />
                  <span className={`text-[8px] font-mono tracking-wider uppercase ${theme === "dark" ? "text-neutral-500" : "text-neutral-400"}`}>
                    {isPanelFullyExpanded ? "Tap to Shrink" : "Tap to Expand"}
                  </span>
                </div>
                
                {/* Collapse/Expand Buttons inside Panel */}
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

              {/* Information Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div>
                  <h3 className={`text-base font-bold font-space tracking-tight leading-snug ${
                    theme === "dark" ? "text-white" : "text-[#171717]"
                  }`}>
                    {lightboxDesign.title}
                  </h3>
                </div>

                {/* Mobile Likes Button */}
                <div className={`pt-3 border-t ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}>
                  <button
                    onClick={handleToggleLike}
                    disabled={likeLoading}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      isLiked
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30"
                        : theme === "dark" 
                          ? "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white"
                          : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                    }`}
                  >
                    <Heart size={15} className={isLiked ? "fill-rose-500 text-rose-500" : "text-rose-500"} />
                    <span>{formatLikesCount(likesCount)} Likes</span>
                  </button>
                </div>

                {/* Mobile Tags Section */}
                {(lightboxDesign.category || lightboxDesign.format || (lightboxDesign.styles && lightboxDesign.styles.length > 0)) && (
                  <div>
                    <div className="flex flex-wrap gap-1.5">
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
                )}
                {lightboxDesign.description && (
                  <div>
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

                {/* Mobile Comments & Feedback */}
                <div className={`pt-3 border-t ${
                  theme === "dark" ? "border-divider-dark" : "border-neutral-100"
                }`}>
                  <DesignCommentsSection
                    design={lightboxDesign}
                    user={user}
                    theme={theme}
                    onOpenProfile={(id) => setActiveDesignerId(id)}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Deletion Confirmation Modal */}
      <ConfirmationModal
        show={!!designToDelete}
        theme={theme}
        title="Remove Inspiration"
        iconType="trash"
        variant="danger"
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={designToDelete ? isUnsavingId === designToDelete.id : false}
        onConfirm={() => designToDelete && handleUnsave(designToDelete.id)}
        onClose={() => setDesignToDelete(null)}
        description={
          <p>
            Are you sure you want to remove <span className="font-semibold text-white">{designToDelete?.title}</span> from your saved vault? This action cannot be undone.
          </p>
        }
      />

      {/* Moodboard Modals */}
      <MoodboardSelectionModal
        show={!!selectionDesign}
        theme={theme}
        designId={selectionDesign?.id || ""}
        designTitle={selectionDesign?.title || ""}
        moodboards={moodboards}
        onClose={() => setSelectionDesign(null)}
        onOpenCreateModal={() => {
          setShowCreateMoodboard(true);
        }}
        showToast={showToast}
      />

      <CreateMoodboardModal
        show={showCreateMoodboard}
        theme={theme}
        onClose={() => setShowCreateMoodboard(false)}
        onCreate={handleCreateMoodboard}
      />

      {/* Edit Moodboard Details Modal */}
      <Modal
        id="edit-moodboard-details-modal"
        show={isEditingDetails}
        onClose={() => setIsEditingDetails(false)}
        title="Edit Board Details"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsEditingDetails(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-[#C90023] hover:bg-[#A3001C] text-white"
              onClick={handleUpdateMoodboard}
              disabled={!editName.trim()}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdateMoodboard} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-neutral-500 dark:text-neutral-400">
              Board Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Living Room Redesign"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#C90023] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-neutral-500 dark:text-neutral-400">
              Description (Optional)
            </label>
            <textarea
              placeholder="What is this moodboard about? Add some context, goals, or notes..."
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#C90023] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-neutral-500 dark:text-neutral-400">
              Privacy Settings
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "private", label: "Private", desc: "Only you" },
                { value: "public", label: "Public", desc: "Anyone can view" },
                { value: "shared", label: "Shared", desc: "Collaborators" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditPrivacy(opt.value as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    editPrivacy === opt.value
                      ? "border-[#C90023] bg-[#C90023]/5 text-[#C90023]"
                      : "border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-white/5 text-neutral-500 hover:border-neutral-300 dark:hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold font-space uppercase tracking-wide">
                    {opt.label}
                  </span>
                  <span className="text-[9px] text-neutral-400">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Moodboard Confirmation Modal */}
      <ConfirmationModal
        show={!!boardToDelete}
        theme={theme}
        title="Delete Moodboard"
        iconType="trash"
        variant="danger"
        confirmText="Delete Board"
        cancelText="Cancel"
        onConfirm={async () => {
          if (!boardToDelete) return;
          try {
            await discoveryService.deleteMoodboard(boardToDelete.id);
            showToast(`Moodboard "${boardToDelete.name}" deleted successfully.`, "success");
            if (activeMoodboard && activeMoodboard.id === boardToDelete.id) {
              setActiveMoodboard(null);
            }
          } catch (err) {
            console.error(err);
            showToast("Could not delete moodboard. Try again.", "error");
          } finally {
            setBoardToDelete(null);
          }
        }}
        onClose={() => setBoardToDelete(null)}
        description={
          <p>
            Are you sure you want to delete <span className="font-semibold text-white uppercase">"{boardToDelete?.name}"</span>? All layout inspirations inside will remain in your saved vault, but this board will be permanently removed.
          </p>
        }
      />

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
