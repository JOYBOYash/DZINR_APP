import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  Palette, 
  Upload, 
  FileArchive, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  Loader2,
  X
} from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileForm } from './ProfileForm';
import { userService } from '../services/user.service';
import { designService } from '../services/design.service';
import { zipImportService } from '../services/zipImport.service';
import { cloudinaryService } from '../services/cloudinary.service';
import { imageCompressionService } from '../services/imageCompression.service';
import { useToastStore } from '../stores/toast.store';
import { UserProfile } from '../types';
import { Card } from './Card';
import { Button } from './Button';

interface ProfileSetupFlowProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  onComplete: (updatedUser: UserProfile) => void;
}

interface UploadedDesign {
  id: string;
  url: string;
  thumbnailUrl: string;
  imageUrls?: string[];
  title: string;
  description: string;
}

export const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({
  user,
  theme,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const { showToast } = useToastStore();

  // Profile data
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');

  // Wizard state values
  const [uploadMode, setUploadMode] = useState<'select' | 'manual' | 'zip' | 'url' | 'none'>('select');
  const [uploadedDesigns, setUploadedDesigns] = useState<UploadedDesign[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  
  const [isProfileValid, setIsProfileValid] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Extract helper from URL
  const extractImageUrlFromPage = async (pageUrl: string): Promise<string[]> => {
    if (pageUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) {
      return [pageUrl];
    }
    
    if (pageUrl.includes("artstation.com") && !pageUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
      throw new Error("Artstation uses high Cloudflare protection that blocks automated requests. Right-click the image, choose 'Copy image address', and paste that direct link here!");
    }
    
    try {
      const response = await fetch(`/api/url-metadata?url=${encodeURIComponent(pageUrl)}`);
      const data = await response.json();
      if (data.imageUrls && data.imageUrls.length > 0) {
        return data.imageUrls;
      }
      if (data.imageUrl) {
        return [data.imageUrl];
      }
    } catch (e) {
      console.warn("Proxy failed, trying client fallback...", e);
    }

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
          if (!match[1].includes('favicon') && !match[1].includes('avatar')) {
            images.push(match[1].replace(/&amp;/g, '&'));
          }
        }
        
        const unique = Array.from(new Set(images));
        if (unique.length > 0) return unique;
      }
    } catch (err) {
      console.warn("Client proxy failed", err);
    }
    
    return [pageUrl];
  };

  // URL Import routine
  const handleUrlImport = async () => {
    if (!importUrl.trim()) return;
    setUploading(true);
    try {
      const resolved = await extractImageUrlFromPage(importUrl.trim());
      const firstUrl = resolved[0];
      
      let url = "";
      let thumbnailUrl = "";
      let uploadSuccess = false;

      if (firstUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || firstUrl.includes('mir-s3-cdn-cf') || firstUrl.includes('pinimg.com/')) {
        try {
          const res = await fetch(firstUrl);
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], "imported-image.webp", { type: blob.type || 'image/webp' });
            const compressed = await imageCompressionService.compressImage(file);
            const uploaded = await cloudinaryService.uploadImage(compressed);
            url = uploaded.url;
            thumbnailUrl = uploaded.thumbnailUrl;
            uploadSuccess = true;
          }
        } catch (e) {
          console.warn("Blob fetch failed, falling back to url", e);
        }
      }

      if (!uploadSuccess) {
        const uploaded = await cloudinaryService.uploadFromUrl(firstUrl);
        url = uploaded.url;
        thumbnailUrl = uploaded.thumbnailUrl;
      }

      const cleanTitle = importUrl
        .replace(/https?:\/\/(www\.)?/, '')
        .split('/')[0] + ' Design';

      const newDesign: UploadedDesign = {
        id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        url,
        thumbnailUrl,
        imageUrls: resolved.length > 1 ? resolved : [url],
        title: cleanTitle,
        description: `Imported directly from ${importUrl}`
      };

      setUploadedDesigns(prev => [...prev, newDesign]);
      setImportUrl('');
      showToast("Design URL imported successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to import design from URL.", "error");
    } finally {
      setUploading(false);
    }
  };

  // Manual File Upload routine
  const handleManualFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    
    try {
      const urls: string[] = [];
      let primaryUrl = "";
      let primaryThumb = "";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await imageCompressionService.compressImage(file);
        const uploaded = await cloudinaryService.uploadImage(compressed);
        urls.push(uploaded.url);
        if (i === 0) {
          primaryUrl = uploaded.url;
          primaryThumb = uploaded.thumbnailUrl;
        }
      }
      
      const pending: UploadedDesign = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        url: primaryUrl,
        thumbnailUrl: primaryThumb,
        imageUrls: urls,
        title: files.length > 1 ? "Visual Mockups Carousel" : files[0].name.replace(/\.[^/.]+$/, "") || "Creative Mockup",
        description: "Visual creation screenshot"
      };

      setUploadedDesigns(prev => [...prev, pending]);
      showToast(`Successfully uploaded ${files.length} mockups!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to upload manual images.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ZIP Archive Upload & Extraction routine
  const handleZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const extracted = await zipImportService.extractImages(file);
      if (extracted.length === 0) {
        showToast("No valid JPG, PNG, or WEBP files found in ZIP archive.", "error");
        setUploading(false);
        return;
      }

      showToast(`Extracting and compressing ${extracted.length} images...`, "success");
      const urls: string[] = [];
      let primaryUrl = "";
      let primaryThumb = "";

      for (let i = 0; i < extracted.length; i++) {
        const ext = extracted[i];
        const compressed = await imageCompressionService.compressImage(ext.file);
        const uploaded = await cloudinaryService.uploadImage(compressed);
        urls.push(uploaded.url);
        if (i === 0) {
          primaryUrl = uploaded.url;
          primaryThumb = uploaded.thumbnailUrl;
        }
      }

      const pending: UploadedDesign = {
        id: `zip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        url: primaryUrl,
        thumbnailUrl: primaryThumb,
        imageUrls: urls,
        title: "ZIP Extracted Portfolio",
        description: "ZIP unpacked visual screenshot carousel"
      };

      setUploadedDesigns(prev => [...prev, pending]);
      showToast(`Bulk imported ${extracted.length} screenshots from archive!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to unpack ZIP archive screenshots.", "error");
    } finally {
      setUploading(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleRemoveDesign = (id: string) => {
    setUploadedDesigns(prev => prev.filter(d => d.id !== id));
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setUploadedDesigns(prev => prev.map(d => d.id === id ? { ...d, title: newTitle } : d));
  };

  // Finalize setup: creates real designs in the Firestore database
  const handleFinalizeSetup = async (skipImports = false) => {
    setSubmitting(true);
    setSaveError(null);

    try {
      const designsToSave = skipImports ? [] : uploadedDesigns;

      // Save each imported design to Firestore database
      for (const d of designsToSave) {
        await designService.createDesign({
          id: d.id,
          userId: user.id,
          source: uploadMode === 'manual' ? 'manual' : (uploadMode === 'zip' ? 'zip' : 'portfolio'),
          sourceId: uploadMode === 'url' ? importUrl : null,
          title: d.title || 'Untitled Creation',
          description: d.description || 'Onboarded visual design feedback request',
          imageUrl: d.url,
          thumbnailUrl: d.thumbnailUrl,
          imageUrls: d.imageUrls && d.imageUrls.length > 0 ? d.imageUrls : [d.url],
          category: 'Web/App Design',
          format: 'mockup',
          styles: ['Minimalist'],
          tags: ['onboarding'],
          status: 'draft',
          imported: true,
          publishedAt: new Date().toISOString(),
          stats: { likes: 0, dislikes: 0, saves: 0, score: 0 }
        });
      }

      const dataToUpdate: Partial<UserProfile> = {
        avatarUrl,
        username,
        bio,
        portfolioUrl: uploadMode === 'url' ? importUrl : '',
        profileCompleted: true,
        stats: {
          uploadsCount: designsToSave.length,
          draftCount: designsToSave.length,
          publishedCount: 0
        }
      };

      await userService.updateUserProfile(user.id, dataToUpdate);
      setStep(4);
    } catch (err: any) {
      console.error('Failed to complete profile:', err);
      setSaveError('Could not save profile setup to database. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const getProgressPercentage = () => {
    switch (step) {
      case 1: return 33;
      case 2: return 66;
      case 3: return 100;
      case 4: return 100;
      default: return 0;
    }
  };

  return (
    <div 
      id="profile-setup-flow-root"
      className="w-full max-w-[800px] mx-auto min-h-[85dvh] flex flex-col justify-between py-6 px-4 sm:px-6"
    >
      {/* Progress system */}
      {step < 4 && (
        <div id="setup-progress-indicator" className="w-full space-y-3 mb-8">
          <div className="flex justify-between items-center text-xs font-mono tracking-wider text-[#888888] dark:text-[#A9A9A9] uppercase">
            <span>Profile Creator Wizard</span>
            <span>Step {step} of 3</span>
          </div>
          <div className="w-full h-1 bg-neutral-200 dark:bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-accent"
              initial={{ width: "0%" }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-space font-semibold tracking-wider text-[#555555] dark:text-[#D7D7D7]">
            <span className={step >= 1 ? 'text-accent' : 'opacity-40'}>1. PROFILE</span>
            <span className={step >= 2 ? 'text-accent' : 'opacity-40'}>2. IMPORT ROUTE</span>
            <span className={step >= 3 ? 'text-accent' : 'opacity-40'}>3. SYNCHRONIZE</span>
          </div>
        </div>
      )}

      {/* Main setup wizard body */}
      <div className="flex-1 flex flex-col justify-center items-center py-4 w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6 max-w-md"
            >
              <div className="text-center space-y-1 max-w-sm">
                <h2 className="text-xl sm:text-2xl font-bold font-space text-[#171717] dark:text-white tracking-tight">
                  Personalize Profile
                </h2>
                <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                  Upload your signature visual avatar and customize your creative curation alias.
                </p>
              </div>

              <div className="w-full flex justify-center">
                <ProfileAvatar 
                  currentAvatarUrl={avatarUrl}
                  onAvatarChanged={setAvatarUrl}
                  theme={theme}
                />
              </div>

              <div className="w-full">
                <ProfileForm 
                  username={username}
                  bio={bio}
                  onUsernameChange={setUsername}
                  onBioChange={setBio}
                  onValidationStatusChange={setIsProfileValid}
                  theme={theme}
                  userId={user.id}
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1 max-w-sm">
                <h2 className="text-xl sm:text-2xl font-bold font-space text-[#171717] dark:text-white tracking-tight">
                  Import Design Work
                </h2>
                <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                  Establish live workspace synchronization. Choose how you want to load your starting feeds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
                <button
                  id="choice-route-manual"
                  type="button"
                  onClick={() => {
                    setUploadMode('manual');
                    setStep(3);
                  }}
                  className="p-5 border border-divider-light dark:border-divider-dark rounded-[24px] text-left flex flex-col justify-between h-[155px] bg-surface-light dark:bg-surface-dark cursor-pointer hover:border-accent dark:hover:border-accent hover:shadow-sm group transition-all duration-200"
                >
                  <ImageIcon size={22} className="text-accent group-hover:scale-105 transition-transform" />
                  <div className="space-y-1">
                    <h4 className="font-space font-semibold text-[#171717] dark:text-white text-xs sm:text-sm">Manual Upload</h4>
                    <p className="text-[11px] text-[#555555] dark:text-[#A9A9A9] leading-snug">Upload individual JPG, PNG, or WEBP designs/screenshots.</p>
                  </div>
                </button>

                <button
                  id="choice-route-zip"
                  type="button"
                  onClick={() => {
                    setUploadMode('zip');
                    setStep(3);
                  }}
                  className="p-5 border border-divider-light dark:border-divider-dark rounded-[24px] text-left flex flex-col justify-between h-[155px] bg-surface-light dark:bg-surface-dark cursor-pointer hover:border-accent dark:hover:border-accent hover:shadow-sm group transition-all duration-200"
                >
                  <FileArchive size={22} className="text-accent group-hover:scale-105 transition-transform" />
                  <div className="space-y-1">
                    <h4 className="font-space font-semibold text-[#171717] dark:text-white text-xs sm:text-sm">ZIP Archive</h4>
                    <p className="text-[11px] text-[#555555] dark:text-[#A9A9A9] leading-snug">Upload a .zip folder to bulk unpack and extract starting mockups.</p>
                  </div>
                </button>

                <button
                  id="choice-route-url"
                  type="button"
                  onClick={() => {
                    setUploadMode('url');
                    setStep(3);
                  }}
                  className="p-5 border border-divider-light dark:border-divider-dark rounded-[24px] text-left flex flex-col justify-between h-[155px] bg-surface-light dark:bg-surface-dark cursor-pointer hover:border-accent dark:hover:border-accent hover:shadow-sm group transition-all duration-200"
                >
                  <LinkIcon size={22} className="text-accent group-hover:scale-105 transition-transform" />
                  <div className="space-y-1">
                    <h4 className="font-space font-semibold text-[#171717] dark:text-white text-xs sm:text-sm">URL Import</h4>
                    <p className="text-[11px] text-[#555555] dark:text-[#A9A9A9] leading-snug">Import previews directly from Pinterest, Artstation or Behance links.</p>
                  </div>
                </button>

                <button
                  id="choice-route-fresh"
                  type="button"
                  onClick={() => {
                    setUploadMode('none');
                    setUploadedDesigns([]);
                    handleFinalizeSetup(true);
                  }}
                  className="p-5 border border-divider-light dark:border-divider-dark rounded-[24px] text-left flex flex-col justify-between h-[155px] bg-surface-light dark:bg-surface-dark cursor-pointer hover:border-accent dark:hover:border-accent hover:shadow-sm group transition-all duration-200"
                >
                  <Palette size={22} className="text-accent group-hover:scale-105 transition-transform" />
                  <div className="space-y-1">
                    <h4 className="font-space font-semibold text-[#171717] dark:text-white text-xs sm:text-sm">Start Fresh</h4>
                    <p className="text-[11px] text-[#555555] dark:text-[#A9A9A9] leading-snug">Skip starting designs and configure feedback boards manually later.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center gap-6 max-w-xl"
            >
              <div className="text-center space-y-1 max-w-sm">
                <h2 className="text-xl sm:text-2xl font-bold font-space text-[#171717] dark:text-white tracking-tight">
                  {uploadMode === 'manual' && 'Upload Design Mockups'}
                  {uploadMode === 'zip' && 'Bulk Extract ZIP Folder'}
                  {uploadMode === 'url' && 'Import URL Screenshots'}
                </h2>
                <p className="text-xs text-[#555555] dark:text-[#D7D7D7] leading-relaxed">
                  {uploadMode === 'manual' && 'Select one or more visual mockups to load into your portfolio feed.'}
                  {uploadMode === 'zip' && 'Choose a .zip archive of visual works to automatically compile into cards.'}
                  {uploadMode === 'url' && 'Enter a Behance, Pinterest, or direct image link to unpack.'}
                </p>
              </div>

              {/* Upload Zone */}
              <div className="w-full">
                {uploadMode === 'manual' && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-divider-light dark:border-divider-dark rounded-[24px] p-8 text-center cursor-pointer hover:border-accent transition-colors flex flex-col items-center gap-3 bg-surface-light/50 dark:bg-surface-dark/40"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleManualFiles} 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                    />
                    {uploading ? (
                      <Loader2 size={32} className="text-accent animate-spin" />
                    ) : (
                      <Upload size={32} className="text-[#888888] dark:text-[#A9A9A9]" />
                    )}
                    <div>
                      <span className="text-xs font-semibold text-[#171717] dark:text-white block">Click to select mockup files</span>
                      <span className="text-[10px] text-[#888888] block mt-1">PNG, JPG, or WEBP up to 2MB (Auto-compressed to WebP)</span>
                    </div>
                  </div>
                )}

                {uploadMode === 'zip' && (
                  <div 
                    onClick={() => zipInputRef.current?.click()}
                    className="border-2 border-dashed border-divider-light dark:border-divider-dark rounded-[24px] p-8 text-center cursor-pointer hover:border-accent transition-colors flex flex-col items-center gap-3 bg-surface-light/50 dark:bg-surface-dark/40"
                  >
                    <input 
                      type="file" 
                      ref={zipInputRef} 
                      onChange={handleZipFile} 
                      accept=".zip" 
                      className="hidden" 
                    />
                    {uploading ? (
                      <Loader2 size={32} className="text-accent animate-spin" />
                    ) : (
                      <FileArchive size={32} className="text-[#888888] dark:text-[#A9A9A9]" />
                    )}
                    <div>
                      <span className="text-xs font-semibold text-[#171717] dark:text-white block">Select a ZIP file archive</span>
                      <span className="text-[10px] text-[#888888] block mt-1">Unpacks and extracts image screenshots automatically</span>
                    </div>
                  </div>
                )}

                {uploadMode === 'url' && (
                  <div className="flex gap-2 w-full max-w-md mx-auto">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://behance.net/gallery/..."
                        className="w-full bg-surface-light dark:bg-surface-dark text-[#171717] dark:text-white text-xs rounded-xl px-4 py-3 border border-divider-light dark:border-divider-dark focus:outline-none focus:border-accent"
                      />
                    </div>
                    <Button
                      id="onboarding-url-import-btn"
                      onClick={handleUrlImport}
                      loading={uploading}
                      disabled={!importUrl.trim()}
                      className="py-3 px-5 text-xs font-semibold shrink-0"
                    >
                      <span>Unpack</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Uploaded Designs Grid */}
              {uploadedDesigns.length > 0 && (
                <div className="w-full space-y-3">
                  <span className="text-[10px] font-mono uppercase text-[#888888] dark:text-[#A9A9A9] block">
                    IMPORTED PREVIEWS ({uploadedDesigns.length})
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {uploadedDesigns.map((d) => (
                      <div 
                        key={d.id} 
                        className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark rounded-xl relative group"
                      >
                        <img 
                          src={d.thumbnailUrl || d.url} 
                          alt={d.title} 
                          className="w-12 h-12 rounded-lg object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={d.title}
                            onChange={(e) => handleTitleChange(d.id, e.target.value)}
                            className="bg-transparent text-[#171717] dark:text-white text-xs font-semibold focus:outline-none focus:underline w-full"
                            placeholder="Design Name"
                          />
                          <span className="text-[9px] font-mono text-[#888888] block truncate mt-0.5">Mockup Screenshot</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDesign(d.id)}
                          className="text-[#888888] hover:text-[#C90023] p-1.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              <Card id="setup-success-card" className="p-8 text-center flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Check size={28} strokeWidth={3} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-space text-accent tracking-tight">
                    Curation Space Active
                  </h2>
                  <p className="text-xs sm:text-sm text-[#555555] dark:text-[#D7D7D7] max-w-xs mx-auto leading-relaxed">
                    Your profile and visual feeds are configured and synchronized. Enter the workspace to start swiping.
                  </p>
                </div>

                <Button
                  id="enter-dzinr-dashboard-btn"
                  type="button"
                  onClick={() => {
                    const updatedUser: UserProfile = {
                      ...user,
                      avatarUrl,
                      username,
                      bio,
                      portfolioUrl: uploadMode === 'url' ? importUrl : '',
                      profileCompleted: true,
                      integrations: {},
                      stats: {
                        uploadsCount: uploadedDesigns.length,
                        draftCount: uploadedDesigns.length,
                        publishedCount: 0
                      }
                    };
                    onComplete(updatedUser);
                  }}
                  className="w-full"
                >
                  <span>Enter Dashboard</span>
                  <ChevronRight size={14} />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer wizard navigation triggers */}
      {step < 4 && (
        <div id="setup-wizard-triggers" className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between w-full border-t border-divider-light dark:border-divider-dark pt-6 mt-8 gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {step > 1 ? (
              <Button
                id="setup-wizard-back-btn"
                type="button"
                variant="secondary"
                onClick={handleBack}
                className="w-full sm:w-auto"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}
            
            <Button
              id="setup-wizard-skip-btn"
              type="button"
              variant="ghost"
              className="w-full sm:w-auto text-[#888888] dark:text-[#A9A9A9] hover:text-[#171717] dark:hover:text-white border-none bg-transparent hover:bg-transparent shadow-none opacity-50 hover:opacity-100 underline text-xs py-2 h-auto text-center cursor-pointer outline-none focus:outline-none"
              onClick={async () => {
                setSubmitting(true);
                try {
                  await userService.updateUserProfile(user.id, {
                    profileCompleted: true
                  });
                  onComplete({ ...user, profileCompleted: true });
                } catch (e) {
                  console.error(e);
                  setSaveError('Failed to skip setup. Try again.');
                }
                setSubmitting(false);
              }}
              disabled={submitting}
            >
              Skip setup
            </Button>
          </div>

          {step === 1 && (
            <Button
              id="setup-wizard-next-step-1-btn"
              type="button"
              variant={isProfileValid ? 'primary' : 'disabled'}
              disabled={!isProfileValid}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto"
            >
              <span>Continue</span>
              <ChevronRight size={14} />
            </Button>
          )}

          {step === 3 && (
            <Button
              id="setup-wizard-finalize-portfolio-btn"
              type="button"
              variant={!submitting ? 'primary' : 'disabled'}
              disabled={submitting}
              onClick={() => handleFinalizeSetup(false)}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ChevronRight size={14} />
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {saveError && (
        <div className="text-center text-xs font-mono text-accent mt-4 font-semibold uppercase tracking-wider">
          {saveError}
        </div>
      )}
    </div>
  );
};
