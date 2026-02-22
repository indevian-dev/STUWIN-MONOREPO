"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import type { Subject } from "./ProviderSubjectDetail.widget";
import { PiBrain } from "react-icons/pi";
import { ProviderAiGuideModalWidget } from "./ProviderAiGuideModal.widget";
import { Card } from "@/app/primitives/Card.primitive";
import { Button } from "@/app/primitives/Button.primitive";
import { GlobalImagePlaceholderTile } from "@/app/[locale]/(global)/(tiles)/GlobalImagePlaceholder.tile";

interface SubjectInfoSectionProps {
  workspaceId: string;
  subject: Subject;
  onUpdate: (data: Partial<Subject>) => Promise<void>;
  onDelete?: () => void;
  deleting?: boolean;
}

export function SubjectInfoSection({
  workspaceId,
  subject,
  onUpdate,
  onDelete,
  deleting,
}: SubjectInfoSectionProps) {
  const t = useTranslations("SubjectInfoSection");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: subject.name,
    description: subject.description || "",
    slug: subject.slug,
    aiLabel: subject.aiLabel || "",
    gradeLevel: subject.gradeLevel || 0,
    language: subject.language || "",
    aiGuide: subject.aiGuide || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImageError, setCoverImageError] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [aiGuideModalOpen, setAiGuideModalOpen] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: subject.name,
      description: subject.description || "",
      slug: subject.slug,
      aiLabel: subject.aiLabel || "",
      gradeLevel: subject.gradeLevel || 0,
      language: subject.language || "",
      aiGuide: subject.aiGuide || "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await onUpdate(editData);
      setIsEditing(false);
    } catch (err) {
      setError(t("errorSaving"));
      console.error("Failed to save subject:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(t("invalidImageFile"));
      return;
    }

    // Validate file size (min 20KB, max 5MB)
    if (file.size < 20 * 1024) {
      setError(t("imageTooSmall"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t("imageTooLarge"));
      return;
    }

    try {
      setUploadingCover(true);
      setError(null);

      // Step 1: Get presigned URL from the API
      // API returns { presignedUrl } — path is deterministic: {workspaceId}/subjects/{id}/covers/cover.webp
      const { presignedUrl } = await fetchApiUtil<{ presignedUrl: string }>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subject.id}/cover`,
        method: 'POST',
        body: { fileType: file.type },
      });

      if (!presignedUrl) {
        throw new Error('Failed to get upload URL — no presignedUrl in response');
      }

      // Step 2: Upload directly to S3 using the presigned URL
      await axios.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      // Step 3: Force image refresh — path is deterministic, no DB write or re-fetch needed
      setCoverImageError(false);

    } catch (err) {
      setError(t("coverUploadError"));
      console.error("Failed to upload cover:", err);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };



  // Helper to construct image source
  const getCoverSrc = (cover: string | null) => {
    if (!cover) return "/pg.webp";
    if (cover.startsWith("http") || cover.startsWith("/")) return cover;

    // If it looks like a key (subjects/covers/...), use it directly
    if (cover.startsWith("subjects/")) {
      const domain = process.env.NEXT_PUBLIC_S3_PREFIX || "https://s3.stuwin.ai";
      const cleanDomain = domain.replace(/\/$/, "");
      return `${cleanDomain}/${cover}`;
    }

    // Otherwise, assume it's just the filename (user requirement)
    // Reconstruct: domain / subjects / covers / {id} / {filename}
    const domain = process.env.NEXT_PUBLIC_S3_PREFIX || "https://s3.stuwin.ai";
    const cleanDomain = domain.replace(/\/$/, "");
    return `${cleanDomain}/subjects/covers/${subject.id}/${cover}`;
  };

  const inputCls = "w-full px-3 py-2 rounded-app outline-none transition-colors border\
    border-black/10 dark:border-white/10\
    bg-white dark:bg-white/5\
    text-app-dark-blue dark:text-white\
    placeholder:text-app-dark-blue/30 dark:placeholder:text-white/30\
    focus:border-app-bright-green dark:focus:border-app-bright-green";
  const labelCls = "block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70";

  return (
    <Card className="p-6 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-app-dark-blue dark:text-white">
          {t("subjectInformation")}
        </h2>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setAiGuideModalOpen(true)}
              className={`px-4 py-2 border rounded-app text-sm font-medium transition-colors flex items-center gap-2 ${subject.aiGuide
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700 hover:bg-amber-100"
                : "border-black/10 dark:border-white/10 text-app-dark-blue/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
            >
              <PiBrain className={subject.aiGuide ? "fill-current" : ""} />
              AI Guide
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 rounded-app text-sm font-medium transition-colors
                border border-black/10 dark:border-white/10
                text-app-dark-blue dark:text-white
                hover:bg-black/5 dark:hover:bg-white/10"
            >
              {t("edit")}
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-app text-sm font-medium transition-colors border
                  border-red-200 dark:border-red-700
                  text-red-600 dark:text-red-400
                  bg-red-50 dark:bg-red-900/20
                  hover:bg-red-100 dark:hover:bg-red-900/30
                  disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? t("saving") : t("delete")}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-app text-sm
          bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700
          text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {
        isEditing ? (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>{t("name")}</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className={inputCls}
                placeholder={t("namePlaceholder")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("slug")}</label>
              <input
                type="text"
                value={editData.slug}
                onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                className={inputCls}
                placeholder={t("slugPlaceholder")}
              />
            </div>

            <div>
              <label className={labelCls}>{t("description")}</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("aiLabel")}</label>
                <input
                  type="text"
                  value={editData.aiLabel}
                  onChange={(e) => setEditData({ ...editData, aiLabel: e.target.value })}
                  className={inputCls}
                  placeholder={t("aiLabelPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t("aiGuide")}</label>
              <textarea
                value={editData.aiGuide}
                onChange={(e) => setEditData({ ...editData, aiGuide: e.target.value })}
                rows={3}
                className={`${inputCls} font-mono resize-none`}
                placeholder={t("aiGuidePlaceholder")}
              />
              <p className="mt-1 text-xs text-app-dark-blue/40 dark:text-white/40">{t("aiGuideHelp")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("gradeLevel")}</label>
                <input
                  type="number"
                  value={editData.gradeLevel}
                  onChange={(e) => setEditData({ ...editData, gradeLevel: parseInt(e.target.value) || 0 })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t("language")}</label>
                <select
                  value={editData.language}
                  onChange={(e) => setEditData({ ...editData, language: e.target.value })}
                  className={inputCls}
                >
                  <option value="">{t("selectLanguage")}</option>
                  <option value="en">English</option>
                  <option value="az">Azerbaijani</option>
                  <option value="ru">Russian</option>
                  <option value="tr">Turkish</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("saving") : t("save")}
              </Button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 rounded-app font-medium transition-colors
                  border border-black/10 dark:border-white/10
                  text-app-dark-blue dark:text-white
                  hover:bg-black/5 dark:hover:bg-white/10
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 space-y-2 relative">
                <div className="relative h-64 w-48 rounded overflow-hidden">
                  {coverImageError || !subject.cover ? (
                    <GlobalImagePlaceholderTile
                      error
                      shimmer={false}
                      aspect=""
                      className="h-64 w-48"
                    />
                  ) : (
                    <>
                      <GlobalImagePlaceholderTile
                        aspect=""
                        className="absolute inset-0 h-full w-full"
                      />
                      <img
                        src={getCoverSrc(subject.cover)}
                        alt={subject.name}
                        onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
                        onError={() => setCoverImageError(true)}
                        className="absolute inset-0 w-full h-full object-cover rounded z-10"
                        style={{ opacity: 0, transition: 'opacity 0.3s' }}
                      />
                    </>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full px-3 py-1.5 text-xs rounded-app font-medium transition-colors disabled:opacity-50
                    border border-black/10 dark:border-white/10
                    text-app-dark-blue dark:text-white
                    hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {uploadingCover
                    ? t("uploading")
                    : subject.cover && !coverImageError
                      ? t("replaceCover")
                      : t("uploadCover")}
                </button>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("name")}</p>
                  <p className="text-lg font-bold text-app-dark-blue dark:text-white">
                    {(subject as Subject & { displayTitle?: string }).displayTitle || subject.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("slug")}</p>
                  <p className="text-app-dark-blue dark:text-white">{subject.slug}</p>
                </div>

                {subject.description && (
                  <div>
                    <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("description")}</p>
                    <p className="text-app-dark-blue/80 dark:text-white/80">{subject.description}</p>
                  </div>
                )}

                {subject.aiLabel && (
                  <div>
                    <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("aiLabel")}</p>
                    <span className="inline-block px-3 py-1 bg-violet-100 dark:bg-violet-900/30
                      text-violet-700 dark:text-violet-300 text-sm font-semibold rounded-app">
                      {subject.aiLabel}
                    </span>
                  </div>
                )}

                {subject.aiGuide && (
                  <div>
                    <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("aiGuide")}</p>
                    <p className="text-sm text-app-dark-blue/70 dark:text-white/70
                      bg-black/5 dark:bg-white/5 p-3 rounded-app
                      border border-black/10 dark:border-white/10
                      font-mono whitespace-pre-wrap">
                      {subject.aiGuide}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {subject.gradeLevel !== null && (
                    <div>
                      <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("gradeLevel")}</p>
                      <p className="font-semibold text-app-dark-blue dark:text-white">{subject.gradeLevel}</p>
                    </div>
                  )}
                  {subject.language && (
                    <div>
                      <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mb-1">{t("language")}</p>
                      <span className="uppercase font-semibold text-app-dark-blue dark:text-white">{subject.language}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                  <div>
                    <span className="font-medium">{t("status")}:</span>{" "}
                    <span
                      className={
                        subject.isActive ? "text-green-600" : "text-red-600"
                      }
                    >
                      {subject.isActive ? t("active") : t("inactive")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{t("created")}:</span>{" "}
                    {new Date(subject.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }


      <ProviderAiGuideModalWidget
        isOpen={aiGuideModalOpen}
        entityType="subject"
        entityId={subject.id}
        currentAiGuide={subject.aiGuide || null}
        onClose={() => setAiGuideModalOpen(false)}
        onSuccess={() => onUpdate({})} // Trigger refresh (parent handles fetchSubject)
      />
    </Card>
  );
}
