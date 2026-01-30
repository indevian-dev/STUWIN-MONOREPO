"use client";

import { useState, useRef } from 'react';
import { PiX, PiFilePdf, PiDownload, PiFileText } from 'react-icons/pi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/app/[locale]/workspaces/staff/[workspaceId]/ui/editor'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

interface PdfToolHtmlToPdfModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pdfUrl: string, fileName: string) => void;
}

export function PdfToolHtmlToPdfModalWidget({
  isOpen,
  onClose,
  onSuccess
}: PdfToolHtmlToPdfModalWidgetProps) {
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [converting, setConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleEditorChange = (htmlContent: string): void => {
    setContent(htmlContent);
  };

  const convertHtmlToPdf = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!previewRef.current) {
          reject(new Error('Preview element not found'));
          return;
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

        // Remove temporary container
        document.body.removeChild(tempContainer);

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

        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleConvert = async (): Promise<void> => {
    if (!content || content.trim() === '') {
      setError('Please add some content');
      return;
    }

    setConverting(true);
    setError(null);
    setProgress(0);
    setGeneratedPdfUrl(null);

    try {
      const pdfBlob = await convertHtmlToPdf();

      // Create blob URL for download
      const url = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(url);

      const fileName = `${title || 'document'}-${Date.now()}.pdf`;

      // Notify parent component
      onSuccess?.(url, fileName);

      setProgress(100);
    } catch (err) {
      setError('Failed to convert content to PDF');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = (): void => {
    if (generatedPdfUrl) {
      const a = document.createElement('a');
      a.href = generatedPdfUrl;
      a.download = `${title || 'document'}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleClose = (): void => {
    if (!converting) {
      setContent('');
      setTitle('');
      setError(null);
      setProgress(0);
      setGeneratedPdfUrl(null);
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
            <h2 className="text-2xl font-bold text-gray-900">Convert Text to PDF</h2>
            <p className="text-sm text-gray-500 mt-1">Create PDF from rich text content</p>
          </div>
          <button
            onClick={handleClose}
            disabled={converting}
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
              disabled={converting}
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

          {/* Success Message */}
          {generatedPdfUrl && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiFilePdf className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">
                    PDF Generated Successfully!
                  </span>
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <PiDownload className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {converting && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Converting to PDF...</span>
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
            disabled={converting}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-gray-700 font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={!content || converting || !!generatedPdfUrl}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <PiFilePdf className="w-5 h-5" />
            {converting ? 'Converting...' : generatedPdfUrl ? 'Converted' : 'Convert to PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}