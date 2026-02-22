"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import type { SubjectPdf, Subject } from "./ProviderSubjectDetail.widget";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoader.tile";
import { Card } from "@/app/primitives/Card.primitive";
import { Button } from "@/app/primitives/Button.primitive";
import { PiFilePdf, PiX } from "react-icons/pi";

interface SubjectMediaLibrarySectionProps {
  workspaceId: string;
  subjectId: string;
  subject: Subject;
}

type UploadMode = "simple" | null;

const inputCls = "w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border\
  border-black/10 dark:border-white/10\
  bg-white dark:bg-white/5\
  text-app-dark-blue dark:text-white\
  placeholder:text-app-dark-blue/30 dark:placeholder:text-white/30\
  focus:border-app-bright-green dark:focus:border-app-bright-green";

const labelCls = "block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70";

export function SubjectMediaLibrarySection({
  workspaceId,
  subjectId,
  subject,
}: SubjectMediaLibrarySectionProps) {
  const t = useTranslations("SubjectMediaLibrarySection");
  const [pdfs, setPdfs] = useState<SubjectPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<SubjectPdf | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfLanguage, setPdfLanguage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const data = await fetchApiUtil<SubjectPdf[]>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs`,
        method: "GET",
      });
      setPdfs(data ?? []);
    } catch (err: unknown) {
      console.error("Failed to fetch PDFs:", err);
      setError(t("errorFetchingData"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError(t("invalidPdfFile")); setSelectedFile(null); return; }
    if (file.size > 50 * 1024 * 1024) { setError(t("fileTooLarge")); setSelectedFile(null); return; }
    setSelectedFile(file);
    setError(null);
  };

  const handleSimplePdfUpload = async () => {
    if (!selectedFile) { setError(t("noFileSelected")); return; }
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const uploadData = await fetchApiUtil<{ presignedUrl: string; generatedFileName: string }>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/upload`,
        method: "POST",
        body: { fileName: selectedFile.name, fileType: selectedFile.type },
      });

      if (!uploadData) throw new Error("Failed to get upload URL");
      const { presignedUrl, generatedFileName } = uploadData;

      await axios.put(presignedUrl, selectedFile, {
        headers: { "Content-Type": "application/pdf" },
        onUploadProgress: (e) => {
          if (e.lengthComputable && e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      await fetchApiUtil<unknown>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/save`,
        method: "POST",
        body: { pdfFileName: generatedFileName, fileName: selectedFile.name, name: pdfName || selectedFile.name, language: pdfLanguage },
      });

      await fetchPdfs();
      setUploadMode(null);
      setSelectedFile(null);
      setPdfName("");
      setPdfLanguage("");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("uploadError"));
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
      await fetchApiUtil<unknown>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/${pdf.id}`,
        method: "PUT",
        body: { isActive: !pdf.isActive },
      });
      await fetchPdfs();
    } catch (err: unknown) { console.error("Failed to toggle PDF:", err); }
  };

  const handleDelete = async (pdf: SubjectPdf) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await fetchApiUtil<unknown>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/${pdf.id}/delete`,
        method: "DELETE",
      });
      await fetchPdfs();
    } catch (err: unknown) { console.error("Failed to delete PDF:", err); }
  };

  if (loading && pdfs.length === 0) return <GlobalLoaderTile message={t("loadingMedia")} />;

  return (
    <Card className="mt-4 p-6 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-app-dark-blue dark:text-white">
          {t("mediaLibrary")}
        </h2>
        {!uploadMode && (
          <Button onClick={() => { setUploadMode("simple"); setError(null); setSelectedFile(null); }}>
            {t("uploadPdf")}
          </Button>
        )}
      </div>

      {/* Error bar */}
      {error && (
        <div className="mb-4 p-3 rounded-app text-sm
          bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700
          text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Upload form */}
      {uploadMode === "simple" && (
        <Card className="mb-6 p-4 bg-black/3 dark:bg-white/5 border-black/10 dark:border-white/10">
          <h3 className="text-base font-semibold mb-4 text-app-dark-blue dark:text-white">
            {t("uploadPdf")}
          </h3>

          {/* File picker */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm
                text-app-dark-blue/60 dark:text-white/60
                file:mr-4 file:py-2 file:px-4 file:rounded-app file:border-0
                file:text-sm file:font-semibold
                file:bg-app-bright-green/10 file:text-app-bright-green
                hover:file:bg-app-bright-green/20
                disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>{t("pdfName") || "PDF Name"}</label>
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder={selectedFile?.name || "Enter name"}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{t("language") || "Language"}</label>
              <select value={pdfLanguage} onChange={(e) => setPdfLanguage(e.target.value)} className={inputCls}>
                <option value="">{t("selectLanguage") || "Select Language"}</option>
                <option value="en">English</option>
                <option value="az">Azerbaijani</option>
                <option value="ru">Russian</option>
                <option value="tr">Turkish</option>
              </select>
            </div>
          </div>

          {/* Selected file preview */}
          {selectedFile && (
            <div className="mb-4 p-3 rounded-app border border-black/10 dark:border-white/10 bg-white dark:bg-white/5">
              <div className="flex items-center gap-3">
                <PiFilePdf className="w-8 h-8 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-dark-blue dark:text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {uploading && uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-app-full h-2">
                        <div
                          className="bg-app-bright-green h-2 rounded-app-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleSimplePdfUpload} disabled={uploading || !selectedFile}>
              {uploading ? t("uploading") : t("uploadButton")}
            </Button>
            <button
              onClick={handleCancelUpload}
              disabled={uploading}
              className="px-4 py-2 rounded-app text-sm font-medium transition-colors
                border border-black/10 dark:border-white/10
                text-app-dark-blue dark:text-white
                hover:bg-black/5 dark:hover:bg-white/10
                disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          </div>
        </Card>
      )}

      {/* PDF list */}
      {pdfs.length === 0 ? (
        <div className="py-12 text-center">
          <PiFilePdf className="mx-auto w-12 h-12 mb-3 text-app-dark-blue/20 dark:text-white/20" />
          <p className="text-base font-semibold text-app-dark-blue/50 dark:text-white/50">{t("noPdfs")}</p>
          <p className="text-sm mt-1 text-app-dark-blue/30 dark:text-white/30">{t("uploadFirst")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className={`flex flex-col p-4 rounded-app border transition-colors ${pdf.isActive
                ? "border-app-bright-green/30 bg-app-bright-green/5 dark:bg-app-bright-green/10"
                : "border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/5"
                }`}
            >
              <div className="flex items-start gap-4 mb-3">
                <PiFilePdf className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-app-dark-blue dark:text-white line-clamp-1 break-all">
                      {pdf.name || `PDF #${pdf.id}`}
                    </h4>
                    {pdf.language && subject.language && pdf.language !== subject.language && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold
                        bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {t("languageMismatch")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-app-dark-blue/50 dark:text-white/50">
                    <span>{t("uploaded")}: {new Date(pdf.createdAt).toLocaleDateString()}</span>
                    {pdf.pdfOrder && <span>• Order: {pdf.pdfOrder}</span>}
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-app ${pdf.isActive
                      ? "bg-app-bright-green/10 dark:bg-app-bright-green/20 text-app-bright-green"
                      : "bg-black/10 dark:bg-white/10 text-app-dark-blue/50 dark:text-white/50"
                      }`}>
                      {pdf.isActive ? t("active") : t("inactive")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-12">
                <button
                  onClick={() => setSelectedPdf(pdf)}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors
                    bg-black/5 dark:bg-white/10 text-app-dark-blue dark:text-white
                    hover:bg-black/10 dark:hover:bg-white/20"
                >
                  {t("view")}
                </button>
                <button
                  onClick={() => handleToggleActive(pdf)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${pdf.isActive
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                    : "bg-app-bright-green/10 dark:bg-app-bright-green/20 text-app-bright-green hover:bg-app-bright-green/20"
                    }`}
                >
                  {pdf.isActive ? t("deactivate") : t("activate")}
                </button>
                <button
                  onClick={() => handleDelete(pdf)}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors
                    bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
                    hover:bg-red-100 dark:hover:bg-red-900/30"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden
            bg-white dark:bg-app-dark-blue/95 border-black/10 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-app-dark-blue dark:text-white">
                {t("pdfViewer")} — {selectedPdf.name || `PDF #${selectedPdf.id}`}
              </h3>
              <button
                onClick={() => setSelectedPdf(null)}
                className="p-2 rounded-app-full transition-colors
                  text-app-dark-blue/50 dark:text-white/50
                  hover:bg-black/5 dark:hover:bg-white/10"
              >
                <PiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={selectedPdf.pdfUrl}
                className="w-full min-h-[600px] h-full rounded-app border border-black/10 dark:border-white/10"
                title={`PDF ${selectedPdf.id}`}
              />
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
