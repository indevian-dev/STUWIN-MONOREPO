"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { PiX, PiImage, PiPlus, PiFilePdf, PiArrowUp, PiArrowDown, PiTrash, PiDownload } from 'react-icons/pi';
import jsPDF from 'jspdf';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface ProviderImagesToPdfModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  topicId?: number;
  onSuccess?: (pdfKey: string) => void;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export function ProviderImagesToPdfModalWidget({
  isOpen,
  onClose,
  topicId,
  onSuccess
}: ProviderImagesToPdfModalWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [images, setImages] = useState<ImageFile[]>([]);
  const [converting, setConverting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB per image

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!validImageTypes.includes(file.type)) {
        setError(`${file.name} is not a valid image format (JPEG, PNG, WebP only)`);
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setError(`${file.name} exceeds 10MB size limit`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageFile: ImageFile = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string
        };
        setImages((prev) => [...prev, imageFile]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string): void => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleMoveUp = (index: number): void => {
    if (index === 0) return;
    setImages((prev) => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  const handleMoveDown = (index: number): void => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

  const convertImagesToPdf = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);

        for (let i = 0; i < images.length; i++) {
          const image = images[i];

          // Load image to get dimensions
          const img = new Image();
          img.src = image.preview;

          await new Promise<void>((imgResolve) => {
            img.onload = () => {
              // Calculate aspect ratio
              const aspectRatio = img.width / img.height;
              let imgWidth = maxWidth;
              let imgHeight = imgWidth / aspectRatio;

              // If height exceeds page, scale by height instead
              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * aspectRatio;
              }

              // Center image on page
              const xPos = (pageWidth - imgWidth) / 2;
              const yPos = (pageHeight - imgHeight) / 2;

              // Add new page for each image except first
              if (i > 0) {
                pdf.addPage();
              }

              // Add image to PDF
              pdf.addImage(image.preview, 'JPEG', xPos, yPos, imgWidth, imgHeight);

              // Update progress
              setProgress(Math.round(((i + 1) / images.length) * 50));

              imgResolve();
            };
          });
        }

        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDownload = async (): Promise<void> => {
    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      const pdfBlob = await convertImagesToPdf();

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError('Failed to convert images to PDF');
    } finally {
      setConverting(false);
    }
  };

  const handleUploadToTopic = async (): Promise<void> => {
    if (!topicId) {
      setError('No topic ID provided');
      return;
    }

    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setConverting(true);
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Convert images to PDF
      const pdfBlob = await convertImagesToPdf();

      // Step 2: Get presigned URL
      const fileName = `images-converted.pdf`; // Simple name, backend adds unique timestamp
      const presignedResponse = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/provider/${workspaceId}/topics/upload-pdf`,
        body: {
          topicId,
          fileName,
          fileType: 'application/pdf'
        }
      });

      if (!presignedResponse.data?.presignedUrl) {
        throw new Error('Failed to get upload URL');
      }

      const { presignedUrl, generatedFileName } = presignedResponse.data;

      setProgress(60);

      // Step 3: Upload to S3
      await axios.put(presignedUrl, pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'x-amz-acl': 'public-read'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && progressEvent.total) {
            const uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 30);
            setProgress(60 + uploadProgress);
          }
        }
      });

      setProgress(95);

      // Step 4: Update topic with PDF key (Store Filename Only)
      await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/topics/update/${topicId}`,
        body: {
          pdf_s3_key: generatedFileName,
          total_pdf_pages: images.length
        }
      });

      setProgress(100);

      // Notify parent
      onSuccess?.(generatedFileName);

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload PDF';
      setError(errorMessage);
    } finally {
      setConverting(false);
      setUploading(false);
    }
  };

  const handleClose = (): void => {
    if (!converting && !uploading) {
      setImages([]);
      setError(null);
      setProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Convert Images to PDF</h2>
          <button
            onClick={handleClose}
            disabled={converting || uploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <PiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Area */}
          <div className="mb-6">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center">
                <PiImage className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-semibold">Click to upload images</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">JPEG, PNG, WebP (MAX 10MB per image)</p>
              </div>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                disabled={converting || uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {(converting || uploading) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">
                  {uploading ? 'Uploading PDF...' : 'Converting images...'}
                </span>
                <span className="text-sm font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Images List */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Selected Images ({images.length})
                </h3>
                <p className="text-xs text-gray-500">Drag to reorder</p>
              </div>

              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* Preview */}
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-16 h-16 object-cover rounded border border-gray-300"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Page {index + 1} • {(image.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || converting || uploading}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <PiArrowUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === images.length - 1 || converting || uploading}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <PiArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      disabled={converting || uploading}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove"
                    >
                      <PiTrash className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="text-center py-12">
              <PiImage className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No images selected</p>
              <p className="text-gray-400 text-xs mt-1">Add images to create a PDF</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={converting || uploading}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-gray-700 font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={images.length === 0 || converting || uploading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <PiDownload className="w-5 h-5" />
            Download PDF
          </button>
          {topicId && (
            <button
              onClick={handleUploadToTopic}
              disabled={images.length === 0 || converting || uploading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <PiFilePdf className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload to Topic'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
