import React, { useState, useRef } from 'react';
import { Upload, Trash2, ShieldAlert, Sparkles, User } from 'lucide-react';
import { compressImage } from '../utils/image';

interface ProfileAvatarProps {
  currentAvatarUrl?: string;
  onAvatarChanged: (url: string) => void;
  theme: 'light' | 'dark';
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  currentAvatarUrl,
  onAvatarChanged,
  theme,
}) => {
  const [avatar, setAvatar] = useState<string | undefined>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudinaryCloudName = ((import.meta as any).env.NEXT_PUBLIC_CLOUD_NAME || '').replace(/^["']|["']$/g, '').trim();
  const cloudinaryUploadPreset = ((import.meta as any).env.NEXT_PUBLIC_UPLOAD_PRESET || '').replace(/^["']|["']$/g, '').trim();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Unsupported file format. Please upload a valid image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 1. Compress client-side to WebP (under 2MB, limit width to 1200px)
      const compressedFile = await compressImage(file, 1000, 0.8);
      
      // Create local preview immediately
      const localUrl = URL.createObjectURL(compressedFile);
      setAvatar(localUrl);

      // 2. Perform the upload (Cloudinary)
      if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
        throw new Error('Cloudinary integration is not configured. Please add NEXT_PUBLIC_CLOUD_NAME and NEXT_PUBLIC_UPLOAD_PRESET to your environment variables in AI Studio settings.');
      }

      const formData = new FormData();
      formData.append('file', compressedFile);
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
        const cloudError = errData?.error?.message || 'Unknown rejection reason';
        throw new Error(`Cloudinary server rejected upload: ${cloudError}`);
      }

      const data = await response.json();
      const uploadedUrl = data.secure_url;
      onAvatarChanged(uploadedUrl);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeAvatar = () => {
    setAvatar(undefined);
    setError(null);
    onAvatarChanged('');
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Target Preview Box */}
      <div 
        id="avatar-upload-container"
        className="relative group flex items-center justify-center"
      >
        <div 
          className={`w-28 h-28 rounded-full border-[2px] overflow-hidden flex items-center justify-center transition-all duration-300 bg-accent ${
            dragActive 
              ? 'border-accent scale-105 shadow-lg shadow-accent/10' 
              : theme === 'dark'
                ? 'border-divider-dark hover:border-accent'
                : 'border-divider-light hover:border-accent'
          }`}
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
        >
          {avatar ? (
            <img 
              src={avatar} 
              alt="Avatar Preview" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none"
            />
          ) : (
            <img 
              src={theme === 'dark' ? '/avatar-d.svg' : '/avatar-l.svg'}
              alt="Default Avatar"
              className="w-full h-full object-cover select-none"
            />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-white">
              <div className="w-5 h-5 border-2 border-t-transparent border-accent rounded-full animate-spin" />
              <span className="text-[13px] font-mono tracking-tight text-accent">uploading</span>
            </div>
          )}
        </div>

        {avatar && !uploading && (
          <button
            id="remove-avatar-btn"
            type="button"
            onClick={removeAvatar}
            className="absolute -bottom-1.5 -right-1.5 p-2 bg-accent hover:bg-accent-hover text-white rounded-full border border-divider-light dark:border-divider-dark shadow-lg transition-transform active:scale-95 flex items-center justify-center"
            title="Remove Avatar"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Upload trigger buttons */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs text-center text-[#171717] dark:text-white">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
          id="avatar-hidden-file-input"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`h-11 px-5 rounded-[20px] font-sans font-bold text-[14px] tracking-widest flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            theme === 'dark'
              ? 'border-divider-dark text-white hover:bg-white/5 hover:border-white/30'
              : 'border-divider-light text-[#171717] hover:bg-black/5 hover:border-accent/30'
          }`}
        >
          <Upload size={12} className="text-accent" />
          Choose Avatar
        </button>

        <p className="text-[14px] font-mono tracking-tight opacity-50 mt-1">
          Drag & Drop or Click to Upload. Max 2MB (WebP optimized).
        </p>

        {error && (
          <div className="flex flex-col gap-2 mt-2 w-full text-left">
            <div className="flex items-center gap-1.5 text-[13px] font-space font-semibold tracking-tight text-accent">
              <ShieldAlert size={12} className="shrink-0" />
              <span>{error}</span>
            </div>

            {/* Cloudinary Preset Troubleshooting Guide */}
            {(error.toLowerCase().includes('preset') || error.toLowerCase().includes('cloudinary')) && (
              <div className={`p-3.5 border rounded-[20px] text-[9.5px] leading-relaxed font-space mt-1 ${
                theme === 'dark'
                  ? 'bg-red-500/5 border-red-500/15 text-red-200/90'
                  : 'bg-red-50/50 border-red-500/15 text-red-900/90'
              }`}>
                <p className="font-black tracking-tight text-accent mb-1.5">
                  🛠️ How to Create an Unsigned Upload Preset:
                </p>
                <ol className="list-decimal list-inside space-y-1 opacity-90">
                  <li>Log in to your <strong>Cloudinary console</strong>.</li>
                  <li>Click the ⚙️ <strong>Settings</strong> icon in the bottom-left corner.</li>
                  <li>Under Settings, select the <strong>Upload</strong> menu.</li>
                  <li>Scroll down to the <strong>Upload presets</strong> section.</li>
                  <li>Click <strong>Add upload preset</strong>.</li>
                  <li>Change the <strong>Signing Mode</strong> from <em>Signed</em> to <strong>Unsigned</strong> (This is required!).</li>
                  <li>Copy the newly generated preset name (e.g., random characters).</li>
                  <li>Open your <code>.env</code> file and update <code>NEXT_PUBLIC_UPLOAD_PRESET</code> with it!</li>
                </ol>
                <div className="mt-2 pt-2 border-t border-accent/10 text-[8.5px] font-mono uppercase opacity-75">
                  Current config: Cloud name = <strong>{cloudinaryCloudName || 'None'}</strong>, Preset = <strong>{cloudinaryUploadPreset || 'None'}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
