"use client";

import { useState, useRef } from 'react';
import { PiX, PiFilePdf, PiDownload, PiFileText } from 'react-icons/pi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Editor from '@/lib/components/Editor';

interface ProviderHtmlToPdfModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  topicId?: number;
  onSuccess?: (pdfKey: string) => void;
}

export function ProviderHtmlToPdfModalWidget({
  isOpen,
  onClose,
  topicId,
  onSuccess
}: ProviderHtmlToPdfModalWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [converting, setConverting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleEditorChange = (htmlContent: string): void => {
    setContent(htmlContent);
  };

  const convertHtmlToPdf = async (): Promise<Blob> => {
    if (!previewRef.current) {
      throw new Error('Preview element not found');
    }

    setProgress(10);

    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.padding = '20mm';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '12pt';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.color = '#000000';

    try {
      // Add title if provided
      if (title) {
        const titleElement = document.createElement('h1');
        titleElement.textContent = title;
        titleElement.style.fontSize = '24pt';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.marginBottom = '20px';
        titleElement.style.color = '#000000';
        tempContainer.appendChild(titleElement);
      }

      // Add content
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = content;

      // Style content elements
      contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
        (heading as HTMLElement).style.color = '#000000';
        (heading as HTMLElement).style.marginTop = '16px';
        (heading as HTMLElement).style.marginBottom = '8px';
      });

      contentDiv.querySelectorAll('p').forEach((p) => {
        (p as HTMLElement).style.marginBottom = '12px';
        (p as HTMLElement).style.color = '#000000';
      });

      contentDiv.querySelectorAll('ul, ol').forEach((list) => {
        (list as HTMLElement).style.marginLeft = '20px';
        (list as HTMLElement).style.marginBottom = '12px';
      });

      contentDiv.querySelectorAll('img').forEach((img) => {
        (img as HTMLElement).style.maxWidth = '100%';
        (img as HTMLElement).style.height = 'auto';
        (img as HTMLElement).style.display = 'block';
        (img as HTMLElement).style.margin = '12px 0';
      });

      contentDiv.querySelectorAll('pre, code').forEach((code) => {
        (code as HTMLElement).style.backgroundColor = '#f5f5f5';
        (code as HTMLElement).style.padding = '8px';
        (code as HTMLElement).style.borderRadius = '4px';
        (code as HTMLElement).style.fontFamily = 'monospace';
      });

      tempContainer.appendChild(contentDiv);
      document.body.appendChild(tempContainer);

      setProgress(30);

      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      setProgress(60);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      let imgWidth = pdfWidth;
      let imgHeight = imgWidth / ratio;

      // Handle multiple pages if content is too long
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      setProgress(80);

      return pdf.output('blob');
    } finally {
      // Always remove temporary container
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (!content || content.trim() === '') {
      setError('Please add some content');
      return;
    }

    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      const pdfBlob = await convertHtmlToPdf();

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'document'}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError('Failed to convert content to PDF');
    } finally {
      setConverting(false);
    }
  };

  const handleUploadToTopic = async (): Promise<void> => {
    if (!topicId) {
      setError('No topic ID provided');
      return;
    }

    if (!content || content.trim() === '') {
      setError('Please add some content');
      return;
    }

    setConverting(true);
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Convert to PDF
      const pdfBlob = await convertHtmlToPdf();

      setProgress(85);

      // Step 2: Get presigned URL
      const fileName = `topic-${topicId}-content-${Date.now()}.pdf`;
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

      setProgress(90);

      // Step 3: Upload to S3
      await axios.put(presignedUrl, pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'x-amz-acl': 'public-read'
        }
      });

      setProgress(95);

      // Step 4: Update topic with PDF key
      // Estimate pages (rough calculation based on content length)
      const estimatedPages = Math.max(1, Math.ceil(content.length / 3000));

      await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/topics/update/${topicId}`,
        body: {
          pdf_s3_key: pdfKey,
          total_pdf_pages: estimatedPages
        }
      });

      setProgress(100);

      // Notify parent
      onSuccess?.(pdfKey);

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
      setContent('');
      setTitle('');
      setError(null);
      setProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl shadow-xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Convert HTML/Text to PDF</h2>
            <p className="text-sm text-gray-500 mt-1">Create PDF from rich text content</p>
          </div>
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
          {/* Title Input */}
          <div className="mb-4">
            <label htmlFor="pdf-title" className="block text-sm font-medium text-gray-700 mb-2">
              Document Title (Optional)
            </label>
            <input
              id="pdf-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={converting || uploading}
              placeholder="Enter document title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          {/* Editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <Editor
                ref={editorRef}
                onChange={handleEditorChange}
                placeholder="Start writing your content here..."
                height="400px"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use the editor to format your text, add images, lists, and more
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {(converting || uploading) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">
                  {uploading ? 'Uploading PDF...' : 'Converting to PDF...'}
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

          {/* Hidden preview container */}
          <div ref={previewRef} style={{ display: 'none' }} />

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <PiFileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Tips for best results:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Use headings to structure your content</li>
                  <li>• Keep images optimized and not too large</li>
                  <li>• Avoid excessive formatting that may not convert well</li>
                  <li>• Preview the content before converting</li>
                </ul>
              </div>
            </div>
          </div>
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
            disabled={!content || converting || uploading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <PiDownload className="w-5 h-5" />
            Download PDF
          </button>
          {topicId && (
            <button
              onClick={handleUploadToTopic}
              disabled={!content || converting || uploading}
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
