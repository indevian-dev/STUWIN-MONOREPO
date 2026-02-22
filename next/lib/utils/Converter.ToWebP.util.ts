/**
 * Client-side image-to-WebP conversion using Canvas API
 * Usage: const webpBlob = await convertToWebP(file, { quality: 0.8, maxWidth: 1200 });
 */

interface ConvertOptions {
    /** WebP quality 0-1, default 0.8 */
    quality?: number;
    /** Max width in pixels, default 1200 */
    maxWidth?: number;
    /** Max height in pixels, default 800 */
    maxHeight?: number;
}

/**
 * Convert an image File/Blob to WebP format using Canvas API.
 * Also resizes if the image exceeds maxWidth/maxHeight.
 */
export async function convertToWebP(
    file: File | Blob,
    options: ConvertOptions = {}
): Promise<Blob> {
    const { quality = 0.8, maxWidth = 1200, maxHeight = 800 } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // Scale down if needed, preserving aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas 2D context not available"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("WebP conversion failed"));
                    }
                },
                "image/webp",
                quality
            );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
    });
}
