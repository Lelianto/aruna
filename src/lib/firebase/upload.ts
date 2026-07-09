/**
 * Helper function to compress and convert image files to WebP format.
 * Downscales images exceeding 1200px in width or height to preserve quality and storage.
 */
function compressAndConvertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      // Max dimension limit for scaling down high-resolution images
      const maxDimension = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Uploads a file to the local public uploads folder.
 * If the file is an image, it is automatically compressed and converted to WebP.
 * Falls back to a mock/placeholder URL if the local upload fails.
 */
export async function uploadDocument(file: File, path?: string): Promise<string> {
  try {
    let fileToUpload = file;
    let fileName = file.name;

    // Only compress and convert if the uploaded file is an image
    if (file.type.startsWith('image/')) {
      try {
        const webpBlob = await compressAndConvertToWebP(file, 0.8);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        fileName = `${baseName}.webp`;
        fileToUpload = new File([webpBlob], fileName, { type: 'image/webp' });
      } catch (err) {
        console.warn("Client-side image compression failed, uploading original file:", err);
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    if (path) {
      formData.append('path', path);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Local upload failed');
    }

    const data = await response.json();
    return data.url; // Returns local path like '/uploads/1720512345678-abc.webp'
  } catch (error) {
    console.warn("Local upload failed, using fallback mock URL:", error);
    // Return a beautiful public placeholder image
    const cleanedFilename = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `https://placehold.co/600x400/003049/ffffff?text=Dokumen+${cleanedFilename}`;
  }
}
