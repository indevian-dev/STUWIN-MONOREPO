"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { Topic } from "@/types";
import { SubjectInfoSection } from "./ProviderSubjectInfoSection";
import { SubjectMediaLibrarySection } from "./ProviderSubjectMediaLibrarySection";
import { SubjectTopicsSection } from "./ProviderSubjectTopicsSection";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";

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
  aiAssistantCrib: string | null;
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

// Topic is now imported from @/types

export function ProviderSubjectDetailWidget({
  subjectId,
}: ProviderSubjectDetailWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations("ProviderSubjectDetailWidget");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [pdfs, setPdfs] = useState<SubjectPdf[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [subjectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([fetchSubject(), fetchPdfs(), fetchTopics()]);
    } catch (err) {
      setError(t("errorFetchingData"));
      console.error("Failed to fetch subject data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubject = async () => {
    const response = await apiCallForSpaHelper({
      url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}`,
      method: "GET",
    });

    if (response.data?.success && response.data?.data) {
      setSubject(response.data.data);
    }
  };

  const fetchPdfs = async () => {
    const response = await apiCallForSpaHelper({
      url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs`,
      method: "GET",
    });

    if (response.data?.success && response.data?.data) {
      setPdfs(response.data.data);
    }
  };

  const fetchTopics = async () => {
    const response = await apiCallForSpaHelper({
      url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics`,
      method: "GET",
    });

    if (response.data?.success && response.data?.data) {
      setTopics(response.data.data);
    }
  };

  const handleSubjectUpdate = async (updatedData: Partial<Subject>) => {
    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/update`,
        method: "PUT",
        body: updatedData,
      });

      if (response.data?.success) {
        await fetchSubject();
      }
    } catch (err) {
      console.error("Failed to update subject:", err);
      throw err;
    }
  };

  const handlePdfUpload = async () => {
    try {
      await fetchPdfs();
    } catch (err) {
      console.error("Failed to refresh PDFs:", err);
      throw err;
    }
  };

  const handlePdfToggle = async (pdfId: string, isActive: boolean) => {
    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/${pdfId}`,
        method: "PUT",
        body: { isActive },
      });

      if (response.data?.success) {
        await fetchPdfs();
      }
    } catch (err) {
      console.error("Failed to toggle PDF:", err);
      throw err;
    }
  };

  const handlePdfDelete = async (pdfId: string) => {
    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs/${pdfId}/delete`,
        method: "DELETE",
      });

      if (response.data?.success) {
        await fetchPdfs();
      }
    } catch (err) {
      console.error("Failed to delete PDF:", err);
      throw err;
    }
  };

  const handleTopicUpdate = async (
    topicId: string,
    updatedData: Partial<Topic>,
  ) => {
    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${topicId}/update`,
        method: "PUT",
        body: updatedData,
      });

      if (response.data?.success) {
        await fetchTopics();
      }
    } catch (err) {
      console.error("Failed to update topic:", err);
      throw err;
    }
  };

  const handleTopicsReorder = async (reorderedTopics: Topic[]) => {
    try {
      // Try to find a subjectPdfId from the topics being reordered
      const subjectPdfId = reorderedTopics.find((t) => t.subjectPdfId)?.subjectPdfId;

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/reorder`,
        method: "PUT",
        body: {
          topicIds: reorderedTopics.map((t) => t.id),
          // Send subjectPdfId if we found one, this helps the backend
          // when multiple PDFs exist for one subject
          ...(subjectPdfId ? { subjectPdfId } : {}),
        },
      });

      if (response.data?.success) {
        setTopics(reorderedTopics);
      }
    } catch (err) {
      console.error("Failed to reorder topics:", err);
      throw err;
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
            onClick={fetchAllData}
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Section 1: Subject Information */}
      <SubjectInfoSection workspaceId={workspaceId} subject={subject} onUpdate={handleSubjectUpdate} />

      {/* Section 2: Media Library (PDFs) */}
      <SubjectMediaLibrarySection
        workspaceId={workspaceId}
        subjectId={subjectId}
        subject={subject}
        pdfs={pdfs}
        onUpload={handlePdfUpload}
        onToggle={handlePdfToggle}
        onDelete={handlePdfDelete}
      />

      {/* Section 3: Topics */}
      <SubjectTopicsSection
        workspaceId={workspaceId}
        subjectId={subjectId}
        subject={subject}
        topics={topics}
        pdfs={pdfs}
        onUpdate={handleTopicUpdate}
        onReorder={handleTopicsReorder}
        onTopicsCreated={fetchTopics}
      />
    </div>
  );
}
