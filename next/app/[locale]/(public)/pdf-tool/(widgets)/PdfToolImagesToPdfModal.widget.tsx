"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { PiX, PiImage, PiPlus, PiFilePdf, PiArrowUp, PiArrowDown, PiTrash, PiDownload } from 'react-icons/pi';
import jsPDF from 'jspdf';

interface PdfToolImagesToPdfModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pdfUrl: string, fileName: string) => void;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export function PdfToolImagesToPdfModalWidget({
  isOpen,
  onClose,
  onSuccess
}: PdfToolImagesToPdfModalWidgetProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [converting, setConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
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
              setProgress(Math.round(((i + 1) / images.length) * 100));

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

  const handleConvert = async (): Promise<void> => {
    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setConverting(true);
    setError(null);
    setProgress(0);
    setGeneratedPdfUrl(null);

    try {
      const pdfBlob = await convertImagesToPdf();

      // Create blob URL for download
      const url = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(url);

      const fileName = `images-to-pdf-${Date.now()}.pdf`;

      // Notify parent component
      onSuccess?.(url, fileName);

      setProgress(100);
    } catch (err) {
      setError('Failed to convert images to PDF');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = (): void => {
    if (generatedPdfUrl) {
      const a = document.createElement('a');
      a.href = generatedPdfUrl;
      a.download = `images-to-pdf-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleClose = (): void => {
    if (!converting) {
      setImages([]);
      setError(null);
      setProgress(0);
      setGeneratedPdfUrl(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-app w-full max-w-4xl shadow-xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Convert Images to PDF</h2>
          <button
            onClick={handleClose}
            disabled={converting}
            className="p-2 hover:bg-gray-100 rounded-app transition-colors disabled:opacity-50"
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
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-app cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <PiPlus className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Click to add images</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">JPEG, PNG, WebP (max 10MB each)</p>
              </div>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                disabled={converting}
                className="hidden"
              />
            </label>
          </div>

          {/* Images List */}
          {images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Images ({images.length})
              </h3>
              <div className="space-y-3">
                {images.map((image, index) => (
                  <div key={image.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-app border border-gray-200">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(image.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || converting}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        title="Move up"
                      >
                        <PiArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === images.length - 1 || converting}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        title="Move down"
                      >
                        <PiArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(image.id)}
                        disabled={converting}
                        className="p-1 hover:bg-red-100 text-red-600 rounded disabled:opacity-50"
                        title="Remove"
                      >
                        <PiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {converting && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Converting images to PDF...</span>
                <span className="text-sm font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-app-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-app-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {generatedPdfUrl && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-app">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiFilePdf className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">
                    PDF Generated Successfully!
                  </span>
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-app text-sm font-medium transition-colors"
                >
                  <PiDownload className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-app">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={converting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-app font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={images.length === 0 || converting || !!generatedPdfUrl}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-app font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <PiFilePdf className="w-5 h-5" />
              {converting ? 'Converting...' : generatedPdfUrl ? 'Converted' : 'Convert to PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}