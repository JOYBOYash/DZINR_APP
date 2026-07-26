import React, { useState, useEffect } from "react";
import { 
  X, Laptop, Heart, Bookmark, Share2, Globe, 
  Layers, Grid, Eye, Check, ChevronRight, Lock, 
  FolderPlus, Sparkles, FolderOpen, Calendar, Info,
  Users, ArrowLeft, MessageSquare, Plus, Compass
} from "lucide-react";
import { UserProfile } from "../types";
import { Design, designService } from "../services/design.service";
import { userService } from "../services/user.service";
import { discoveryService } from "../services/discovery.service";
import { auth } from "../services/firebase";
import { Loader } from "./Loader";
import { Button } from "./Button";
import { formatLikesCount } from "../utils/likes";
import { motion, AnimatePresence } from "motion/react";
import { DesignCommentsSection } from "./DesignCommentsSection";

interface DesignerProfileModalProps {
  show: boolean;
  theme: "dark" | "light";
  designerId: string;
  onClose: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export const DesignerProfileModal: React.FC<DesignerProfileModalProps> = ({
  show,
  theme,
  designerId,
  onClose,
  showToast,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publishedDesigns, setPublishedDesigns] = useState<Design[]>([]);
  const [moodboards, setMoodboards] = useState<any[]>([]);
  const [selectedMoodboard, setSelectedMoodboard] = useState<any | null>(null);
  const [moodboardDesigns, setMoodboardDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "moodboards">("projects");
  const [lightboxDesign, setLightboxDesign] = useState<Design | null>(null);
  const [copied, setCopied] = useState(false);

  // Lightbox interaction states for the inspector
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Cover selection states
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);

  // Current logged in user ID
  const currentUserId = auth.currentUser?.uid;

  // Fetch details
  useEffect(() => {
    if (!show || !designerId) return;

    let active = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        // 1. Fetch Profile
        const userProfile = await userService.getUserProfile(designerId);
        if (!active) return;
        setProfile(userProfile);

        if (userProfile) {
          // 2. Fetch Designs
          const allDesigns = await designService.getDesigns(designerId);
          if (!active) return;
          const published = allDesigns.filter((d) => d.status === "published");
          setPublishedDesigns(published);

          // 3. Fetch public moodboards
          const { db } = await import("../services/firebase");
          const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore");
          const moodboardsQuery = query(
            collection(db, "moodboards"),
            where("creatorId", "==", designerId),
            where("privacy", "==", "public")
          );
          const moodboardSnap = await getDocs(moodboardsQuery);
          const publicBoards: any[] = [];
          moodboardSnap.forEach((doc) => {
            publicBoards.push(doc.data());
          });
          if (!active) return;
          setMoodboards(publicBoards);

          // 4. Fetch follow status
          const currentUser = auth.currentUser;
          if (currentUser) {
            const followId = `${currentUser.uid}_${designerId}`;
            const followRef = doc(db, "follows", followId);
            const followSnap = await getDoc(followRef);
            if (active) {
              setIsFollowing(followSnap.exists());
            }
          }

          // 5. Fetch followers count
          const followersQuery = query(
            collection(db, "follows"),
            where("followedId", "==", designerId)
          );
          const followersSnap = await getDocs(followersQuery);
          if (active) {
            setFollowersCount(followersSnap.size);
          }
        }
      } catch (err) {
        console.error("Failed to load designer details:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [show, designerId]);

  // Load designs inside a selected public moodboard
  useEffect(() => {
    if (!selectedMoodboard) {
      setMoodboardDesigns([]);
      return;
    }

    let active = true;
    const fetchMoodboardDesigns = async () => {
      const designIds = selectedMoodboard.designIds || [];
      if (designIds.length === 0) {
        setMoodboardDesigns([]);
        return;
      }

      try {
        const { db } = await import("../services/firebase");
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const designs: Design[] = [];
        
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

        if (active) {
          setMoodboardDesigns(designs);
        }
      } catch (err) {
        console.error("Failed to fetch moodboard designs:", err);
      }
    };

    fetchMoodboardDesigns();

    return () => {
      active = false;
    };
  }, [selectedMoodboard]);

  // Sync like state when lightbox design opens
  useEffect(() => {
    if (!lightboxDesign || !currentUserId) return;
    setLikesCount(lightboxDesign.stats?.likes || lightboxDesign.stats?.rightSwipes || 0);
    discoveryService.checkIfUserLikedDesign(currentUserId, lightboxDesign.id).then((liked) => {
      setIsLiked(liked);
    });
  }, [lightboxDesign, currentUserId]);

  if (!show) return null;

  // Toggle Like on currently inspected design
  const handleToggleLike = async () => {
    if (!lightboxDesign || !currentUserId) return;
    setLikeLoading(true);
    try {
      const res = await discoveryService.toggleLikeDesign(currentUserId, lightboxDesign.id);
      setIsLiked(res.liked);
      setLikesCount(res.newCount);
      
      setPublishedDesigns(prev => prev.map(d => {
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
      }));

      setLightboxDesign(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          likes: res.newCount,
          rightSwipes: res.newCount
        }
      } : null);

      showToast(res.liked ? "Added design to your likes!" : "Removed like from design.", "success");
    } catch (err) {
      console.error("Failed to toggle like:", err);
      showToast("Failed to update like status.", "error");
    } finally {
      setLikeLoading(false);
    }
  };

  // Generate shareable profile link
  const handleShareProfile = () => {
    const link = `${window.location.origin}?profile=${designerId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast("Designer profile link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareMoodboard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}?moodboard=${board.id}`;
    navigator.clipboard.writeText(link);
    showToast(`Moodboard "${board.name}" link copied to clipboard!`, "success");
  };

  // Toggle user follow relationship
  const toggleFollow = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Please log in to follow designers.", "error");
        return;
      }
      if (currentUser.uid === designerId) {
        showToast("You cannot follow yourself.", "error");
        return;
      }

      setFollowingLoading(true);
      const { db } = await import("../services/firebase");
      const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
      const followId = `${currentUser.uid}_${designerId}`;
      const followRef = doc(db, "follows", followId);

      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        showToast("Unfollowed designer.", "info");
      } else {
        await setDoc(followRef, {
          id: followId,
          followerId: currentUser.uid,
          followedId: designerId,
          createdAt: new Date().toISOString()
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        showToast("Following designer! Their posts will appear in your feed.", "success");
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      showToast("Failed to update follow status.", "error");
    } finally {
      setFollowingLoading(false);
    }
  };

  // Handle setting a design's image as the profile cover
  const handleSelectCover = async (imageUrl: string) => {
    try {
      setUpdatingCover(true);
      const { db } = await import("../services/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const userRef = doc(db, "users", designerId);
      await updateDoc(userRef, {
        coverUrl: imageUrl
      });
      
      setProfile(prev => prev ? { ...prev, coverUrl: imageUrl } : null);
      setShowCoverSelector(false);
      showToast("Cover image updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update cover image:", err);
      showToast("Failed to update cover image.", "error");
    } finally {
      setUpdatingCover(false);
    }
  };

  // Get cumulative likes count
  const totalLikes = publishedDesigns.reduce((sum, d) => sum + (d.stats?.likes || 0), 0);

  return (
    <div className={`fixed inset-0 z-[150] overflow-y-auto w-full h-full min-h-screen text-white flex flex-col transition-colors duration-300 ${
      theme === "dark" ? "bg-[#121212]" : "bg-[#F8F9FA] text-[#171717]"
    }`}>
      {/* Top Fixed Sticky Navigation Bar */}
      <div className={`sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 border-b backdrop-blur-xl flex items-center justify-between transition-colors ${
        theme === "dark"
          ? "bg-[#121212]/90 border-white/10"
          : "bg-white/90 border-neutral-200 text-[#171717]"
      }`}>
        <button
          onClick={onClose}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10"
              : "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 hidden sm:inline-block">
          {profile ? `@${profile.username}'s Profile` : "Creator Space"}
        </span>

        <button
          onClick={handleShareProfile}
          className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest rounded-full border transition-all flex items-center gap-2 cursor-pointer ${
            theme === "dark"
              ? "bg-white/5 border-white/10 text-white hover:bg-white/15"
              : "bg-neutral-900 border-neutral-800 text-white hover:bg-black"
          }`}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copied ? "Copied" : "Share"}</span>
        </button>
      </div>

      {/* Main Full-Page Canvas Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-20">
        
        {/* Banner with Ambient Aurora Glow */}
        <div className="h-56 sm:h-72 w-full relative overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl">
          {profile?.coverUrl ? (
            <>
              <img 
                src={profile.coverUrl} 
                alt="Profile Cover" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-accent via-red-900 to-amber-700 blur-2xl scale-125" />
          )}

          {/* Change Cover button for own profile */}
          {profile && auth.currentUser?.uid === designerId && (
            <button
              onClick={() => setShowCoverSelector(true)}
              className="absolute bottom-4 right-6 px-3.5 py-2 rounded-xl backdrop-blur-md bg-black/60 border border-white/20 text-[10px] font-mono font-bold uppercase tracking-wider text-white hover:bg-black/80 transition-colors z-20 flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Sparkles size={13} className="text-accent animate-pulse" />
              <span>Change Cover</span>
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader id="designer-profile-page-loading" size="lg" />
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest animate-pulse">
              Synchronizing Creator Workspace...
            </span>
          </div>
        ) : !profile ? (
          <div className="py-24 text-center px-4">
            <p className="text-sm font-semibold text-neutral-400">Designer profile not found or account was removed.</p>
            <button onClick={onClose} className="mt-4 text-xs font-mono font-bold text-accent uppercase tracking-widest">
              Return to Feed
            </button>
          </div>
        ) : (
          <div className="px-2 sm:px-4 pb-12 pt-4 relative z-10">
            
            {/* Avatar & Header Profile Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#121212] bg-[#1E1E1E] flex items-center justify-center shadow-2xl shrink-0 -mt-14 sm:-mt-16">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`}
                      alt="Creator avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="text-left pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className={`text-2xl sm:text-3xl font-bold font-space tracking-tight leading-none ${
                      theme === "dark" ? "text-white" : "text-[#171717]"
                    }`}>
                      @{profile.username}
                    </h1>
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-accent/10 border border-accent/25 text-accent uppercase tracking-wider">
                      {profile.role || "Brand Designer"}
                    </span>
                  </div>
                  <p className={`text-sm font-sans mt-3 max-w-xl leading-relaxed ${
                    theme === "dark" ? "text-neutral-400" : "text-neutral-600"
                  }`}>
                    {profile.bio || "Crafting elegant digital layouts and visual mockups."}
                  </p>
                </div>
              </div>

              {/* Designer Aggregate Statistics - Pills with symbol and count only */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Total Likes Received Pill */}
                <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 h-10 ${
                  theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-neutral-200 text-[#171717]"
                }`} title="Total Likes Received">
                  <Heart size={15} className="fill-rose-500 text-rose-500" />
                  <span className="text-sm font-bold font-space leading-none">
                    {formatLikesCount(totalLikes)}
                  </span>
                </div>

                {/* Followers Count Pill */}
                <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 h-10 ${
                  theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-neutral-200 text-[#171717]"
                }`} title="Followers">
                  <Users size={15} className="text-[#3b82f6]" />
                  <span className="text-sm font-bold font-space leading-none">
                    {followersCount}
                  </span>
                </div>

                {/* Published Projects Pill */}
                <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 h-10 ${
                  theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-neutral-200 text-[#171717]"
                }`} title="Published Projects">
                  <Laptop size={15} className="text-accent" />
                  <span className="text-sm font-bold font-space leading-none">
                    {publishedDesigns.length}
                  </span>
                </div>

                {/* Follow Button */}
                {(() => {
                  const currentUser = auth?.currentUser;
                  if (currentUser && currentUser.uid === designerId) {
                    return null;
                  }
                  return (
                    <Button
                      onClick={toggleFollow}
                      variant={isFollowing ? "secondary" : "primary"}
                      loading={followingLoading}
                      className="h-11 px-6 text-xs font-mono font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md"
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  );
                })()}
              </div>
            </div>

            {/* Sub View Toggle / Tabs */}
            <div className="mt-8 flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
              <div className="flex gap-6">
                <button
                  onClick={() => {
                    setSelectedMoodboard(null);
                    setActiveTab("projects");
                  }}
                  className={`text-sm font-mono font-bold uppercase tracking-wider pb-2 transition-all border-b-2 cursor-pointer ${
                    activeTab === "projects" && !selectedMoodboard
                      ? "border-accent text-accent"
                      : "border-transparent text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Projects ({publishedDesigns.length})
                </button>
                <button
                  onClick={() => {
                    setSelectedMoodboard(null);
                    setActiveTab("moodboards");
                  }}
                  className={`text-sm font-mono font-bold uppercase tracking-wider pb-2 transition-all border-b-2 cursor-pointer ${
                    activeTab === "moodboards" || selectedMoodboard
                      ? "border-accent text-accent"
                      : "border-transparent text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Moodboards ({moodboards.length})
                </button>
              </div>
            </div>

            {/* Dynamic Content Display */}
            <div className="mt-6 text-left">
              
              {/* Back to Moodboard List button */}
              {selectedMoodboard && (
                <button
                  onClick={() => setSelectedMoodboard(null)}
                  className="mb-6 flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-accent hover:underline cursor-pointer"
                >
                  ← Back to Public Moodboards
                </button>
              )}

              <AnimatePresence mode="wait">
                {selectedMoodboard ? (
                  <motion.div
                    key="moodboard-detail"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-4">
                      <div>
                        <h3 className={`text-xl font-bold font-space flex items-center gap-2.5 ${
                          theme === "dark" ? "text-white" : "text-[#171717]"
                        }`}>
                          <FolderOpen size={20} className="text-accent" />
                          {selectedMoodboard.name}
                        </h3>
                        <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mt-1">
                          Public Moodboard • {selectedMoodboard.designIds?.length || 0} Curated Items
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2 uppercase tracking-wider font-mono text-xs self-start rounded-xl"
                        onClick={(e) => handleShareMoodboard(selectedMoodboard, e)}
                      >
                        <Share2 size={13} />
                        <span>Copy Board Link</span>
                      </Button>
                    </div>

                    {moodboardDesigns.length === 0 ? (
                      <div className="py-20 text-center text-xs font-mono text-neutral-400 uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                        This moodboard currently contains no designs.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {moodboardDesigns.map((design) => (
                          <div
                            key={design.id}
                            onClick={() => setLightboxDesign(design)}
                            className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-neutral-200 dark:border-white/10 bg-[#171717] cursor-pointer shadow-lg hover:border-accent/60 transition-all hover:scale-[1.02]"
                          >
                            <img
                              src={design.imageUrl}
                              alt={design.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                            <div className="absolute inset-x-0 bottom-0 p-4 z-10 text-left">
                              <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest block truncate">
                                {design.category || "Design"}
                              </span>
                              <h4 className="text-sm font-bold text-white font-space truncate mt-0.5 leading-tight block">
                                {design.title}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 mt-1.5">
                                <Heart size={11} className="fill-current" />
                                <span>{design.stats?.likes || design.stats?.rightSwipes || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === "projects" ? (
                  <motion.div
                    key="projects-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {publishedDesigns.length === 0 ? (
                      <div className="py-24 text-center flex flex-col items-center justify-center text-neutral-400 border border-dashed border-neutral-200 dark:border-white/10 rounded-3xl">
                        <Laptop size={40} className="mb-3 opacity-30 text-accent" />
                        <p className="text-xs font-mono uppercase tracking-widest">
                          No published projects found for this designer.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {publishedDesigns.map((design) => (
                          <div
                            key={design.id}
                            onClick={() => setLightboxDesign(design)}
                            className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-neutral-200 dark:border-white/10 bg-[#171717] cursor-pointer shadow-lg hover:border-accent transition-all hover:-translate-y-1"
                          >
                            <img
                              src={design.imageUrl}
                              alt={design.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                            <div className="absolute inset-x-0 bottom-0 p-4 z-10 text-left">
                              <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest block truncate">
                                {design.category || "Design"}
                              </span>
                              <h4 className="text-sm font-bold text-white font-space truncate mt-0.5 leading-tight block">
                                {design.title}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 mt-1.5">
                                <Heart size={11} className="fill-current text-rose-500" />
                                <span>{design.stats?.likes || design.stats?.rightSwipes || 0} Likes</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="moodboards-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {moodboards.length === 0 ? (
                      <div className="py-24 text-center flex flex-col items-center justify-center text-neutral-400 border border-dashed border-neutral-200 dark:border-white/10 rounded-3xl">
                        <Layers size={40} className="mb-3 opacity-30 text-accent" />
                        <p className="text-xs font-mono uppercase tracking-widest">
                          No public moodboards published.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {moodboards.map((board) => (
                          <div
                            key={board.id}
                            onClick={() => setSelectedMoodboard(board)}
                            className={`group p-6 rounded-2xl border text-left cursor-pointer transition-all hover:-translate-y-1 shadow-md ${
                              theme === "dark"
                                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-accent/50"
                                : "bg-white border-neutral-200 hover:bg-neutral-50 hover:border-accent/50 text-[#171717]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                                <Layers size={20} />
                              </div>
                              <button
                                onClick={(e) => handleShareMoodboard(board, e)}
                                className={`p-2 rounded-full border transition-colors ${
                                  theme === "dark" 
                                    ? "border-white/10 hover:bg-white/10 text-neutral-300" 
                                    : "border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                                }`}
                                title="Copy board link"
                              >
                                <Share2 size={14} />
                              </button>
                            </div>

                            <h4 className="text-base font-bold font-space truncate">
                              {board.name}
                            </h4>
                            <span className="text-xs font-mono text-neutral-400 block mt-1 uppercase tracking-wider">
                              {board.designIds?.length || 0} Items Curated
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cover Selection Modal Overlay */}
            <AnimatePresence>
              {showCoverSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="fixed inset-0 bg-[#121212]/95 backdrop-blur-xl z-[200] p-6 sm:p-10 flex flex-col justify-between text-white"
                >
                  <div className="flex flex-col flex-1 min-h-0 max-w-5xl mx-auto w-full">
                    <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
                      <div className="text-left">
                        <h3 className="text-xl font-bold font-space text-white">Select Cover Image</h3>
                        <p className="text-xs text-neutral-400 mt-1">
                          Choose an image from your published projects to set as your profile banner cover.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowCoverSelector(false)}
                        className="text-neutral-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                      >
                        <X size={22} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-6 min-h-0">
                      {publishedDesigns.length === 0 ? (
                        <div className="text-center py-20 text-sm text-neutral-500 font-mono">
                          You haven't published any projects yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {publishedDesigns.map((design) => (
                            <button
                              key={design.id}
                              onClick={() => handleSelectCover(design.imageUrl)}
                              disabled={updatingCover}
                              className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 hover:border-accent hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all group cursor-pointer"
                            >
                              <img 
                                src={design.imageUrl} 
                                alt={design.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-accent px-3 py-1.5 rounded-full flex items-center gap-1">
                                  <Check size={12} />
                                  Select Cover
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-white/10 shrink-0 mt-4 max-w-5xl mx-auto w-full">
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowCoverSelector(false)}
                      className="text-xs font-mono tracking-widest uppercase font-bold px-6 h-10 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* COMPLETE PROJECT LIGHTBOX INSPECTOR FOR PROFILE PROJECTS */}
      <AnimatePresence>
        {lightboxDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-[#121212]/95 backdrop-blur-2xl text-white overflow-hidden"
            onClick={() => setLightboxDesign(null)}
          >
            {/* Top Bar with Close Button */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-xs font-mono uppercase text-neutral-400">Design Inspector</span>
                <span className="text-white/30">•</span>
                <span className="text-xs font-bold font-space truncate max-w-[180px] sm:max-w-xs">{lightboxDesign.title}</span>
              </div>
              <button 
                onClick={() => setLightboxDesign(null)}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center transition-colors border border-white/10 text-white cursor-pointer shadow-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Stage Image Area */}
            <div 
              className="flex-1 relative flex items-center justify-center p-4 sm:p-10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxDesign.imageUrl}
                alt={lightboxDesign.title}
                className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Right Inspector Sidebar (Desktop) or Bottom Sheet (Mobile) */}
            <div 
              className={`w-full md:w-[380px] h-auto md:h-full border-t md:border-t-0 md:border-l border-white/10 bg-[#1A1A1A] flex flex-col justify-between shrink-0 overflow-hidden z-20`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Creator Profile Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 bg-[#1E1E1E]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full border border-white/10 bg-[#121212] overflow-hidden shrink-0 flex items-center justify-center">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold font-space text-accent">
                        {(profile?.username || "U").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold font-space text-white truncate">
                      @{profile?.username || "creator"}
                    </p>
                    <span className="text-[10px] font-mono text-neutral-400 block">
                      Creator Profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left min-h-0">
                <div>
                  <h3 className="text-xl font-bold font-space text-white tracking-tight leading-snug">
                    {lightboxDesign.title}
                  </h3>
                </div>

                {/* LIKES BUTTON */}
                <div>
                  <button
                    onClick={handleToggleLike}
                    disabled={likeLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      isLiked
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30"
                        : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Heart size={16} className={isLiked ? "fill-rose-500 text-rose-500" : "text-rose-500"} />
                    <span>{formatLikesCount(likesCount)} Likes</span>
                  </button>
                </div>

                {/* DEDICATED TAGS & STYLES SECTION */}
                {(lightboxDesign.category || lightboxDesign.format || (lightboxDesign.styles && lightboxDesign.styles.length > 0)) && (
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-wider mb-2 text-neutral-400">
                      Tags & Style Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {lightboxDesign.category && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border bg-white/10 text-white border-white/25">
                          {lightboxDesign.category}
                        </span>
                      )}
                      {lightboxDesign.format && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border bg-white/5 text-neutral-300 border-white/10">
                          {lightboxDesign.format}
                        </span>
                      )}
                      {lightboxDesign.styles && lightboxDesign.styles.map((style, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border bg-white/5 text-neutral-300 border-white/10">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {lightboxDesign.description && (
                  <div className="pt-5 border-t border-white/10">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider mb-2 text-neutral-400">
                      Description
                    </h4>
                    <p className="text-xs leading-relaxed text-neutral-300">
                      {lightboxDesign.description}
                    </p>
                  </div>
                )}

                {/* Comments & Feedback */}
                <div className="pt-5 border-t border-white/10">
                  <DesignCommentsSection design={lightboxDesign} user={profile || { id: currentUserId || "" } as any} theme="dark" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

