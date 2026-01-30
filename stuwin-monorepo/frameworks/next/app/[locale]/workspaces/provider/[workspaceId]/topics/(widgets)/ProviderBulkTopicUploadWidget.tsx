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
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import axios from "axios";

interface ProviderBulkTopicUploadWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ExtractedTopic {
  id: string;
  name: string;
  pageStart: number;
  pageEnd: number;
  aiSummary?: string;
  editing?: boolean;
}

type UploadStage =
  | "select"
  | "uploading"
  | "analyzing"
  | "review"
  | "creating"
  | "complete"
  | "error";

export function ProviderBulkTopicUploadWidget({
  isOpen,
  onClose,
  onSuccess,
}: ProviderBulkTopicUploadWidgetProps) {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [stage, setStage] = useState<UploadStage>("select");
  const [error, setError] = useState<string | null>(null);

  // Topics state
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number>(0);

  // PDF state
  const [pdfS3Key, setPdfS3Key] = useState<string | null>(null);
  const [totalPdfPages, setTotalPdfPages] = useState<number | null>(null);

  // Subject and grade state
  const [subjectId, setSubjectId] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState<string>("");

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 100MB for books)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size must be less than 100MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setStage("select");
  };

  const handleUploadAndAnalyze = async (): Promise<void> => {
    if (!selectedFile) {
      setError("Please select a PDF file");
      return;
    }

    if (!subjectId || !gradeLevel) {
      setError("Please select subject and grade level");
      return;
    }

    try {
      // Step 1: Upload PDF to S3
      setStage("uploading");
      setError(null);
      setUploadProgress(0);

      const fileName = `bulk-${Date.now()}-${selectedFile.name}`;
      const presignedResponse = await apiCallForSpaHelper({
        method: "POST",
        url: "/api/workspaces/provider/topics/upload-pdf",
        body: {
          topicId: "temp", // Temporary, will be updated later
          fileName,
          fileType: "application/pdf",
        },
      });

      if (!presignedResponse.data?.presignedUrl) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, pdfKey } = presignedResponse.data;

      // Upload to S3
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          "Content-Type": "application/pdf",
          "x-amz-acl": "public-read",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && progressEvent.total) {
            const percentComplete = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100,
            );
            setUploadProgress(percentComplete);
          }
        },
      });

      setPdfS3Key(pdfKey);

      // Get page count
      const pageCount = await getPdfPageCount(selectedFile);
      setTotalPdfPages(pageCount);

      // Step 2: Analyze with Gemini
      setStage("analyzing");
      setUploadProgress(0);

      const analysisResponse = await apiCallForSpaHelper({
        method: "POST",
        url: "/api/workspaces/provider/topics/analyze-book",
        body: {
          pdfKey,
          subjectId,
          gradeLevel: parseInt(gradeLevel),
        },
      });

      if (!analysisResponse.data?.topics) {
        throw new Error("Failed to extract topics from PDF");
      }

      // Set extracted topics
      const topics: ExtractedTopic[] = analysisResponse.data.topics.map(
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
        err instanceof Error ? err.message : "Failed to process PDF";
      setError(errorMessage);
      setStage("error");
    }
  };

  const getPdfPageCount = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const text = new TextDecoder("latin1").decode(typedArray);
          const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
          const pageCount = pageMatches ? pageMatches.length : 1;
          resolve(pageCount);
        } catch (error) {
          reject(new Error("Failed to read PDF metadata"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
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

    if (!pdfS3Key || !totalPdfPages) {
      setError("PDF information missing");
      return;
    }

    setStage("creating");
    setError(null);
    setCurrentTopicIndex(0);

    try {
      for (let i = 0; i < extractedTopics.length; i++) {
        const topic = extractedTopics[i];
        setCurrentTopicIndex(i);

        // Create topic
        const createResponse = await apiCallForSpaHelper({
          method: "POST",
          url: "/api/workspaces/provider/topics/create",
          body: {
            name: topic.name,
            subject_id: subjectId,
            grade_level: parseInt(gradeLevel),
            ai_summary: topic.aiSummary || "",
            pdf_s3_key: pdfS3Key,
            pdf_page_start: topic.pageStart,
            pdf_page_end: topic.pageEnd,
            total_pdf_pages: totalPdfPages,
          },
        });

        if (createResponse.status !== 200 && createResponse.status !== 201) {
          throw new Error(`Failed to create topic: ${topic.name}`);
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setStage("complete");
      setTimeout(() => {
        onSuccess?.();
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
    if (stage === "uploading" || stage === "analyzing" || stage === "creating") {
      return; // Prevent closing during processing
    }

    // Reset state
    setSelectedFile(null);
    setStage("select");
    setError(null);
    setExtractedTopics([]);
    setUploadProgress(0);
    setPdfS3Key(null);
    setTotalPdfPages(null);
    setCurrentTopicIndex(0);
    setSubjectId("");
    setGradeLevel("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

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
              Books Bulk Topic Upload
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload a PDF book and extract topics automatically using AI
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={
              stage === "uploading" || stage === "analyzing" || stage === "creating"
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <PiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stage: Select File */}
          {stage === "select" && (
            <>
              {/* Subject and Grade Selection */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select subject</option>
                    <option value="1">Mathematics</option>
                    <option value="2">Physics</option>
                    <option value="3">Chemistry</option>
                    <option value="4">Biology</option>
                    <option value="5">History</option>
                  </select>
                </div>
                <div>
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
              </div>

              {/* File Upload Area */}
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <PiFilePdf className="w-16 h-16 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-700">
                    <span className="font-semibold">Click to upload</span> or drag and
                    drop
                  </p>
                  <p className="text-xs text-gray-500">PDF only (MAX 100MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Selected File */}
              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <PiFilePdf className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <PiWarning className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
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
                        4. Click "Create Topics" to add them to your library
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Stage: Uploading */}
          {stage === "uploading" && (
            <div className="text-center py-12">
              <PiUpload className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Uploading PDF...
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please wait while we upload your file
              </p>
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
            </div>
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
                {extractedTopics.length} topics have been added to your library
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
              stage === "uploading" || stage === "analyzing" || stage === "creating"
            }
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-gray-700 font-medium disabled:opacity-50 transition-colors"
          >
            {stage === "complete" ? "Close" : "Cancel"}
          </button>

          {stage === "select" && selectedFile && subjectId && gradeLevel && (
            <button
              onClick={handleUploadAndAnalyze}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <PiUpload className="w-5 h-5" />
              Analyze PDF
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
