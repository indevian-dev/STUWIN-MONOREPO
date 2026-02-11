"use client";

import { useState } from 'react';
import { PiFilePdf, PiImage, PiFileText, PiInfo, PiDownload } from 'react-icons/pi';
import { PdfToolPdfUploadWidget } from './PdfToolPdfUploadWidget';
import { PdfToolImagesToPdfModalWidget } from './PdfToolImagesToPdfModalWidget';
import { PdfToolHtmlToPdfModalWidget } from './PdfToolHtmlToPdfModalWidget';

interface PdfToolManagementWidgetProps {
  // No props needed for standalone tool
}

export function PdfToolManagementWidget({}: PdfToolManagementWidgetProps) {
  const [showImagesToPdfModal, setShowImagesToPdfModal] = useState<boolean>(false);
  const [showHtmlToPdfModal, setShowHtmlToPdfModal] = useState<boolean>(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedPdfName, setGeneratedPdfName] = useState<string>('');

  const handlePdfUploadSuccess = (pdfUrl: string, fileName: string): void => {
    setGeneratedPdfUrl(pdfUrl);
    setGeneratedPdfName(fileName);
  };

  const handleImagesToPdfSuccess = (pdfUrl: string, fileName: string): void => {
    setGeneratedPdfUrl(pdfUrl);
    setGeneratedPdfName(fileName);
    setShowImagesToPdfModal(false);
  };

  const handleHtmlToPdfSuccess = (pdfUrl: string, fileName: string): void => {
    setGeneratedPdfUrl(pdfUrl);
    setGeneratedPdfName(fileName);
    setShowHtmlToPdfModal(false);
  };

  const handleDownloadPdf = (): void => {
    if (generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = generatedPdfName || 'generated-pdf.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <PiFilePdf className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Tools
            </h1>
            <p className="text-gray-600 text-lg">
              Create, convert, and manage PDF files with our comprehensive PDF toolkit
            </p>

            {/* Generated PDF Status */}
            {generatedPdfUrl && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <PiFilePdf className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-semibold">PDF Generated Successfully!</p>
                      <p className="text-xs text-emerald-700">
                        {generatedPdfName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <PiDownload className="w-4 h-4" />
                    Download
                  </button>
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
                Choose Your PDF Creation Method
              </h4>
              <p className="text-xs text-blue-700">
                Select from three different methods to create or convert your PDF files.
                All generated PDFs are ready for download and use.
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
              Upload an existing PDF file for processing or modification
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
        <PdfToolPdfUploadWidget
          onUploadSuccess={handlePdfUploadSuccess}
        />
      </div>

      {/* Modals */}
      <PdfToolImagesToPdfModalWidget
        isOpen={showImagesToPdfModal}
        onClose={() => setShowImagesToPdfModal(false)}
        onSuccess={handleImagesToPdfSuccess}
      />

      <PdfToolHtmlToPdfModalWidget
        isOpen={showHtmlToPdfModal}
        onClose={() => setShowHtmlToPdfModal(false)}
        onSuccess={handleHtmlToPdfSuccess}
      />
    </div>
  );
}