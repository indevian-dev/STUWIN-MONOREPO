"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  PiX,
  PiFilePdf,
  PiUpload,
  PiSpinner,
  PiCheck,
  PiPencil,
  PiTrash,
  PiWarning,
  PiBookOpen,
} from "react-icons/pi";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import type { SubjectPdf } from "./ProviderSubjectDetailWidget";

interface ProviderPdfTopicExtractorWidgetProps {
  workspaceId: string;
  subjectId: string;
  pdfs: SubjectPdf[];
  isOpen: boolean;
  onClose: () => void;
  onTopicsCreated?: () => void;
}

interface ExtractedTopic {
  id: string;
  name: string;
  pageStart: number;
  pageEnd: number;
  aiSummary?: string;
  editing?: boolean;
}

type ExtractionStage =
  | "select"
  | "analyzing"
  | "review"
  | "creating"
  | "complete"
  | "error";

export function ProviderPdfTopicExtractorWidget({
  workspaceId,
  subjectId,
  pdfs,
  isOpen,
  onClose,
  onTopicsCreated,
}: ProviderPdfTopicExtractorWidgetProps) {
  // PDF selection state
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);

  // Processing state
  const [stage, setStage] = useState<ExtractionStage>("select");
  const [error, setError] = useState<string | null>(null);

  // Topics state
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number>(0);

  // Grade state (subject is already selected)
  const [gradeLevel, setGradeLevel] = useState<string>("");


  const handleExtractTopics = async (): Promise<void> => {
    if (!selectedPdfId) {
      setError("Please select a PDF from the library");
      return;
    }

    if (!gradeLevel) {
      setError("Please select grade level");
      return;
    }

    try {
      // Find the selected PDF
      const selectedPdf = pdfs.find(pdf => pdf.id === selectedPdfId);
      if (!selectedPdf) {
        throw new Error("Selected PDF not found");
      }

      // Step 1: Analyze with Gemini using existing PDF
      setStage("analyzing");
      setError(null);

      const analysisResponseData = await apiCall<any>({
        method: "POST",
        url: `/api/workspaces/provider/${workspaceId}/topics/analyze-book`,
        body: {
          pdfKey: selectedPdf.pdfUrl, // Use existing PDF URL
          subjectId,
          gradeLevel: parseInt(gradeLevel),
        },
      });

      if (!analysisResponseData?.topics) {
        throw new Error("Failed to extract topics from PDF");
      }

      // Set extracted topics
      const topics: ExtractedTopic[] = analysisResponseData.topics.map(
        (topic: any, index: number) => ({
          id: `topic-${index}`,
          name: topic.name || topic.title,
          pageStart: topic.pageStart || topic.page_start,
          pageEnd: topic.pageEnd || topic.page_end,
          aiSummary: topic.summary || topic.aiSummary,
          editing: false,
        }),
      );

      setExtractedTopics(topics);
      setStage("review");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to extract topics from PDF";
      setError(errorMessage);
      setStage("error");
    }
  };


  const handleEditTopic = (id: string): void => {
    setExtractedTopics((topics) =>
      topics.map((t) => (t.id === id ? { ...t, editing: true } : t)),
    );
  };

  const handleSaveTopic = (id: string): void => {
    setExtractedTopics((topics) =>
      topics.map((t) => (t.id === id ? { ...t, editing: false } : t)),
    );
  };

  const handleUpdateTopic = (
    id: string,
    field: keyof ExtractedTopic,
    value: string | number,
  ): void => {
    setExtractedTopics((topics) =>
      topics.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handleRemoveTopic = (id: string): void => {
    setExtractedTopics((topics) => topics.filter((t) => t.id !== id));
  };

  const handleCreateTopics = async (): Promise<void> => {
    if (extractedTopics.length === 0) {
      setError("No topics to create");
      return;
    }

    if (!selectedPdfId) {
      setError("No PDF selected");
      return;
    }

    const selectedPdf = pdfs.find(pdf => pdf.id === selectedPdfId);
    if (!selectedPdf) {
      setError("Selected PDF not found");
      return;
    }

    setStage("creating");
    setError(null);

    try {
      // Use the new bulk create API
      const response = await apiCall<any>({
        method: "POST",
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/create`,
        body: {
          topics: extractedTopics.map(topic => ({
            name: topic.name,
            providerSubjectId: subjectId,
            gradeLevel: parseInt(gradeLevel),
            aiSummary: topic.aiSummary || "",
            pdfFileName: selectedPdf.pdfUrl,
            pdfPagesByTopic: { start: topic.pageStart, end: topic.pageEnd },
            isActiveAiGeneration: false,
          })),
        },
      });
        setStage("complete");
        setTimeout(() => {
          onTopicsCreated?.();
          handleClose();
        }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create topics";
      setError(errorMessage);
      setStage("error");
    }
  };

  const handleClose = (): void => {
    if (stage === "analyzing" || stage === "creating") {
      return; // Prevent closing during processing
    }

    // Reset state
    setSelectedPdfId(null);
    setStage("select");
    setError(null);
    setExtractedTopics([]);
    setCurrentTopicIndex(0);
    setGradeLevel("");

    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl shadow-xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <PiBookOpen className="w-7 h-7 text-purple-600" />
              Extract Topics from PDF
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload a PDF book and extract topics automatically using AI
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={
              stage === "analyzing" || stage === "creating"
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <PiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stage: Select PDF */}
          {stage === "select" && (
            <>
              {/* PDF Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF from Library *
                </label>
                <select
                  value={selectedPdfId || ""}
                  onChange={(e) => setSelectedPdfId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a PDF...</option>
                  {pdfs
                    .filter(pdf => pdf.isActive)
                    .map((pdf) => (
                      <option key={pdf.id} value={pdf.id}>
                        {pdf.name || pdf.pdfUrl}
                      </option>
                    ))}
                </select>
                {pdfs.filter(pdf => pdf.isActive).length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    No PDFs found in this subject's library. Please upload PDFs first.
                  </p>
                )}
              </div>

              {/* Grade Level Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level *
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select grade</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <PiWarning className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      How it works:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>1. Upload your PDF textbook or learning material</li>
                      <li>
                        2. AI will analyze and extract topics with page numbers
                      </li>
                      <li>3. Review and edit the extracted topics</li>
                      <li>
                        4. Click "Create Topics" to add them to your subject
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}


          {/* Stage: Analyzing */}
          {stage === "analyzing" && (
            <div className="text-center py-12">
              <PiSpinner className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analyzing PDF with AI...
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Gemini AI is extracting topics and page numbers
              </p>
              <p className="text-xs text-gray-500">This may take 30-60 seconds</p>
            </div>
          )}

          {/* Stage: Review Topics */}
          {stage === "review" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Extracted Topics ({extractedTopics.length})
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review and edit topics before creating
                  </p>
                </div>
              </div>

              {/* Topics List */}
              <div className="space-y-2 mb-4">
                {extractedTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors"
                  >
                    {topic.editing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-600">Topic Name</label>
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) =>
                              handleUpdateTopic(topic.id, "name", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">
                              Start Page
                            </label>
                            <input
                              type="number"
                              value={topic.pageStart}
                              onChange={(e) =>
                                handleUpdateTopic(
                                  topic.id,
                                  "pageStart",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">End Page</label>
                            <input
                              type="number"
                              value={topic.pageEnd}
                              onChange={(e) =>
                                handleUpdateTopic(
                                  topic.id,
                                  "pageEnd",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveTopic(topic.id)}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium text-gray-900">
                              {topic.name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Pages: {topic.pageStart} - {topic.pageEnd}
                          </p>
                          {topic.aiSummary && (
                            <p className="text-xs text-gray-500 mt-1">
                              {topic.aiSummary}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTopic(topic.id)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <PiPencil className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleRemoveTopic(topic.id)}
                            className="p-2 hover:bg-red-100 rounded"
                          >
                            <PiTrash className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Stage: Creating Topics */}
          {stage === "creating" && (
            <div className="text-center py-12">
              <PiSpinner className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Creating Topics...
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Creating topic {currentTopicIndex + 1} of {extractedTopics.length}
              </p>
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentTopicIndex + 1) / extractedTopics.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Stage: Complete */}
          {stage === "complete" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Topics Created Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                {extractedTopics.length} topics have been added to your subject
              </p>
            </div>
          )}

          {/* Stage: Error */}
          {stage === "error" && error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiX className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Occurred
              </h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setStage("select")}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && stage !== "error" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={
              stage === "analyzing" || stage === "creating"
            }
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-gray-700 font-medium disabled:opacity-50 transition-colors"
          >
            {stage === "complete" ? "Close" : "Cancel"}
          </button>

          {stage === "select" && selectedPdfId && gradeLevel && (
            <button
              onClick={handleExtractTopics}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <PiBookOpen className="w-5 h-5" />
              Extract Topics
            </button>
          )}

          {stage === "review" && extractedTopics.length > 0 && (
            <button
              onClick={handleCreateTopics}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <PiCheck className="w-5 h-5" />
              Create {extractedTopics.length} Topics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
