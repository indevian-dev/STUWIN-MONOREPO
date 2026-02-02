"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import type { Subject } from "./ProviderSubjectDetailWidget";

interface SubjectInfoSectionProps {
  workspaceId: string;
  subject: Subject;
  onUpdate: (data: Partial<Subject>) => Promise<void>;
}

export function SubjectInfoSection({
  workspaceId,
  subject,
  onUpdate,
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
    aiAssistantCrib: subject.aiAssistantCrib || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImageError, setCoverImageError] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: subject.name,
      description: subject.description || "",
      slug: subject.slug,
      aiLabel: subject.aiLabel || "",
      gradeLevel: subject.gradeLevel || 0,
      language: subject.language || "",
      aiAssistantCrib: subject.aiAssistantCrib || "",
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
      const presignResponse = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subject.id}/cover`,
        method: 'POST',
        body: {
          fileName: file.name,
          fileType: file.type,
        },
      });

      if (!presignResponse.data?.success) {
        throw new Error('Failed to get upload URL');
      }

      const { presignedUrl, coverKey, publicUrl, generatedFileName } = presignResponse.data;

      // Step 2: Upload file to S3 using presigned URL (using axios)
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Save the filename to the database (User requirement)
      // The user requested to store ONLY the filename (e.g. timestamp-name.png).
      // We can reconstruct the path on frontend: subjects/covers/{id}/{filename}
      const saveResponse = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subject.id}/cover`,
        method: 'PUT',
        body: {
          coverUrl: generatedFileName,
        },
      });

      if (!saveResponse.data?.success) {
        throw new Error('Failed to save cover URL');
      }

      // Step 4: Trigger a re-fetch by updating the subject
      await onUpdate({ cover: generatedFileName });

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

  const handleCoverImageError = () => {
    setCoverImageError(true);
  };

  // Helper to construct image source
  const getCoverSrc = (cover: string | null) => {
    if (!cover) return "";
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("subjectInformation")}
        </h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
          >
            {t("edit")}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("name")}
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("namePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("slug")}
            </label>
            <input
              type="text"
              value={editData.slug}
              onChange={(e) =>
                setEditData({ ...editData, slug: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("slugPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("description")}
            </label>
            <textarea
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("aiLabel")}
              </label>
              <input
                type="text"
                value={editData.aiLabel}
                onChange={(e) =>
                  setEditData({ ...editData, aiLabel: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("aiLabelPlaceholder")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("aiAssistantCrib")}
            </label>
            <textarea
              value={editData.aiAssistantCrib}
              onChange={(e) =>
                setEditData({ ...editData, aiAssistantCrib: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={t("aiAssistantCribPlaceholder")}
            />
            <p className="mt-1 text-xs text-gray-500">{t("aiAssistantCribHelp")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("gradeLevel")}
              </label>
              <input
                type="number"
                value={editData.gradeLevel}
                onChange={(e) =>
                  setEditData({ ...editData, gradeLevel: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("language")}
              </label>
              <select
                value={editData.language}
                onChange={(e) =>
                  setEditData({ ...editData, language: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("selectLanguage")}</option>
                <option value="en">English</option>
                <option value="az">Azerbaijani</option>
                <option value="ru">Russian</option>
                <option value="tr">Turkish</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t("saving") : t("save")}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0 space-y-2">
              {subject.cover && !coverImageError ? (
                <img
                  src={getCoverSrc(subject.cover)}
                  alt={subject.name}
                  onError={handleCoverImageError}
                  className="w-32 h-32 object-cover rounded-md border border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
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
                className="w-full px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition-colors disabled:opacity-50"
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
                <p className="text-sm text-gray-500 mb-1">{t("name")}</p>
                <p className="text-lg font-bold text-gray-900">
                  {subject.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">{t("slug")}</p>
                <p className="text-gray-800">{subject.slug}</p>
              </div>

              {subject.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t("description")}
                  </p>
                  <p className="text-gray-800">{subject.description}</p>
                </div>
              )}

              {subject.aiLabel && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("aiLabel")}</p>
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded">
                    {subject.aiLabel}
                  </span>
                </div>
              )}

              {subject.aiAssistantCrib && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("aiAssistantCrib")}</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 font-mono whitespace-pre-wrap">
                    {subject.aiAssistantCrib}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {subject.gradeLevel !== null && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t("gradeLevel")}</p>
                    <p className="text-gray-800 font-medium">{subject.gradeLevel}</p>
                  </div>
                )}
                {subject.language && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t("language")}</p>
                    <span className="uppercase text-gray-800 font-medium">{subject.language}</span>
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
      )}
    </div>
  );
}
