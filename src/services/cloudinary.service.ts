export const cloudinaryService = {
  async uploadFromUrl(url: string): Promise<{ url: string; thumbnailUrl: string }> {
    const cloudName = (import.meta as any).env.NEXT_PUBLIC_CLOUD_NAME;
    const uploadPreset = (import.meta as any).env.NEXT_PUBLIC_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing. Please check your environment variables.");
    }

    const formData = new FormData();
    formData.append("file", url);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Failed to upload image from URL to Cloudinary");
    }

    const data = await response.json();
    
    const urlParts = data.secure_url.split('/upload/');
    const thumbnailUrl = `${urlParts[0]}/upload/c_fill,w_600,h_600,q_auto,f_auto/${urlParts[1]}`;

    return {
      url: data.secure_url,
      thumbnailUrl: thumbnailUrl
    };
  },

  async uploadImage(file: File): Promise<{ url: string; thumbnailUrl: string }> {
    const cloudName = (import.meta as any).env.NEXT_PUBLIC_CLOUD_NAME;
    const uploadPreset = (import.meta as any).env.NEXT_PUBLIC_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing. Please check your environment variables.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    
    // Create a thumbnail URL using Cloudinary transformations
    // c_fill, w_600, h_600, q_auto, f_auto
    const urlParts = data.secure_url.split('/upload/');
    const thumbnailUrl = `${urlParts[0]}/upload/c_fill,w_600,h_600,q_auto,f_auto/${urlParts[1]}`;

    return {
      url: data.secure_url,
      thumbnailUrl: thumbnailUrl
    };
  },
  
  async deleteImage(url: string): Promise<void> {
    try {
      await fetch("/api/cloudinary/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (e) {
      console.warn("Failed to delete Cloudinary image", e);
    }
  }
};
