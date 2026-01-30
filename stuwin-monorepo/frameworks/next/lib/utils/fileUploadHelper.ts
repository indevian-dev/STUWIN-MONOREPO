// src/utils/fileUploadUtils.ts

import axios from 'axios';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface UploadFileOptions {
  file: File;
  setProgress: (progress: number) => void;
  presignedUrl: string;
  fileName: string;
}

export async function uploadFile({
  file,
  setProgress,
  presignedUrl,
  fileName
}: UploadFileOptions): Promise<string> {
  try {
    let uploadFile: File;
    let contentType: string;

    // Check if file is an image
    if (file.type.startsWith('image/')) {
      try {
        uploadFile = await convertToWebP(file);
        if (uploadFile.type !== 'image/webp') {
          throw new Error('Failed to convert image to WebP');
        }
        contentType = 'image/webp';
      } catch (conversionError) {
        throw new Error('Failed to convert image to WebP');
      }
    } 
    // Check if file is a video
    else if (file.type.startsWith('video/')) {
      // For videos, upload as-is without conversion
      uploadFile = file;
      contentType = file.type;
    } 
    else {
      throw new Error('Unsupported file type. Only images and videos are allowed.');
    }

    if (!presignedUrl) {
      throw new Error('Invalid response from server: missing uploadURL');
    }

    // Step 2: Upload file using presigned URL
    await new Promise<void>((resolve, reject) => {
      axios.put(presignedUrl, uploadFile, {
        headers: {
          'Content-Type': contentType,
          'x-amz-acl': 'public-read'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && progressEvent.total) {
            const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(percentComplete); // Update progress
          }
        },
      })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          ConsoleLogger.error('Error uploading file:', error);
          reject(new Error(`Failed to upload ${uploadFile.name}. Error: ${error.message}`));
        });
    });

    return `${fileName}`;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    ConsoleLogger.error('Error in uploadFile:', error);
    throw new Error(err.message || `Failed to upload ${file.name}`);
  }
}

// Keep the original implementation as a fallback
const convertToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' });
            resolve(webpFile);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        }, 'image/webp', 0.8);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

