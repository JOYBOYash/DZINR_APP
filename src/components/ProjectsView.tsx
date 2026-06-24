import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Figma, 
  CheckCircle2, 
  Loader2, 
  Heart, 
  Upload, 
  ExternalLink, 
  Briefcase,
  Layers,
  ArrowLeft,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { UserProfile } from '../types';
import { projectService, Project } from '../services/project.service';
import { Button } from './Button';
import { compressImage } from '../utils/image';
import { useToastStore } from '../stores/toast.store';

interface ProjectsViewProps {
  user: UserProfile;
  theme: 'dark' | 'light';
  onBackToProfile: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  user,
  theme,
  onBackToProfile
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToastStore();

  // States
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFigmaPreviewUrl, setActiveFigmaPreviewUrl] = useState<string | null>(null);
  const [projectDeletingId, setProjectDeletingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Layout UX');
  const [formDescription, setFormDescription] = useState('');
  const [formFigmaUrl, setFormFigmaUrl] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  
  // Design setup preferences (pre-filled with user preferences)
  const [formTags, setFormTags] = useState<string[]>(user.goals || []);
  const [formInspirationStyles, setFormInspirationStyles] = useState<string[]>(user.inspirationStyles || []);
  const [formPreferredFormats, setFormPreferredFormats] = useState<string[]>(user.preferredFormats || []);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const isFigmaConnected = !!user.integrations?.figma?.connected;

  // Cloudinary credentials (retrieved from Vite environment with NEXT_PUBLIC prefix for Vercel)
  const rawCloudName = (import.meta as any).env.NEXT_PUBLIC_CLOUD_NAME;
  const rawUploadPreset = (import.meta as any).env.NEXT_PUBLIC_UPLOAD_PRESET;

  const cleanEnvValue = (val?: string) => {
    if (!val) return '';
    return val.replace(/^["']|["']$/g, '').trim();
  };

  const cloudinaryCloudName = cleanEnvValue(rawCloudName);
  const cloudinaryUploadPreset = cleanEnvValue(rawUploadPreset);

  // TanStack Query to get all projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['projects', user.id],
    queryFn: () => projectService.getProjects(user.id, isFigmaConnected),
    enabled: !!user.id,
  });

  // Create Project mutation
  const createProjectMutation = useMutation({
    mutationFn: (newProj: Omit<Project, 'id' | 'userId' | 'createdAt'>) => 
      projectService.createProject(user.id, newProj),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
      resetForm();
      setShowAddForm(false);
      showToast('Project uploaded successfully!', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to save project. Please verify fields and try again.', 'error');
    }
  });

  // Delete Project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
      showToast('Project removed successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to remove project.', 'error');
    }
  });

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('Layout UX');
    setFormDescription('');
    setFormFigmaUrl('');
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormTags(user.goals || []);
    setFormInspirationStyles(user.inspirationStyles || []);
    setFormPreferredFormats(user.preferredFormats || []);
  };

  // Drag and Drop handlers
  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelection(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelection(e.target.files[0]);
    }
  };

  const handleImageSelection = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Unsupported file format. Please upload a valid image.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size too large. Maximum size is 10MB.', 'error');
      return;
    }

    try {
      const compressed = await compressImage(file, 1200, 0.85);
      setFormImageFile(compressed);
      setFormImagePreview(URL.createObjectURL(compressed));
    } catch (err: any) {
      showToast('Failed to process image. Try again.', 'error');
    }
  };

  // Submit manual creation form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast('Project title is required.', 'error');
      return;
    }
    if (!formDescription.trim()) {
      showToast('Project description is required.', 'error');
      return;
    }

    if (formFigmaUrl.trim()) {
      const exists = projects.some(p => p.figmaUrl === formFigmaUrl.trim());
      if (exists) {
        showToast('This Figma layout is already synced to your workspace.', 'warning');
        return;
      }
    }

    setUploadingImage(true);
    let uploadedUrl = '';

    try {
      if (formImageFile) {
        if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
          throw new Error('Cloudinary environment keys are missing. Fill out VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET.');
        }

        const formData = new FormData();
        formData.append('file', formImageFile);
        formData.append('upload_preset', cloudinaryUploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || 'Cloudinary rejection');
        }

        const resData = await response.json();
        uploadedUrl = resData.secure_url;
      } else {
        // Default design blueprint fallback image
        uploadedUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      }

      // Prepare figma embed if figma Url is supplied
      let embedUrl = null;
      if (formFigmaUrl.trim()) {
        embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(formFigmaUrl.trim())}`;
      }

      await createProjectMutation.mutateAsync({
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        imageUrl: uploadedUrl,
        figmaUrl: formFigmaUrl.trim() || null,
        embedUrl,
        likes: 0,
        tags: formTags,
        inspirationStyles: formInspirationStyles,
        preferredFormats: formPreferredFormats
      });

    } catch (err: any) {
      console.error('Failed to create custom project:', err);
      showToast(err.message || 'Failed to sync or upload design.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div id="projects-view-root" className="w-full space-y-6 py-4 animate-fade-in text-left">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <button
            id="back-to-profile-btn"
            onClick={onBackToProfile}
            className={`flex items-center gap-1 text-[10px] font-space font-black uppercase tracking-widest mb-1.5 transition-all cursor-pointer ${
              theme === 'dark' ? 'text-white/55 hover:text-[#ff2d51]' : 'text-black/55 hover:text-[#ff2d51]'
            }`}
          >
            <ArrowLeft size={12} />
            Back to Profile
          </button>
          <h1 className="text-2xl md:text-3xl font-black font-space uppercase tracking-tight flex items-center gap-2">
            <Layers className="text-[#ff2d51]" size={26} />
            Project Workspace
          </h1>
          <p className="text-xs opacity-60 mt-1">
            Publish visual design assets, manage live prototype frames, and view active metrics.
          </p>
        </div>

        <button
          id="toggle-add-project-btn"
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-5 py-3 bg-[#ff2d51] text-white hover:bg-[#ff2d51]/95 text-xs font-space font-black uppercase tracking-widest rounded-sm flex items-center justify-center gap-1.5 cursor-pointer select-none"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? "Cancel publish" : "Publish new design"}
        </button>
      </div>

      {/* Manual Upload & Figma File Sync Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden border rounded-sm ${
              theme === 'dark' ? 'bg-black/35 border-white/5' : 'bg-gray-50 border-black/5 shadow-inner'
            }`}
          >
            <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-space font-black uppercase text-xs tracking-widest text-[#ff2d51] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Design Publishing Console
                </h3>
                <span className="text-[9px] font-mono opacity-40 uppercase">Offline-ready client upload</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Form fields column */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-space font-black uppercase tracking-wider opacity-60">Project Title</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Neo-Brutalist Layout System"
                      className={`px-3 py-2.5 text-xs font-space font-bold border rounded-sm outline-none ${
                        theme === 'dark' 
                          ? 'bg-[#2b313f] border-white/10 text-white focus:border-[#ff2d51]' 
                          : 'bg-white border-black/5 text-black focus:border-[#ff2d51]'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-space font-black uppercase tracking-wider opacity-60">Layout Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className={`px-3 py-2.5 text-xs font-space font-bold border rounded-sm outline-none ${
                        theme === 'dark' 
                          ? 'bg-[#2b313f] border-white/10 text-white focus:border-[#ff2d51]' 
                          : 'bg-white border-black/5 text-black focus:border-[#ff2d51]'
                      }`}
                    >
                      <option value="Layout UX">Layout UX</option>
                      <option value="Brand Identity">Brand Identity</option>
                      <option value="Typography">Typography</option>
                      <option value="Interactive Prototype">Interactive Prototype</option>
                      <option value="Mobile interface">Mobile Interface</option>
                      <option value="Web layout">Web Layout</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-space font-black uppercase tracking-wider opacity-60">Interactive Figma Link (Optional)</label>
                    <input
                      type="url"
                      value={formFigmaUrl}
                      onChange={(e) => setFormFigmaUrl(e.target.value)}
                      placeholder="https://www.figma.com/file/..."
                      className={`px-3 py-2.5 text-xs font-mono border rounded-sm outline-none ${
                        theme === 'dark' 
                          ? 'bg-[#2b313f] border-white/10 text-white focus:border-[#ff2d51]' 
                          : 'bg-white border-black/5 text-black focus:border-[#ff2d51]'
                      }`}
                    />
                    <span className="text-[8px] opacity-40 font-mono">Adding this url auto-indexes a direct Live Embed Frame on Dzinr!</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-space font-black uppercase tracking-wider opacity-60">Design Brief / Description</label>
                    <textarea
                      required
                      rows={4}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Outline your creative goals, layout priorities, and specific aspects you want the community to critique..."
                      className={`px-3 py-2.5 text-xs font-space font-semibold border rounded-sm outline-none leading-relaxed resize-none ${
                        theme === 'dark' 
                          ? 'bg-[#2b313f] border-white/10 text-white focus:border-[#ff2d51]' 
                          : 'bg-white border-black/5 text-black focus:border-[#ff2d51]'
                      }`}
                    />
                  </div>
                </div>

                {/* Drag & Drop File Upload Column */}
                <div className="flex flex-col justify-between">
                  <div className="flex flex-col gap-1.5 h-full">
                    <span className="text-[9px] font-space font-black uppercase tracking-wider opacity-60">Design presentation layout (JPEG / PNG / WebP)</span>
                    
                    <div
                      onDragEnter={onDrag}
                      onDragOver={onDrag}
                      onDragLeave={onDrag}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 border-[1.5px] border-dashed rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all duration-300 relative ${
                        dragActive
                          ? 'border-[#ff2d51] bg-[#ff2d51]/5'
                          : theme === 'dark'
                            ? 'border-white/10 hover:border-[#ff2d51]/50 bg-black/15'
                            : 'border-black/10 hover:border-[#ff2d51]/50 bg-white'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />

                      {formImagePreview ? (
                        <div className="absolute inset-0 p-2">
                          <img
                            src={formImagePreview}
                            alt="Design presentation preview"
                            className="w-full h-full object-contain rounded-xs"
                          />
                          <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-sm border border-white/10 text-[8px] font-mono uppercase tracking-wider text-white">
                            Selected
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-12 h-12 rounded-full bg-[#ff2d51]/10 flex items-center justify-center text-[#ff2d51] mx-auto">
                            <Upload size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-space font-bold uppercase tracking-wider">Drag & Drop visual design here</p>
                            <p className="text-[9px] opacity-50 mt-1">Or click to search directories (Max 10MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                    <Button
                      id="reset-form-btn"
                      type="button"
                      variant="secondary"
                      onClick={resetForm}
                      className="py-3 text-[10px] flex-1"
                    >
                      Reset Fields
                    </Button>
                    <Button
                      id="submit-project-publish-btn"
                      type="submit"
                      loading={uploadingImage}
                      className="py-3 text-[10px] flex-1 bg-[#ff2d51] hover:bg-[#ff2d51]/90"
                    >
                      {uploadingImage ? "Uploading to Cloudinary..." : "Publish design"}
                    </Button>
                  </div>
                </div>

              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main projects collection container */}
      <div className="space-y-4">
        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="text-[#ff2d51] animate-spin" size={32} />
            <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Gathering layout metrics...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={`p-12 border border-dashed rounded-sm text-center flex flex-col items-center justify-center gap-4 ${
            theme === 'dark' ? 'border-white/10 bg-black/10' : 'border-black/10 bg-white'
          }`}>
            <div className="w-14 h-14 bg-[#ff2d51]/10 rounded-full flex items-center justify-center text-[#ff2d51]">
              <Layers size={24} />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="font-space font-black uppercase text-sm tracking-widest text-[#ff2d51]">
                No designs published yet
              </h3>
              <p className="text-xs opacity-70 leading-relaxed">
                Connect your Figma account to sync layout frames automatically, or upload manual design briefs using the publisher console above.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className={`border rounded-sm overflow-hidden flex flex-col justify-between transition-all duration-200 group hover:border-[#ff2d51]/35 hover:shadow-md ${
                  theme === 'dark' ? 'bg-[#2b313f]/30 border-white/5' : 'bg-white border-black/5 shadow-sm'
                }`}
              >
                {/* Visual presentation window */}
                <div className="relative aspect-video bg-black/25 overflow-hidden">
                  {failedImages[proj.id] || !proj.imageUrl ? (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center select-none relative ${
                      theme === 'dark' ? 'bg-[#2b313f] text-white/80' : 'bg-[#fcf5e2] text-black/80'
                    }`}>
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '12px 12px'
                      }} />
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-[#ff2d51]/10 text-[#ff2d51] border border-[#ff2d51]/25">
                          <span className="font-space font-black text-xs uppercase">
                            {proj.title ? proj.title.substring(0, 2) : 'DZ'}
                          </span>
                        </div>
                        <span className="text-[9px] font-space font-black uppercase tracking-widest text-[#ff2d51]">
                          Live layout active
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={proj.imageUrl} 
                      alt={proj.title}
                      onError={() => setFailedImages(prev => ({ ...prev, [proj.id]: true }))}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Absolute top tags and metrics */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 bg-black/85 text-white font-mono text-[8px] uppercase tracking-widest rounded-xs border border-white/10">
                      {proj.category}
                    </span>
                    {proj.figmaUrl && (
                      <span className="px-2.5 py-0.5 bg-[#ff2d51]/95 text-white font-space font-black text-[8px] uppercase tracking-widest rounded-xs">
                        Figma Synced
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#ff2d51] text-white font-space font-black text-[9px] px-2.5 py-0.5 rounded-sm shadow-md">
                    <Heart size={9} fill="white" />
                    <span>{proj.likes}</span>
                  </div>
                </div>

                {/* Content details and metrics */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-space font-black uppercase text-sm tracking-wider line-clamp-1 group-hover:text-[#ff2d51] transition-colors">{proj.title}</h3>
                    </div>
                    <p className="text-xs opacity-65 leading-relaxed line-clamp-3 font-space font-medium">{proj.description}</p>
                    
                    {/* Render tags mapping to user preferences */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(proj.tags || []).slice(0, 2).map((t, idx) => (
                         <span key={`tag-${idx}`} className="text-[8px] px-1.5 py-0.5 bg-[#ff2d51]/10 text-[#ff2d51] rounded-sm font-mono uppercase truncate max-w-[80px]">{t}</span>
                      ))}
                      {(proj.inspirationStyles || []).slice(0, 2).map((s, idx) => (
                         <span key={`style-${idx}`} className="text-[8px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-sm font-mono uppercase truncate max-w-[80px]">{s}</span>
                      ))}
                      {(proj.preferredFormats || []).slice(0, 1).map((f, idx) => (
                         <span key={`fmt-${idx}`} className="text-[8px] px-1.5 py-0.5 border border-white/10 rounded-sm font-mono uppercase truncate max-w-[80px] opacity-60">{f}</span>
                      ))}
                    </div>
                  </div>

                  {/* Metrics and links footer */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    
                    {/* Project metrics / key value tags details */}
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono opacity-65">
                      <span className="bg-black/10 dark:bg-white/5 px-2 py-0.5 rounded-sm">
                        Likes: {proj.likes}
                      </span>
                      <span className="bg-black/10 dark:bg-white/5 px-2 py-0.5 rounded-sm">
                        Published: {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                      {proj.figmaUrl && (
                        <span className="text-blue-500 font-bold">
                          ✓ Interactive Embed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      {proj.embedUrl ? (
                        <button
                          id={`preview-figma-btn-workspace-${proj.id}`}
                          onClick={() => {
                            setActiveFigmaPreviewUrl(
                              activeFigmaPreviewUrl === proj.embedUrl ? null : proj.embedUrl
                            );
                          }}
                          className={`px-3 py-1.5 rounded-sm font-space font-black uppercase text-[9px] tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                            activeFigmaPreviewUrl === proj.embedUrl
                              ? 'bg-[#ff2d51] text-white'
                              : 'bg-black/10 hover:bg-black/25 text-[#ff2d51]'
                          }`}
                        >
                          <Figma size={10} />
                          {activeFigmaPreviewUrl === proj.embedUrl ? 'Close Frame' : 'Live Embed'}
                        </button>
                      ) : proj.figmaUrl ? (
                        <a
                          href={proj.figmaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-sm bg-black/10 hover:bg-black/25 text-[#ff2d51] font-space font-black uppercase text-[9px] tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={10} />
                          View Source
                        </a>
                      ) : (
                        <div className="text-[9px] font-mono text-gray-500 uppercase">Self-contained design</div>
                      )}

                      {/* Deletion verification flow */}
                      {projectDeletingId === proj.id ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8px] font-space font-black uppercase text-red-500 tracking-wider">Are you sure?</span>
                          <button
                            id={`confirm-delete-btn-workspace-${proj.id}`}
                            onClick={() => {
                              deleteProjectMutation.mutate(proj.id);
                              setProjectDeletingId(null);
                            }}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-space font-black text-[8px] uppercase rounded-sm cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            id={`cancel-delete-btn-workspace-${proj.id}`}
                            onClick={() => setProjectDeletingId(null)}
                            className={`px-2 py-1 border font-space font-black text-[8px] uppercase rounded-sm cursor-pointer ${
                              theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-white/70' : 'border-black/10 hover:bg-black/5 text-black/70'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`delete-project-btn-workspace-${proj.id}`}
                          onClick={() => setProjectDeletingId(proj.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-all opacity-60 hover:opacity-100 cursor-pointer"
                          title="Remove Project Sync"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Embedded IFrame Canvas Preview Section */}
        <AnimatePresence>
          {activeFigmaPreviewUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '480px' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full relative rounded-sm overflow-hidden border border-[#ff2d51]/25 bg-black/40 mt-4"
            >
              <iframe
                title="Figma Layout Sync Preview Workspace"
                src={activeFigmaPreviewUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
