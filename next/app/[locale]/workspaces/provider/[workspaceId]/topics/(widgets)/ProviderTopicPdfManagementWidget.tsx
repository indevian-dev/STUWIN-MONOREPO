"use client";

import { useState } from 'react';
import { PiFilePdf, PiImage, PiFileText, PiInfo } from 'react-icons/pi';
import { ProviderTopicPdfUploadWidget } from './ProviderTopicPdfUploadWidget';
import { ProviderImagesToPdfModalWidget } from './ProviderImagesToPdfModalWidget';
import { ProviderHtmlToPdfModalWidget } from './ProviderHtmlToPdfModalWidget';

interface ProviderTopicPdfManagementWidgetProps {
  topicId: number;
  topicName: string;
  existingPdfKey?: string | null;
  existingTotalPages?: number | null;
  onPdfUpdate?: (pdfKey: string, totalPages?: number) => void;
}

export function ProviderTopicPdfManagementWidget({
  topicId,
  topicName,
  existingPdfKey,
  existingTotalPages,
  onPdfUpdate
}: ProviderTopicPdfManagementWidgetProps) {
  const [showImagesToPdfModal, setShowImagesToPdfModal] = useState<boolean>(false);
  const [showHtmlToPdfModal, setShowHtmlToPdfModal] = useState<boolean>(false);
  const [currentPdfKey, setCurrentPdfKey] = useState<string | null>(existingPdfKey || null);
  const [currentTotalPages, setCurrentTotalPages] = useState<number | null>(existingTotalPages || null);

  const handlePdfUploadSuccess = (pdfKey: string, totalPages: number): void => {
    setCurrentPdfKey(pdfKey);
    setCurrentTotalPages(totalPages);
    onPdfUpdate?.(pdfKey, totalPages);
  };

  const handleImagesToPdfSuccess = (pdfKey: string): void => {
    setCurrentPdfKey(pdfKey);
    setShowImagesToPdfModal(false);
    onPdfUpdate?.(pdfKey);
  };

  const handleHtmlToPdfSuccess = (pdfKey: string): void => {
    setCurrentPdfKey(pdfKey);
    setShowHtmlToPdfModal(false);
    onPdfUpdate?.(pdfKey);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <PiFilePdf className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              PDF Content Management
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Upload or create PDF content for: <span className="font-semibold">{topicName}</span>
            </p>

            {/* Current PDF Status */}
            {currentPdfKey && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <PiFilePdf className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">PDF Content Available</p>
                    {currentTotalPages && (
                      <p className="text-xs text-emerald-700">
                        {currentTotalPages} page{currentTotalPages !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <PiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Choose Your Upload Method
              </h4>
              <p className="text-xs text-blue-700">
                Select one of the three methods below to add PDF content to this topic.
                The PDF will be used for AI question generation and student learning materials.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Method 1: Direct PDF Upload */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-400 transition-colors">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <PiFilePdf className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Upload PDF File
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an existing PDF file directly from your computer
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>PDF files only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Up to 50MB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Best for existing documents</span>
            </div>
          </div>
        </div>

        {/* Method 2: Images to PDF */}
        <button
          onClick={() => setShowImagesToPdfModal(true)}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-400 hover:shadow-md transition-all text-left"
        >
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <PiImage className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Convert Images to PDF
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload multiple images and convert them into a single PDF
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>JPEG, PNG, WebP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Multiple images</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Best for scanned content</span>
            </div>
          </div>
        </button>

        {/* Method 3: HTML/Text to PDF */}
        <button
          onClick={() => setShowHtmlToPdfModal(true)}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-emerald-400 hover:shadow-md transition-all text-left"
        >
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <PiFileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Create PDF from Text
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Write or paste content and convert it to PDF format
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Rich text editor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Formatting support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>Best for written content</span>
            </div>
          </div>
        </button>
      </div>

      {/* Method 1: Direct Upload Component */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PiFilePdf className="w-5 h-5 text-red-500" />
          Method 1: Direct PDF Upload
        </h3>
        <ProviderTopicPdfUploadWidget
          topicId={topicId}
          existingPdfKey={currentPdfKey}
          onUploadSuccess={handlePdfUploadSuccess}
        />
      </div>

      {/* Modals */}
      <ProviderImagesToPdfModalWidget
        isOpen={showImagesToPdfModal}
        onClose={() => setShowImagesToPdfModal(false)}
        topicId={topicId}
        onSuccess={handleImagesToPdfSuccess}
      />

      <ProviderHtmlToPdfModalWidget
        isOpen={showHtmlToPdfModal}
        onClose={() => setShowHtmlToPdfModal(false)}
        topicId={topicId}
        onSuccess={handleHtmlToPdfSuccess}
      />
    </div>
  );
}
