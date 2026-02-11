"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { apiCallForSpaHelper } from "@/lib/utils/http/SpaApiClient";
import type { SubjectPdf, Subject } from "./ProviderSubjectDetailWidget";

interface SubjectMediaLibrarySectionProps {
  workspaceId: string;
  subjectId: string;
  subject: Subject;
  pdfs: SubjectPdf[];
  onUpload: () => Promise<void>;
  onToggle: (pdfId: string, isActive: boolean) => Promise<void>;
  onDelete: (pdfId: string) => Promise<void>;
}

type UploadMode = "simple" | null;

export function SubjectMediaLibrarySection({
  workspaceId,
  subjectId,
  subject,
  pdfs,
  onUpload,
  onToggle,
  onDelete,
}: SubjectMediaLibrarySectionProps) {
  const t = useTranslations("SubjectMediaLibrarySection");
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<SubjectPdf | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfLanguage, setPdfLanguage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (mode: UploadMode) => {
    setUploadMode(mode);
    setError(null);
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setError(t("invalidPdfFile"));
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t("fileTooLarge"));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSimplePdfUpload = async () => {
    if (!selectedFile) {
      setError(t("noFileSelected"));
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Step 1: Get presigned URL
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/upload`,
        method: "POST",
        body: {
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to get upload URL");
      }

      const { presignedUrl, generatedFileName } = response.data;

      // Step 2: Upload file to S3 (using axios for progress tracking)
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          "Content-Type": "application/pdf",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && progressEvent.total) {
            const percentComplete = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(percentComplete);
          }
        },
      });

      // Step 3: Save PDF metadata to database
      const saveResponse = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/save`,
        method: "POST",
        body: {
          pdfFileName: generatedFileName,
          fileName: selectedFile.name,
          name: pdfName || selectedFile.name,
          language: pdfLanguage,
        },
      });

      if (!saveResponse.data?.success) {
        throw new Error(saveResponse.data?.error || "Failed to save PDF metadata");
      }

      // Trigger parent refresh to reload PDF list
      await onUpload();

      setUploadMode(null);
      setSelectedFile(null);
      setPdfName("");
      setPdfLanguage("");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadError"));
      console.error("Failed to upload PDF:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setUploadMode(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleToggleActive = async (pdf: SubjectPdf) => {
    try {
      await onToggle(pdf.id, !pdf.isActive);
    } catch (err) {
      console.error("Failed to toggle PDF:", err);
    }
  };

  const handleDelete = async (pdf: SubjectPdf) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      await onDelete(pdf.id);
    } catch (err) {
      console.error("Failed to delete PDF:", err);
    }
  };

  const handleViewPdf = (pdf: SubjectPdf) => {
    setSelectedPdf(pdf);
  };

  const closePdfViewer = () => {
    setSelectedPdf(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("mediaLibrary")}
        </h2>
        {!uploadMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUploadClick("simple")}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
            >
              {t("uploadPdf")}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Upload Forms */}
      {uploadMode === "simple" && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">{t("uploadPdf")}</h3>

          {/* File Input */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {/* Title and Language Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("pdfName") || "PDF Name"}
              </label>
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder={selectedFile?.name || "Enter name"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("language") || "Language"}
              </label>
              <select
                value={pdfLanguage}
                onChange={(e) => setPdfLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t("selectLanguage") || "Select Language"}</option>
                <option value="en">English</option>
                <option value="az">Azerbaijani</option>
                <option value="ru">Russian</option>
                <option value="tr">Turkish</option>
              </select>
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-red-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {uploading && uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimplePdfUpload}
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? t("uploading") : t("uploadButton")}
            </button>
            <button
              onClick={handleCancelUpload}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}



      {/* PDF List */}
      {pdfs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">{t("noPdfs")}</p>
          <p className="text-sm mt-2">{t("uploadFirst")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${pdf.isActive
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
                }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="shrink-0">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-clamp-1" title={pdf.name || `PDF #${pdf.id}`}>
                    {pdf.name || `PDF #${pdf.id}`}
                    {pdf.language && ` [${pdf.language.toUpperCase()}]`}
                    {pdf.language && subject.language && pdf.language !== subject.language && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={t("languageMismatch")}>
                        {t("languageMismatch")}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("uploaded")}: {new Date(pdf.createdAt).toLocaleDateString()}
                    {pdf.pdfOrder && ` • Order: ${pdf.pdfOrder}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded ${pdf.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {pdf.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleViewPdf(pdf)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors"
                >
                  {t("view")}
                </button>
                <button
                  onClick={() => handleToggleActive(pdf)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${pdf.isActive
                    ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                    : "bg-green-50 hover:bg-green-100 text-green-700"
                    }`}
                >
                  {pdf.isActive ? t("deactivate") : t("activate")}
                </button>
                <button
                  onClick={() => handleDelete(pdf)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-sm font-medium transition-colors"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {t("pdfViewer")} - PDF #{selectedPdf.id}
              </h3>
              <button
                onClick={closePdfViewer}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={selectedPdf.pdfUrl}
                className="w-full h-full min-h-[600px] border border-gray-200 rounded"
                title={`PDF ${selectedPdf.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
