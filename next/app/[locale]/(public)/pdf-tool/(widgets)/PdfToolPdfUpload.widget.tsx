"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { PiUpload, PiFilePdf, PiX, PiCheck, PiDownload } from 'react-icons/pi';

interface PdfToolPdfUploadWidgetProps {
  onUploadSuccess?: (pdfUrl: string, fileName: string) => void;
}

export function PdfToolPdfUploadWidget({
  onUploadSuccess
}: PdfToolPdfUploadWidgetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setUploadedPdfUrl(null);
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // For a public PDF tool, we'll create a blob URL for immediate download
      // In a real implementation, you might want to upload to a temporary storage
      const pdfUrl = URL.createObjectURL(selectedFile);

      setSuccess(true);
      setUploadedPdfUrl(pdfUrl);
      setUploadProgress(100);

      // Notify parent component
      onUploadSuccess?.(pdfUrl, selectedFile.name);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = (): void => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    setUploadedPdfUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadPdf = (): void => {
    if (uploadedPdfUrl && selectedFile) {
      const link = document.createElement('a');
      link.href = uploadedPdfUrl;
      link.download = selectedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-app p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PDF File Upload</h3>
        {uploadedPdfUrl && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <PiCheck className="w-4 h-4" />
            PDF Ready
          </span>
        )}
      </div>

      {/* File Input Area */}
      <div className="mb-4">
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-app cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <PiFilePdf className="w-12 h-12 text-gray-400 mb-3" />
            <p className="mb-2 text-sm text-gray-700">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF only (MAX 50MB)</p>
          </div>
          <input
            ref={fileInputRef}
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-4 p-4 bg-gray-50 rounded-app border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <PiFilePdf className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {!uploading && (
              <button
                onClick={handleClearFile}
                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                title="Remove file"
              >
                <PiX className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Processing...</span>
            <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-app-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-app-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-app">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && uploadedPdfUrl && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-app flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiCheck className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-700">PDF processed successfully!</p>
          </div>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-colors"
          >
            <PiDownload className="w-4 h-4" />
            Download
          </button>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-app font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <PiUpload className="w-5 h-5" />
        {uploading ? 'Processing...' : 'Process PDF'}
      </button>

      {/* Info Text */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Upload a PDF file to process it. The file will be made available for download.
      </p>
    </div>
  );
}