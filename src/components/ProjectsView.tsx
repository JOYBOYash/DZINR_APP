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
} from "lucide-react";
import { UserProfile } from "../types";
import { designService, Design } from "../services/design.service";
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

const CATEGORIES = [
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
}

type Tab = "drafts" | "published";

export const ProjectsView: React.FC<ProjectsViewProps> = ({ user, theme, onEditDraft, onCreateNew }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<Tab>("drafts");
  const [draftToDelete, setDraftToDelete] = useState<Design | null>(null);

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
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-fade-in text-left pb-24 px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECEC] dark:border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-accent tracking-widest font-bold">Workspace Portfolio</span>
          <h1 className="text-xl sm:text-2xl font-bold font-space tracking-tight flex items-center gap-2 text-[#171717] dark:text-white mt-0.5">
            <Layers className="text-accent" size={20} />
            <span>My Designs Layouts</span>
          </h1>
          <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mt-1 leading-relaxed">
            Manage draft iterations, ZIP bulk directories, and visual portfolio posts.
          </p>
        </div>
        
        <Button
          onClick={() => onCreateNew?.()}
          variant="primary"
          className="h-11 px-5"
        >
          <Plus size={15} />
          <span>Create New Post</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#ECECEC] dark:border-white/10 pb-0.5">
        <button
          onClick={() => setActiveTab("drafts")}
          className={`pb-3.5 px-1 text-sm font-space font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "drafts" 
              ? "border-accent text-accent" 
              : "border-transparent text-[#888888] hover:text-[#555555]"
          }`}
        >
          Drafts ({drafts.length})
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`pb-3.5 px-1 text-sm font-space font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "published" 
              ? "border-accent text-accent" 
              : "border-transparent text-[#888888] hover:text-[#555555]"
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
        drafts.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-[#F7F7F8] dark:bg-surface-dark/40 rounded-[24px] border border-[#ECECEC] dark:border-white/5">
            <img 
              src={theme === 'dark' ? '/no-data-found-d.svg' : '/no-data-found-l.svg'} 
              alt="No drafts found" 
              className="w-48 h-auto opacity-70 mb-2"
            />
            <span className="text-xs font-mono text-[#888888] uppercase tracking-widest">
              No active drafting frames indexed. Create a new post mockup above.
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected items publisher banner bar */}
            {selectedDrafts.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-20 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[18px] bg-white dark:bg-[#5A0A20] border border-accent/20 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-space font-bold uppercase tracking-wider text-[#171717] dark:text-white">
                    {selectedDrafts.size} selected for loop
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-xs font-mono text-[#888888] hover:text-accent underline cursor-pointer"
                  >
                    Clear Selected
                  </button>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => setShowMultiDeleteConfirm("draft")}
                    variant="secondary"
                    loading={deleteSelectedMutation.isPending}
                    className="flex-1 sm:flex-none py-2 px-4 sm:px-6 text-xs h-auto !border-red-500 !text-red-500 hover:!bg-red-500/10"
                  >
                    Delete Selected
                  </Button>
                  <Button
                    loading={publishMutation.isPending}
                    onClick={() => publishMutation.mutate(Array.from(selectedDrafts))}
                    variant="primary"
                    className="flex-1 sm:flex-none py-2 px-4 sm:px-6 text-xs h-auto"
                  >
                    Publish for Feedback
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                  <div className="relative w-full aspect-[16/10] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    <DesignCarousel
                      imageUrls={draft.imageUrls}
                      fallbackUrl={draft.imageUrl}
                      title={draft.title || "Untitled Draft"}
                      className="w-full h-full"
                    />
                    
                    {/* Hover triggers */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-start p-4 z-10">
                      <button
                        onClick={() => onEditDraft?.(draft.id)}
                        className="text-xs font-space font-bold uppercase text-white flex items-center gap-1 hover:text-accent cursor-pointer"
                      >
                        <Edit3 size={13} /> Edit Layout
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-space font-semibold text-sm text-[#171717] dark:text-white truncate">
                      {draft.title || "Untitled Draft Mockup"}
                    </h4>
                    <p className="text-xs text-[#555555] dark:text-[#D7D7D7] truncate">
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
                        className="text-[#888888] hover:text-red-500 transition-colors shrink-0 pb-1"
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
        )
      ) : publishedDesigns.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-[#F7F7F8] dark:bg-surface-dark/40 rounded-[24px] border border-[#ECECEC] dark:border-white/5">
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
              className="sticky top-20 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[18px] bg-white dark:bg-[#5A0A20] border border-accent/20 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-space font-bold uppercase tracking-wider text-[#171717] dark:text-white">
                  {selectedPublished.size} selected
                </span>
                <button
                  onClick={clearPublishedSelection}
                  className="text-xs font-mono text-[#888888] hover:text-accent underline cursor-pointer"
                >
                  Clear Selected
                </button>
              </div>
              <div className="flex items-center w-full sm:w-auto">
                <Button
                  onClick={() => setShowMultiDeleteConfirm("published")}
                  variant="secondary"
                  loading={deleteSelectedMutation.isPending}
                  className="w-full sm:w-auto py-2 px-4 sm:px-6 text-xs h-auto !border-red-500 !text-red-500 hover:!bg-red-500/10"
                >
                  Delete Selected
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
                <div className="relative aspect-[16/10] w-full shrink-0 group">
                  <DesignCarousel
                    imageUrls={design.imageUrls}
                    fallbackUrl={design.imageUrl}
                    title={design.title}
                    className="w-full h-full"
                  />
                  
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
                  <h4 className="font-space font-semibold text-sm text-[#171717] dark:text-white truncate">
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
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#888888] uppercase tracking-wider">
                      <span className="flex items-center gap-1 text-accent font-bold">
                        <Heart size={11} fill="currentColor" className="stroke-none" />
                        <span>{design.stats.likes} Likes</span>
                      </span>
                      <span>•</span>
                      <span>Published {new Date(design.publishedAt!).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDraftToDelete(design);
                      }}
                      className="text-[#888888] hover:text-red-500 transition-colors shrink-0"
                      title="Delete Published Design"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Deletion dialog Modal */}
      <AnimatePresence>
        {draftToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDraftToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-md p-6 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-lg dark:shadow-none text-left z-10"
            >
              <h3 className="text-base font-bold font-space text-[#171717] dark:text-white uppercase tracking-wider mb-2">
                Remove Design Frame?
              </h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mb-6 leading-relaxed">
                Are you sure you want to permanently erase <span className="font-semibold text-accent">"{draftToDelete.title || "Untitled Draft"}"</span>? This will sync indices and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => setDraftToDelete(null)}
                  variant="secondary"
                  className="py-2.5 px-4 h-auto text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    deleteMutation.mutate({
                      id: draftToDelete.id,
                      status: draftToDelete.status,
                    });
                    setDraftToDelete(null);
                  }}
                  variant="primary"
                  className="py-2.5 px-5 h-auto text-xs"
                >
                  Delete Draft
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Deletion dialog Modal */}
      <AnimatePresence>
        {showMultiDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMultiDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-md p-6 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-lg dark:shadow-none text-left z-10"
            >
              <h3 className="text-base font-bold font-space text-[#171717] dark:text-white uppercase tracking-wider mb-2">
                Remove {showMultiDeleteConfirm === 'draft' ? selectedDrafts.size : selectedPublished.size} Designs?
              </h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mb-6 leading-relaxed">
                Are you sure you want to permanently erase the selected designs? This will sync indices and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowMultiDeleteConfirm(null)}
                  variant="secondary"
                  className="py-2.5 px-4 h-auto text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const ids = Array.from(showMultiDeleteConfirm === 'draft' ? selectedDrafts : selectedPublished) as string[];
                    deleteSelectedMutation.mutate({ ids, status: showMultiDeleteConfirm });
                    setShowMultiDeleteConfirm(null);
                  }}
                  variant="primary"
                  className="py-2.5 px-5 h-auto text-xs"
                >
                  Delete Selected
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
