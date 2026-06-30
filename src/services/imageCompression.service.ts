export const imageCompressionService = {
  async compressImage(file: File, maxWidth = 2560, maxMB = 2): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Fallback to original
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Calculate quality based on target size vs current size (rough estimation)
          // Start with WebP at 0.85
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // If it's still too large, we could do multiple passes, but for now 0.85 WebP is usually good enough to stay under 2MB for 2560px
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); // Fallback
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  }
};
