"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { Subject } from "@/types/resources/subjects";
import { ApiResponse } from "@/types";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PiInfo, PiFilePdf, PiX } from "react-icons/pi";
import { ProviderTopicPdfManagementWidget } from "./ProviderTopicPdfManagementWidget";

import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

const Editor = dynamic(
  () => import("@/app/[locale]/workspaces/staff/[workspaceId]/ui/editor"),
  {
    ssr: false,
    loading: () => <div className="p-4 text-gray-500">Loading editor...</div>,
  },
);

interface ProviderTopicEditModalWidgetProps {
  topicId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = "details" | "pdf";

export function ProviderTopicEditModalWidget({
  topicId,
  isOpen,
  onClose,
  onSuccess,
}: ProviderTopicEditModalWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  // Form state
  const [name, setName] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject.PrivateAccess[]>([]);

  // PDF state
  const [pdfS3Key, setPdfS3Key] = useState<string | null>(null);
  const [totalPdfPages, setTotalPdfPages] = useState<number | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && topicId) {
      ConsoleLogger.log("Modal opened - fetching data for topicId:", topicId);
      setActiveTab("details"); // Reset to first tab
      setError(null);
      setSuccessMessage(null);
      fetchTopicData();
      fetchSubjects();
    }
  }, [isOpen, topicId]);

  const fetchTopicData = async (): Promise<void> => {
    setLoadingData(true);

    try {
      const response = (await apiCallForSpaHelper({
        method: "GET",
        url: `/api/workspaces/provider/${workspaceId}/topics?id=${topicId}`,
        params: {},
      })) as any;

      ConsoleLogger.log("Topic response:", response);

      // Handle Axios response format { data: { topic: {...} }, status: 200 }
      if (response?.data?.topic) {
        const topic = response.data.topic;
        ConsoleLogger.log("Extracted topic:", topic);

        setName(topic.name || "");
        setAiSummary(topic.aiSummary || "");
        setBody(topic.body || "");
        setGradeLevel(topic.gradeLevel ? String(topic.gradeLevel) : "");
        setSubjectId(topic.subjectId ? String(topic.subjectId) : "");
        setPdfS3Key(topic.pdfS3Key || null);
        setTotalPdfPages(topic.totalPdfPages || null);
      }
      // Handle direct response format { topic: {...} }
      else if (response?.topic) {
        const topic = response.topic;
        ConsoleLogger.log("Extracted topic (direct):", topic);

        setName(topic.name || "");
        setAiSummary(topic.aiSummary || "");
        setBody(topic.body || "");
        setGradeLevel(topic.gradeLevel ? String(topic.gradeLevel) : "");
        setSubjectId(topic.subjectId ? String(topic.subjectId) : "");
        setPdfS3Key(topic.pdfS3Key || null);
        setTotalPdfPages(topic.totalPdfPages || null);
      } else {
        ConsoleLogger.error("No topic data found in response!");
        setError("Failed to load topic data");
      }
    } catch (err) {
      ConsoleLogger.error("Error fetching topic:", err);
      setError("Failed to load topic data");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSubjects = async (): Promise<void> => {
    try {
      const response = (await apiCallForSpaHelper({
        method: "GET",
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        params: {},
      })) as any;

      ConsoleLogger.log("Subjects response:", response);

      // Handle Axios response format { data: { subjects: [...] }, status: 200 }
      if (response?.data?.subjects) {
        ConsoleLogger.log(
          "Setting subjects (Axios):",
          response.data.subjects.length,
          "subjects",
        );
        setSubjects(response.data.subjects);
      }
      // Handle direct response format { subjects: [...] }
      else if (response?.subjects) {
        ConsoleLogger.log(
          "Setting subjects (direct):",
          response.subjects.length,
          "subjects",
        );
        setSubjects(response.subjects);
      } else {
        ConsoleLogger.log("No subjects data found in response");
      }
    } catch (err) {
      ConsoleLogger.error("Error fetching subjects:", err);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiCallForSpaHelper({
        method: "PUT",
        url: `/api/workspaces/provider/${workspaceId}/topics/update/${topicId}`,
        params: {},
        body: {
          name,
          ...(body && { body }),
          ...(aiSummary && { ai_summary: aiSummary }),
          ...(gradeLevel && { grade_level: parseInt(gradeLevel) }),
          ...(subjectId && { subject_id: subjectId }),
        },
      });

      if (response.status === 200) {
        setSuccessMessage("Topic updated successfully!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      } else {
        setError(response.data?.error || "Failed to update topic");
      }
    } catch (err) {
      ConsoleLogger.error("Error updating topic:", err);
      setError("Failed to update topic");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpdate = (pdfKey: string, totalPages?: number): void => {
    ConsoleLogger.log("PDF updated:", { pdfKey, totalPages });
    setPdfS3Key(pdfKey);
    if (totalPages !== undefined) {
      setTotalPdfPages(totalPages);
    }
    setSuccessMessage("PDF uploaded successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClose = (): void => {
    if (!loading) {
      setActiveTab("details");
      setError(null);
      setSuccessMessage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl shadow-xl my-8 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Topic</h2>
            <p className="text-sm text-gray-500 mt-1">Topic ID: {topicId}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Close"
          >
            <PiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "details"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center gap-2">
              <PiInfo className="w-5 h-5" />
              Topic Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab("pdf")}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "pdf"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center gap-2">
              <PiFilePdf className="w-5 h-5" />
              PDF Content
              {pdfS3Key && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                  ✓
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Success/Error Messages */}
          {(error || successMessage) && (
            <div className="p-6 pb-0">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700">{successMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "details" ? (
            <form onSubmit={handleSubmit} id="topic-edit-form" className="p-6">
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading topic data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Topic Name */}
                  <div>
                    <label
                      htmlFor="topic-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Topic Name *
                    </label>
                    <input
                      id="topic-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
                      placeholder="Enter topic name"
                    />
                  </div>

                  {/* Subject and Grade Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Subject
                      </label>
                      <select
                        id="subject"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
                      >
                        <option value="">Select a subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="grade-level"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Grade Level
                      </label>
                      <input
                        id="grade-level"
                        type="number"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        min="1"
                        max="12"
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
                        placeholder="1-12"
                      />
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div>
                    <label
                      htmlFor="ai-summary"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      AI Summary
                    </label>
                    <textarea
                      id="ai-summary"
                      value={aiSummary}
                      onChange={(e) => setAiSummary(e.target.value)}
                      rows={3}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
                      placeholder="Enter a short AI-generated summary"
                    />
                  </div>

                  {/* Body Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Content
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <Editor
                        ref={editorRef}
                        initialData={body}
                        onChange={(data: string) => setBody(data)}
                        placeholder="Enter the full topic content..."
                        height="400px"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="p-6">
              {loadingData ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF data...</p>
                </div>
              ) : (
                <ProviderTopicPdfManagementWidget
                  topicId={topicId}
                  topicName={name || "Topic"}
                  existingPdfKey={pdfS3Key}
                  existingTotalPages={totalPdfPages}
                  onPdfUpdate={handlePdfUpdate}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {activeTab === "details" ? (
              <span>
                Fill in the topic details and click Update to save changes
              </span>
            ) : (
              <span>Upload or create PDF content for this topic</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-gray-700 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            {activeTab === "details" && (
              <button
                type="submit"
                form="topic-edit-form"
                disabled={loading || loadingData}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? "Updating..." : "Update Topic"}
              </button>
            )}
            {activeTab === "pdf" && pdfS3Key && (
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
