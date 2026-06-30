import JSZip from 'jszip';

export interface ExtractedZipImage {
  file: File;
  name: string;
  url: string;
}

export const zipImportService = {
  async extractImages(zipFile: File): Promise<ExtractedZipImage[]> {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    
    const extractedImages: ExtractedZipImage[] = [];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const [filename, fileData] of Object.entries(contents.files)) {
      if (fileData.dir) continue;
      
      const lowerFilename = filename.toLowerCase();
      const isValidImage = validExtensions.some(ext => lowerFilename.endsWith(ext));
      
      if (isValidImage && !lowerFilename.includes('__macos') && !lowerFilename.includes('.ds_store')) {
        const blob = await fileData.async('blob');
        const file = new File([blob], filename.split('/').pop() || filename, { type: blob.type });
        const url = URL.createObjectURL(blob);
        
        extractedImages.push({
          file,
          name: filename.split('/').pop() || filename,
          url
        });
      }
    }
    
    return extractedImages;
  }
};
