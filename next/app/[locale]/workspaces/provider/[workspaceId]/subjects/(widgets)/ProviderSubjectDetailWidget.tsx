"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import { SubjectInfoSection } from "./ProviderSubjectInfoSection";
import { SubjectMediaLibrarySection } from "./ProviderSubjectMediaLibrarySection";
import { SubjectTopicsSection } from "./ProviderSubjectTopicsSection";
import { ProviderSubjectQuestionsSection } from "./ProviderSubjectQuestionsSection";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";
import { PiFilePdf, PiList, PiListChecks } from "react-icons/pi";

interface ProviderSubjectDetailWidgetProps {
  subjectId: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  slug: string;
  isActive: boolean;
  aiLabel: string | null;
  gradeLevel: number | null;
  language: string | null;
  createdAt: string;
  aiGuide: string | null;
}

export interface SubjectPdf {
  id: string;
  pdfUrl: string;
  pdfOrder: string | null;
  subjectId: string;
  isActive: boolean;
  uploadAccountId: string | null;
  createdAt: string;
  name: string | null;
  language: string | null;
}

export function ProviderSubjectDetailWidget({
  subjectId,
}: ProviderSubjectDetailWidgetProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations("ProviderSubjectDetailWidget");

  // State
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState<"media" | "topics" | "questions">("media");
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; name: string } | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}`,
        method: "GET",
      });
      setSubject(data);
    } catch (err) {
      setError(t("errorFetchingData"));
      console.error("Failed to fetch subject data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleSubjectUpdate = async (updatedData: Partial<Subject>) => {
    try {
      const response = await apiCall<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/update`,
        method: "PUT",
        body: updatedData,
      });

      await fetchSubject();
    } catch (err) {
      console.error("Failed to update subject:", err);
      throw err;
    }
  };

  const handleShowQuestions = (topicId: string, topicName: string) => {
    setSelectedTopic({ id: topicId, name: topicName });
    setActiveTab("questions");
    // Optionally scroll to tabs if needed, but usually fine
  };

  const handleClearTopicFilter = () => {
    setSelectedTopic(null);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiCall({
        url: `/api/workspaces/provider/${workspaceId}/subjects/delete/${subjectId}`,
        method: "DELETE",
      });
      router.push(`/workspaces/provider/${workspaceId}/subjects`);
    } catch (err) {
      console.error("Failed to delete subject:", err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <GlobalLoaderTile />;

  if (error || !subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">{t("error")}</p>
          <p className="text-sm mt-1">{error || t("subjectNotFound")}</p>
          <button
            onClick={fetchSubject}
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Subject Info */}
      <SubjectInfoSection
        workspaceId={workspaceId}
        subject={subject}
        onUpdate={handleSubjectUpdate}
        onDelete={() => setShowDeleteConfirm(true)}
        deleting={deleting}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900">{t("confirmDeleteTitle")}</h3>
            <p className="mt-2 text-sm text-gray-600">{t("confirmDeleteMessage")}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("deleteSubject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("media")}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "media"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <PiFilePdf className={`mr-2 h-5 w-5 ${activeTab === "media" ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-500"}`} />
            {t("mediaLibrary")}
          </button>

          <button
            onClick={() => setActiveTab("topics")}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "topics"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <PiList className={`mr-2 h-5 w-5 ${activeTab === "topics" ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-500"}`} />
            {t("topics")}
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "questions"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <PiListChecks className={`mr-2 h-5 w-5 ${activeTab === "questions" ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-500"}`} />
            {t("questions")}
            {selectedTopic && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                1
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === "media" && (
          <SubjectMediaLibrarySection
            workspaceId={workspaceId}
            subjectId={subjectId}
            subject={subject}
          />
        )}

        {activeTab === "topics" && (
          <SubjectTopicsSection
            workspaceId={workspaceId}
            subjectId={subjectId}
            subject={subject}
            onShowQuestions={handleShowQuestions}
          />
        )}

        {activeTab === "questions" && (
          <ProviderSubjectQuestionsSection
            workspaceId={workspaceId}
            subjectId={subjectId}
            topicId={selectedTopic?.id}
            topicName={selectedTopic?.name}
            onClearFilter={handleClearTopicFilter}
          />
        )}
      </div>
    </div>
  );
}
