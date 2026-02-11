// src/lib/helpers/multipartUploadHelper.ts
// Multipart upload for large video files with parallel chunk uploading

import axios from 'axios';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
// 5MB chunk size (S3 minimum)
const CHUNK_SIZE = 5 * 1024 * 1024;
// Number of concurrent chunk uploads (more chunks = more parallelism)
const CONCURRENT_UPLOADS = 6;

interface ChunkInfo {
  partNumber: number;
  start: number;
  end: number;
  blob: Blob;
}

interface UploadChunkOptions {
  chunk: ChunkInfo;
  uploadId: string;
  s3Key: string;
  storagePrefix: string;
  fetchHelper: (options: any) => Promise<any>;
  onChunkProgress?: (loaded: number) => void;
  retries?: number;
}

interface UploadedPart {
  PartNumber: number;
  ETag: string;
}

interface UploadFileMultipartOptions {
  file: File;
  storagePrefix: string;
  onProgress?: (percentage: number) => void;
  fetchHelper: (options: any) => Promise<any>;
}

/**
 * Upload a large file using S3 multipart upload
 * Significantly faster for files > 50MB due to parallel chunk uploads
 */
export async function uploadFileMultipart({
  file,
  storagePrefix,
  onProgress,
  fetchHelper,
}: UploadFileMultipartOptions): Promise<string> {
  let uploadId: string | null = null;
  let s3Key: string | null = null;
  let fileName: string | null = null;

  try {
    // Step 1: Initiate multipart upload
    const initResponse = await fetchHelper({
      method: 'POST',
      url: `/api/workspaces/dashboard/cards/media/video/${storagePrefix}/multipart/initiate`,
    });

    if (!initResponse.data?.uploadId || !initResponse.data?.key) {
      throw new Error('Failed to initiate multipart upload');
    }

    uploadId = initResponse.data.uploadId;
    s3Key = initResponse.data.key;
    fileName = initResponse.data.fileName;

    ConsoleLogger.log('📦 Multipart upload initiated:', { uploadId, s3Key, fileName });

    // Step 2: Split file into chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const chunks: ChunkInfo[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push({
        partNumber: i + 1,
        start,
        end,
        blob: file.slice(start, end),
      });
    }

    ConsoleLogger.log(`📦 File split into ${chunks.length} chunks`);

    // Step 3: Upload chunks in parallel with concurrency limit
    const uploadedParts: UploadedPart[] = [];
    const chunkProgress = new Array(chunks.length).fill(0);

    const updateTotalProgress = () => {
      const totalLoaded = chunkProgress.reduce((sum, p) => sum + p, 0);
      const percentage = (totalLoaded / file.size) * 100;
      onProgress?.(percentage);
    };

    // Process chunks in batches for parallel upload
    for (let i = 0; i < chunks.length; i += CONCURRENT_UPLOADS) {
      const batch = chunks.slice(i, i + CONCURRENT_UPLOADS);

      const batchResults = await Promise.all(
        batch.map(async (chunk) => {
          return uploadChunk({
            chunk,
            uploadId: uploadId!,
            s3Key: s3Key!,
            storagePrefix,
            fetchHelper,
            onChunkProgress: (loaded) => {
              chunkProgress[chunk.partNumber - 1] = loaded;
              updateTotalProgress();
            },
          });
        })
      );

      uploadedParts.push(...batchResults);
    }

    ConsoleLogger.log('✅ All chunks uploaded:', uploadedParts);

    // Step 4: Complete multipart upload
    const completeResponse = await fetchHelper({
      method: 'POST',
      url: `/api/workspaces/dashboard/cards/media/video/${storagePrefix}/multipart/complete`,
      body: {
        uploadId,
        key: s3Key,
        parts: uploadedParts,
      },
    });

    if (!completeResponse.data?.success) {
      throw new Error('Failed to complete multipart upload');
    }

    ConsoleLogger.log('🎉 Multipart upload completed successfully');

    return fileName!;

  } catch (error) {
    ConsoleLogger.error('💥 Multipart upload error:', error);

    // Attempt to abort the upload if it was started
    if (uploadId && s3Key) {
      try {
        await fetchHelper({
          method: 'POST',
          url: `/api/workspaces/dashboard/cards/media/video/${storagePrefix}/multipart/abort`,
          body: { uploadId, key: s3Key },
        });
        ConsoleLogger.log('🗑️ Multipart upload aborted');
      } catch (abortError) {
        ConsoleLogger.error('Failed to abort multipart upload:', abortError);
      }
    }

    throw error;
  }
}

/**
 * Upload a single chunk with retry logic
 */
async function uploadChunk({
  chunk,
  uploadId,
  s3Key,
  storagePrefix,
  fetchHelper,
  onChunkProgress,
  retries = 3,
}: UploadChunkOptions): Promise<UploadedPart> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Get presigned URL for this part
      const presignResponse = await fetchHelper({
        method: 'POST',
        url: `/api/workspaces/dashboard/cards/media/video/${storagePrefix}/multipart/presign-part`,
        body: {
          uploadId,
          key: s3Key,
          partNumber: chunk.partNumber,
        },
      });

      if (!presignResponse.data?.presignedUrl) {
        throw new Error(`Failed to get presigned URL for part ${chunk.partNumber}`);
      }

      // Upload the chunk
      const response = await axios.put(presignResponse.data.presignedUrl, chunk.blob, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            onChunkProgress?.(progressEvent.loaded);
          }
        },
      });

      // Get ETag from response headers (required for completing multipart upload)
      const etag = response.headers?.etag || response.headers?.['etag'];
      if (!etag) {
        throw new Error(`No ETag received for part ${chunk.partNumber}`);
      }

      ConsoleLogger.log(`✅ Part ${chunk.partNumber} uploaded, ETag: ${etag}`);

      return {
        PartNumber: chunk.partNumber,
        ETag: etag.replace(/"/g, ''), // Remove quotes from ETag
      };

    } catch (error) {
      ConsoleLogger.error(`❌ Part ${chunk.partNumber} failed (attempt ${attempt}/${retries}):`, error);

      if (attempt === retries) {
        throw new Error(`Failed to upload part ${chunk.partNumber} after ${retries} attempts`);
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Upload chunk failed after all retries');
}

/**
 * Determine if file should use multipart upload
 * For files > 50MB, multipart is significantly faster
 */
export function shouldUseMultipart(file: File): boolean {
  const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
  return file.size > MULTIPART_THRESHOLD;
}

