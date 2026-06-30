import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Loader2, Upload, FileArchive, Image as ImageIcon, X, Edit3, ArrowLeft, Link, Instagram, Twitter, Globe, Pin } from "lucide-react";
import { UserProfile } from "../types";
import { designService, Design } from "../services/design.service";
import { zipImportService } from "../services/zipImport.service";
import { cloudinaryService } from "../services/cloudinary.service";
import { imageCompressionService } from "../services/imageCompression.service";
import { useUploadStore } from "../stores/upload.store";
import { useToastStore } from "../stores/toast.store";
import { Button } from "./Button";
import { Card } from "./Card";
import { ImportMethodCard } from "./CreatorWorkspace/ImportMethodCard";
import { CategorySelector, TagSelector } from "./CreatorWorkspace/Selectors";

const CATEGORIES = [
  "UI/UX", "Branding", "Posters", "Logos", "Brochures", 
  "Infographics", "Banners", "Presentations", "Packaging", 
  "Motion", "3D"
];
const STYLES = [
  "Minimal", "Brutalist", "Neo Brutalist", "Glassmorphism", 
  "Editorial", "Luxury", "Corporate", "Dark UI", 
  "Futuristic", "Experimental"
];

type UploadMode = "none" | "select" | "manual" | "zip" | "url";

interface ProjectEditorViewProps {
  user: UserProfile;
  theme: "dark" | "light";
  initialDraftId?: string | null;
  onBack: () => void;
}

export const ProjectEditorView: React.FC<ProjectEditorViewProps> = ({ user, theme, initialDraftId, onBack }) => {
  const { showToast } = useToastStore();
  const { drafts, addDraft, updateDraft } = useUploadStore();
  
  const [uploadMode, setUploadMode] = useState<UploadMode>(initialDraftId ? "none" : "select");
  const [editingDraft, setEditingDraft] = useState<Design | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingZip, setPendingZip] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const sessionCloudinaryUrls = useRef<string[]>([]);

  useEffect(() => {
    if (initialDraftId) {
      const draft = drafts.find(d => d.id === initialDraftId);
      if (draft) {
        setEditingDraft(draft);
        setUploadMode("none");
      }
    }
  }, [initialDraftId, drafts]);

  const extractImageUrlFromPage = async (pageUrl: string): Promise<string[]> => {
    if (pageUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) {
      return [pageUrl];
    }
    
    // Explicitly handle Artstation pages because Cloudflare blocks direct crawler requests
    if (pageUrl.includes("artstation.com") && !pageUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
      throw new Error("Artstation uses high Cloudflare protection that blocks automated page imports. To import your Artstation design instantly, please right-click the image on Artstation, select 'Copy image address', and paste that direct link here!");
    }
    
    // First try the server proxy
    try {
      const response = await fetch(`/api/url-metadata?url=${encodeURIComponent(pageUrl)}`);
      const data = await response.json();
      
      if (data.imageUrls && data.imageUrls.length > 0 && data.imageUrls[0] !== pageUrl) {
        return data.imageUrls;
      }
      if (data.imageUrl && data.imageUrl !== pageUrl) {
        return [data.imageUrl];
      }
    } catch (e) {
      console.warn("Server proxy failed, trying client corsproxy...", e);
    }

    // Fallback to client-side corsproxy.io to bypass server-side blocks
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(pageUrl)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
          const html = await response.text();
          
          const images: string[] = [];
          const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || 
                               html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/);
          if (ogImageMatch) images.push(ogImageMatch[1].replace(/&amp;/g, '&'));
          
          const imgRegex = /<img[^>]*src=["'](https:\/\/[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
          let match;
          while ((match = imgRegex.exec(html)) !== null) {
            if (!match[1].includes('favicon') && !match[1].includes('avatar') && !match[1].includes('/50')) {
              images.push(match[1].replace(/&amp;/g, '&'));
            }
          }
          
          const uniqueImages = Array.from(new Set(images));
          if (uniqueImages.length > 0) return uniqueImages;
      }
    } catch (err) {
      console.warn("Client corsproxy failed", err);
    }
    
    return [pageUrl];
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim()) return;
    setUploading(true);
    try {
      const resolvedImageUrls = await extractImageUrlFromPage(importUrl.trim());
      const firstImageUrl = resolvedImageUrls[0];
      
      let url = "";
      let thumbnailUrl = "";
      let uploadSuccess = false;

      // Try to fetch direct image URLs as a Blob and upload as a File to bypass Cloudinary IP bans (like Behance's CDN)
      if (firstImageUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || firstImageUrl.includes('mir-s3-cdn-cf') || firstImageUrl.includes('pinimg.com/')) {
        try {
            const res = await fetch(firstImageUrl);
            if (res.ok) {
                const blob = await res.blob();
                const file = new File([blob], "imported-image.jpg", { type: blob.type || 'image/jpeg' });
                const uploaded = await cloudinaryService.uploadImage(file);
                url = uploaded.url;
                thumbnailUrl = uploaded.thumbnailUrl;
                uploadSuccess = true;
            }
        } catch (e) {
            console.warn("Failed to fetch image as blob, falling back to direct upload", e);
        }
      }

      // If blob fetch failed or it's a regular HTML URL (like a profile page), use uploadFromUrl
      if (!uploadSuccess) {
          const uploaded = await cloudinaryService.uploadFromUrl(firstImageUrl);
          url = uploaded.url;
          thumbnailUrl = uploaded.thumbnailUrl;
      }

      if (url) {
        sessionCloudinaryUrls.current.push(url);
      }

      setEditingDraft({
        id: `url_${user.id}_${Date.now()}`,
        userId: user.id,
        source: "url",
        sourceId: importUrl.trim(),
        title: "",
        description: "",
        imageUrl: url,
        thumbnailUrl,
        imageUrls: resolvedImageUrls.length > 1 ? resolvedImageUrls : [url],
        category: null,
        format: null,
        styles: [],
        tags: [],
        status: "draft",
        imported: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        stats: { likes: 0, dislikes: 0, saves: 0, score: 0 },
      });
      setUploadMode("none");
      setImportUrl("");
      showToast("Image imported from URL.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to import image from URL.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleManualUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await imageCompressionService.compressImage(file);
      const { url, thumbnailUrl } = await cloudinaryService.uploadImage(compressed);

      if (url) {
        sessionCloudinaryUrls.current.push(url);
      }

      setEditingDraft({
        id: `manual_${user.id}_${Date.now()}`,
        userId: user.id,
        source: "manual",
        sourceId: null,
        title: "",
        description: "",
        imageUrl: url,
        thumbnailUrl,
        imageUrls: [url],
        category: null,
        format: null,
        styles: [],
        tags: [],
        status: "draft",
        imported: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        stats: { likes: 0, dislikes: 0, saves: 0, score: 0 },
      });
      setUploadMode("none");
      showToast("Image uploaded to local draft.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to upload image.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleZipImportInit = async (file: File) => {
    setUploading(true);
    try {
      const extracted = await zipImportService.extractImages(file);
      if (extracted.length === 0) {
        showToast("No valid images found in ZIP.", "error");
        return;
      }

      const uploadedUrls = [];
      let primaryThumb = "";
      for (let i = 0; i < extracted.length; i++) {
        const compressed = await imageCompressionService.compressImage(extracted[i].file);
        const { url, thumbnailUrl } = await cloudinaryService.uploadImage(compressed);
        uploadedUrls.push(url);
        if (url) {
          sessionCloudinaryUrls.current.push(url);
        }
        if (i === 0) primaryThumb = thumbnailUrl;
      }

      setEditingDraft({
        id: `zip_${user.id}_${Date.now()}`,
        userId: user.id,
        source: "zip",
        sourceId: file.name,
        title: file.name.split(".")[0],
        description: "Imported from ZIP collection",
        imageUrl: uploadedUrls[0],
        thumbnailUrl: primaryThumb,
        imageUrls: uploadedUrls,
        category: null,
        format: null,
        styles: [],
        tags: [],
        status: "draft",
        imported: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        stats: { likes: 0, dislikes: 0, saves: 0, score: 0 },
      });
      showToast(`Imported ${extracted.length} images as one project.`, "success");
      setUploadMode("none");
    } catch (err: any) {
      showToast("ZIP Import failed: " + err.message, "error");
    } finally {
      setUploading(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  };

  const isFormValid = editingDraft && 
    editingDraft.title.trim().length > 0 && 
    editingDraft.description.trim().length > 0 && 
    editingDraft.category && 
    editingDraft.styles.length > 0;

  const saveDraftEdits = async () => {
    if (!editingDraft) return;
    try {
      if (initialDraftId) {
        await designService.updateDesign(editingDraft.id, editingDraft);
        updateDraft(editingDraft.id, editingDraft);
      } else {
        const newDraft = await designService.createDesign(editingDraft);
        addDraft(newDraft);
      }
      sessionCloudinaryUrls.current = [];
      showToast("Draft saved.", "success");
      onBack();
    } catch (err: any) {
      showToast("Failed to save draft.", "error");
    }
  };

  const publishDraft = async () => {
    if (!editingDraft) return;
    try {
      if (initialDraftId) {
        // Save latest edits first
        await designService.updateDesign(editingDraft.id, editingDraft);
        // Publish properly to update stats
        await designService.publishDrafts([editingDraft.id], user.id);
        const published = {
          ...editingDraft,
          status: "published" as const,
          publishedAt: new Date().toISOString(),
        };
        updateDraft(editingDraft.id, published);
      } else {
        const published = {
          ...editingDraft,
          status: "published" as const,
          publishedAt: new Date().toISOString(),
        };
        const newDraft = await designService.createDesign(published);
        addDraft(newDraft);
      }
      sessionCloudinaryUrls.current = [];
      showToast("Project published successfully!", "success");
      onBack();
    } catch (err: any) {
      showToast("Failed to publish project.", "error");
    }
  };

  const confirmCancelUpload = () => {
    const urlsToDeleteSet = new Set<string>();

    sessionCloudinaryUrls.current.forEach(url => {
      if (url) urlsToDeleteSet.add(url);
    });

    if (!initialDraftId && editingDraft) {
      const draftUrls = editingDraft.imageUrls && editingDraft.imageUrls.length > 0 
        ? editingDraft.imageUrls 
        : [editingDraft.imageUrl].filter(Boolean);
      
      draftUrls.forEach(url => {
        if (url) urlsToDeleteSet.add(url);
      });
    }

    urlsToDeleteSet.forEach(url => {
      import('../services/cloudinary.service').then(m => m.cloudinaryService.deleteImage(url));
    });

    sessionCloudinaryUrls.current = [];
    setShowCancelConfirm(false);
    onBack();
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-fade-in text-left pb-24 px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECEC] dark:border-white/10 pb-4">
        <div>
          <button 
            onClick={() => editingDraft ? setShowCancelConfirm(true) : onBack()} 
            className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#888888] hover:text-accent tracking-widest font-bold mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft size={12} /> Back to Projects
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-space tracking-tight flex items-center gap-2 text-[#171717] dark:text-white">
            <span>{editingDraft ? "Edit Project" : "Create New Post"}</span>
          </h1>
          <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mt-1 leading-relaxed">
            {editingDraft ? "Configure the details and layouts for your project draft." : "Upload visual mockups or import a bulk directory to get started."}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {uploadMode === "select" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            <ImportMethodCard
              theme={theme}
              title="Manual Upload"
              description="Select visual web/mobile JPG, PNG, WEBP mockups"
              icon={ImageIcon}
              onClick={() => setUploadMode("manual")}
            />
            <ImportMethodCard
              theme={theme}
              title="ZIP Archive"
              description="Bulk extract active screenshots from custom ZIP files"
              icon={FileArchive}
              onClick={() => setUploadMode("zip")}
            />
            <ImportMethodCard
              theme={theme}
              title="URL Import"
              description="Import project directly from Pinterest, Behance or Artstation"
              icon={Link}
              onClick={() => setUploadMode("url")}
            />
          </motion.div>
        )}

        {uploadMode === "manual" && !editingDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2 border-accent/20 shadow-none">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleManualUpload(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Upload size={22} />
              </div>
              <h3 className="font-space font-semibold text-sm text-[#171717] dark:text-white uppercase tracking-wider">Drag & Drop Mockup</h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mt-1.5 mb-6 max-w-sm leading-relaxed">
                Provide JPG, PNG, or WEBP high-fidelity visuals.
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
                variant="primary"
                className="px-8"
              >
                Select Image Mockup
              </Button>
            </Card>
          </motion.div>
        )}

        {uploadMode === "zip" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2 border-accent/20 shadow-none">
              <input
                type="file"
                accept=".zip"
                ref={zipInputRef}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleZipImportInit(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
                <FileArchive size={22} />
              </div>
              <h3 className="font-space font-semibold text-sm text-[#171717] dark:text-white uppercase tracking-wider">Bulk ZIP Directory</h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mt-1.5 mb-6 max-w-sm leading-relaxed">
                We will automatically parse the archive and extract compatible design layers.
              </p>
              <Button
                onClick={() => zipInputRef.current?.click()}
                loading={uploading}
                variant="primary"
                className="px-8"
              >
                Select ZIP Archive
              </Button>
            </Card>
          </motion.div>
        )}

        {uploadMode === "url" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2 border-accent/20 shadow-none">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Link size={22} />
              </div>
              <h3 className="font-space font-semibold text-sm text-[#171717] dark:text-white uppercase tracking-wider">Import from URL</h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] mt-1.5 mb-6 max-w-sm leading-relaxed">
                Paste a project link or direct image URL from Pinterest, Behance, X, Instagram, or Artstation.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full flex-1 h-12 sm:h-11 px-4 text-xs font-mono border border-[#ECECEC] dark:border-white/10 rounded-[18px] outline-none bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent"
                />
                <Button
                  onClick={handleUrlImport}
                  loading={uploading}
                  disabled={!importUrl.trim()}
                  variant="primary"
                  className="w-full sm:w-auto px-6 h-12 sm:h-11"
                >
                  Import
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-6 pt-5 border-t border-[#ECECEC]/40 dark:border-white/5 w-full max-w-md">
                <div className="flex items-center gap-1.5 text-[11px] font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  <Globe size={13} className="text-accent" />
                  <span>Behance</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  <Pin size={13} className="text-accent" />
                  <span>Pinterest</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  <Twitter size={13} className="text-accent" />
                  <span>X / Twitter</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-space font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D7D7D7]">
                  <Instagram size={13} className="text-accent" />
                  <span>Instagram</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {editingDraft && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full py-2"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-4">
                <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden bg-[#ECECEC] dark:bg-accent/20 group/img flex flex-col items-center justify-center border border-[#ECECEC] dark:border-white/5">
                    {editingDraft.imageUrl ? (
                      <>
                        <img
                          src={(editingDraft.imageUrls && editingDraft.imageUrls[activeImageIdx]) || editingDraft.imageUrl}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          alt="Draft layout active"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  setUploading(true);
                                  try {
                                    const compressed = await imageCompressionService.compressImage(file);
                                    const { url, thumbnailUrl } = await cloudinaryService.uploadImage(compressed);
                                    
                                    if (url) {
                                      sessionCloudinaryUrls.current.push(url);
                                    }

                                    const currentUrls = editingDraft.imageUrls && editingDraft.imageUrls.length > 0
                                      ? [...editingDraft.imageUrls]
                                      : [editingDraft.imageUrl];
                                    
                                    const urlToDelete = currentUrls[activeImageIdx];
                                    currentUrls[activeImageIdx] = url;

                                    setEditingDraft({
                                      ...editingDraft,
                                      imageUrl: currentUrls[0],
                                      thumbnailUrl: activeImageIdx === 0 ? thumbnailUrl : editingDraft.thumbnailUrl,
                                      imageUrls: currentUrls,
                                    });
                                    if (urlToDelete) {
                                      sessionCloudinaryUrls.current = sessionCloudinaryUrls.current.filter(u => u !== urlToDelete);
                                      import('../services/cloudinary.service').then(m => m.cloudinaryService.deleteImage(urlToDelete));
                                    }
                                    showToast("Image updated successfully.", "success");
                                  } catch (err: any) {
                                    showToast("Failed to upload: " + err.message, "error");
                                  } finally {
                                    setUploading(false);
                                  }
                                }
                              };
                              input.click();
                            }}
                            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-sans font-bold tracking-tight rounded-[18px] cursor-pointer"
                          >
                            Replace Mockup
                          </button>
                        </div>
                      </>
                    ) : (
                      <Loader2 className="animate-spin text-accent" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-space font-semibold text-[#555555] dark:text-[#D7D7D7] uppercase">Project Carousels</span>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center pt-2">
                      {((editingDraft.imageUrls && editingDraft.imageUrls.length > 0)
                        ? editingDraft.imageUrls
                        : [editingDraft.imageUrl].filter(Boolean)
                      ).map((url, index) => (
                        <div key={url + index} className="relative group/thumb shrink-0">
                          <div
                            onClick={() => setActiveImageIdx(index)}
                            className={`relative w-16 h-16 rounded-[18px] cursor-pointer border-[2px] transition-all bg-[#ECECEC] dark:bg-accent ${
                              index === activeImageIdx
                                ? "border-accent scale-105"
                                : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                          >
                            <div className="w-full h-full rounded-[16px] overflow-hidden">
                              <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="thumb" />
                            </div>
                            {index !== 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentUrls = editingDraft.imageUrls && editingDraft.imageUrls.length > 0
                                    ? editingDraft.imageUrls
                                    : [editingDraft.imageUrl];
                                  const updatedUrls = [url, ...currentUrls.filter((_, i) => i !== index)];
                                  setEditingDraft({
                                    ...editingDraft,
                                    imageUrls: updatedUrls,
                                    imageUrl: updatedUrls[0],
                                  });
                                  setActiveImageIdx(0);
                                  showToast("Photo set as primary.", "success");
                                }}
                                className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-white py-0.5 text-center font-sans font-bold tracking-tight opacity-0 group-hover/thumb:opacity-100 transition-opacity uppercase rounded-b-[16px]"
                              >
                                Set Primary
                              </button>
                            ) : (
                              <span className="absolute bottom-0 inset-x-0 bg-accent text-[8px] text-white py-0.5 text-center font-sans font-bold tracking-tight uppercase rounded-b-[16px]">
                                Primary
                              </span>
                            )}
                          </div>

                          {(((editingDraft.imageUrls && editingDraft.imageUrls.length > 0)
                            ? editingDraft.imageUrls
                            : [editingDraft.imageUrl]
                          ).length > 1) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentUrls = editingDraft.imageUrls && editingDraft.imageUrls.length > 0
                                  ? editingDraft.imageUrls
                                  : [editingDraft.imageUrl];
                                const urlToDelete = currentUrls[index];
                                const updatedUrls = currentUrls.filter((_, i) => i !== index);
                                const newActiveIdx = Math.max(0, index - 1);
                                setEditingDraft({
                                  ...editingDraft,
                                  imageUrls: updatedUrls,
                                  imageUrl: updatedUrls[0] || "",
                                });
                                setActiveImageIdx(newActiveIdx);
                                if (urlToDelete) {
                                  sessionCloudinaryUrls.current = sessionCloudinaryUrls.current.filter(u => u !== urlToDelete);
                                  import('../services/cloudinary.service').then(m => m.cloudinaryService.deleteImage(urlToDelete));
                                }
                                showToast("Photo removed.", "success");
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-md cursor-pointer z-10"
                              title="Remove Photo"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.multiple = true;
                          input.onchange = async (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              setUploading(true);
                              try {
                                const uploadedUrls: string[] = [];
                                let primaryThumb = editingDraft.thumbnailUrl;
                                for (let i = 0; i < files.length; i++) {
                                  const compressed = await imageCompressionService.compressImage(files[i]);
                                  const { url, thumbnailUrl } = await cloudinaryService.uploadImage(compressed);
                                  uploadedUrls.push(url);
                                  if (url) {
                                    sessionCloudinaryUrls.current.push(url);
                                  }
                                  if (i === 0 && !primaryThumb) primaryThumb = thumbnailUrl;
                                }
                                const currentUrls = editingDraft.imageUrls && editingDraft.imageUrls.length > 0
                                  ? editingDraft.imageUrls
                                  : [editingDraft.imageUrl].filter(Boolean);
                                const finalUrls = [...currentUrls, ...uploadedUrls];
                                setEditingDraft({
                                  ...editingDraft,
                                  imageUrls: finalUrls,
                                  imageUrl: finalUrls[0],
                                  thumbnailUrl: primaryThumb,
                                });
                                setActiveImageIdx(finalUrls.length - 1);
                                showToast(`Added ${files.length} photo(s).`, "success");
                              } catch (err: any) {
                                showToast("Failed to upload: " + err.message, "error");
                              } finally {
                                setUploading(false);
                              }
                            }
                          };
                          input.click();
                        }}
                        className="w-16 h-16 rounded-[18px] border-2 border-dashed border-accent/20 bg-accent/5 text-accent flex flex-col items-center justify-center gap-0.5 hover:border-accent transition-all cursor-pointer"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span className="text-[9px] font-space font-semibold uppercase">Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-space font-semibold uppercase text-[#555555] dark:text-[#D7D7D7]">Project Title</label>
                    <input
                      value={editingDraft.title}
                      onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                      className="w-full px-4.5 py-3.5 border border-[#ECECEC] dark:border-white/10 rounded-[18px] outline-none text-sm font-sans bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent dark:focus:border-accent"
                      placeholder="e.g. Mobile Banking Interface"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-space font-semibold uppercase text-[#555555] dark:text-[#D7D7D7]">Project Description</label>
                    <textarea
                      rows={3}
                      value={editingDraft.description}
                      onChange={(e) => setEditingDraft({ ...editingDraft, description: e.target.value })}
                      className="w-full px-4.5 py-3.5 border border-[#ECECEC] dark:border-white/10 rounded-[18px] outline-none text-sm font-sans bg-white dark:bg-surface-dark text-[#171717] dark:text-white focus:border-accent dark:focus:border-accent resize-none"
                      placeholder="e.g. Modern UI design emphasizing visual layout and typography pairing"
                    />
                  </div>

                  <CategorySelector
                    theme={theme}
                    label="Category Class"
                    options={CATEGORIES}
                    value={editingDraft.category}
                    onChange={(v) => setEditingDraft({ ...editingDraft, category: v })}
                  />

                  <TagSelector
                    theme={theme}
                    label="Aesthetics"
                    options={STYLES}
                    selected={editingDraft.styles}
                    onChange={(v) => setEditingDraft({ ...editingDraft, styles: v })}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-[#ECECEC] dark:border-white/10">
                    <Button
                      onClick={saveDraftEdits}
                      variant="secondary"
                      className="w-full h-12"
                      disabled={!isFormValid}
                    >
                      <span>Save as Draft</span>
                    </Button>
                    <Button
                      onClick={publishDraft}
                      variant="primary"
                      className="w-full h-12"
                      disabled={!isFormValid}
                    >
                      <span>Publish Project</span>
                    </Button>
                  </div>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative z-10 w-full max-w-sm p-6 sm:p-8 bg-white dark:bg-surface-dark border border-[#ECECEC] dark:border-white/10 rounded-[24px] shadow-none dark:shadow-none text-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                <Trash2 size={22} />
              </div>
              <h3 className="font-space font-bold text-base uppercase tracking-wider text-[#171717] dark:text-white mb-2">
                Discard Edits
              </h3>
              <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed mb-6">
                Are you sure you want to go back? Unsaved edits to this draft will be lost.
              </p>
              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={confirmCancelUpload}
                  variant="primary"
                  className="w-full h-11"
                >
                  Discard Draft
                </Button>
                <Button
                  onClick={() => setShowCancelConfirm(false)}
                  variant="secondary"
                  className="w-full h-11"
                >
                  Keep Editing
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};
