"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { PiUpload, PiFilePdf, PiX, PiCheck } from 'react-icons/pi';

interface ProviderTopicPdfUploadWidgetProps {
  topicId: number;
  existingPdfKey?: string | null;
  onUploadSuccess?: (pdfKey: string, totalPages: number) => void;
}

export function ProviderTopicPdfUploadWidget({
  topicId,
  existingPdfKey,
  onUploadSuccess
}: ProviderTopicPdfUploadWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
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
      // Step 1: Get presigned URL and PDF page count
      const fileName = `topic-${topicId}-${Date.now()}.pdf`;

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

      const { presignedUrl, pdfKey } = presignedResponse.data;

      // Step 2: Upload file to S3 using presigned URL
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          'Content-Type': 'application/pdf',
          'x-amz-acl': 'public-read'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && progressEvent.total) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percentComplete);
          }
        }
      });

      // Step 3: Get PDF metadata (page count)
      const pdfMetadata = await getPdfPageCount(selectedFile);

      // Step 4: Update topic with PDF information
      await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/topics/update/${topicId}`,
        body: {
          pdf_s3_key: pdfKey,
          total_pdf_pages: pdfMetadata.pageCount
        }
      });

      setSuccess(true);
      setSelectedFile(null);
      setUploadProgress(0);

      // Notify parent component
      onUploadSuccess?.(pdfKey, pdfMetadata.pageCount);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload PDF';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getPdfPageCount = async (file: File): Promise<{ pageCount: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

          // Simple PDF page count extraction from PDF structure
          // Count occurrences of "/Type /Page" in the PDF
          const text = new TextDecoder('latin1').decode(typedArray);
          const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
          const pageCount = pageMatches ? pageMatches.length : 1;

          resolve({ pageCount });
        } catch (error) {
          reject(new Error('Failed to read PDF metadata'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleClearFile = (): void => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PDF Content Upload</h3>
        {existingPdfKey && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <PiCheck className="w-4 h-4" />
            PDF Uploaded
          </span>
        )}
      </div>

      {/* File Input Area */}
      <div className="mb-4">
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
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
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
            <span className="text-sm text-gray-700">Uploading...</span>
            <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <PiCheck className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-700">PDF uploaded successfully!</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <PiUpload className="w-5 h-5" />
        {uploading ? 'Uploading...' : 'Upload PDF'}
      </button>

      {/* Info Text */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Upload a PDF file containing the topic content. The PDF will be used for AI question generation.
      </p>
    </div>
  );
}
