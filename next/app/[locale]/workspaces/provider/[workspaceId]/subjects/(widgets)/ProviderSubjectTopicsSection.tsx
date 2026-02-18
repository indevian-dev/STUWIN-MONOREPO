"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PiBookOpen, PiBrain, PiListChecks } from "react-icons/pi";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import { Topic } from "@stuwin/shared/types";
import { ProviderPdfTopicExtractorWidget } from "./ProviderPdfTopicExtractorWidget";
import { TestGenerationModal } from "./TestGenerationModal";
import { ProviderAiGuideModalWidget } from "./ProviderAiGuideModalWidget";
import type { SubjectPdf, Subject } from "./ProviderSubjectDetailWidget";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";

interface SubjectTopicsSectionProps {
  workspaceId: string;
  subjectId: string;
  subject: Subject;
  onShowQuestions: (topicId: string, topicName: string) => void;
}

interface TopicEditModalProps {
  topic: Topic;
  onSave: (data: Partial<Topic>) => Promise<void>;
  onClose: () => void;
}

interface BulkTopicCreateModalProps {
  subjectId: string;
  pdfs: SubjectPdf[];
  onSave: (topics: Partial<Topic>[]) => Promise<void>;
  onClose: () => void;
}

interface RawTopicImport {
  name?: string;
  title?: string;
  description?: string;
  body?: string;
  gradeLevel?: number;
  grade?: number;
  chapterNumber?: string;
  chapter?: string;
  aiSummary?: string;
  topicEstimatedQuestionsCapacity?: number;
  capacity?: number;
  pdfPageStart?: number;
  start_page?: number;
  pdfPageEnd?: number;
  end_page?: number;
  estimatedEducationStartDate?: string;
  isActiveAiGeneration?: boolean;
  aiGuide?: string;
  [key: string]: unknown;
}

function BulkTopicCreateModal({
  subjectId,
  pdfs,
  onSave,
  onClose,
}: BulkTopicCreateModalProps) {
  const t = useTranslations("BulkTopicCreateModal");
  const [bulkText, setBulkText] = useState("");
  const [format, setFormat] = useState<"text" | "json">("text");
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkText.trim()) {
      setError(t("textRequired"));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let topics: Partial<Topic>[] = [];

      if (format === "text") {
        // Parse topics - each line is a topic
        const lines = bulkText.split("\n").filter((line) => line.trim());
        topics = lines.map((line) => ({
          name: line.trim(),
          providerSubjectId: subjectId,
          isActiveAiGeneration: false,
        }));
      } else {
        // Parse JSON format
        try {
          const parsed = JSON.parse(bulkText);

          // Support both array and object with topics array
          const topicsArray = Array.isArray(parsed)
            ? parsed
            : parsed.topics || [];

          // Get selected PDF's S3 key if a PDF is selected
          const selectedPdf = selectedPdfId
            ? pdfs.find((p) => p.id === selectedPdfId)
            : null;


          topics = topicsArray.map((item: RawTopicImport) => ({
            name: item.name || item.title || "",
            description: item.description || item.body || null,
            gradeLevel: item.gradeLevel || item.grade || null,
            chapterNumber: item.chapterNumber || item.chapter || null,
            aiSummary: item.aiSummary || null,
            topicEstimatedQuestionsCapacity:
              item.topicEstimatedQuestionsCapacity || item.capacity || null,
            pdfPageStart: item.pdfPageStart || item.start_page || null,
            pdfPageEnd: item.pdfPageEnd || item.end_page || null,
            pdfS3Key: selectedPdf?.pdfUrl || null,
            estimatedEducationStartDate:
              item.estimatedEducationStartDate || null,
            isActiveAiGeneration:
              item.isActiveAiGeneration !== undefined ? item.isActiveAiGeneration : false,
            aiGuide: item.aiGuide || null,
            providerSubjectId: subjectId,
          }));

          // Validate that all topics have names
          if (topics.some((t) => !t.name || !t.name.trim())) {
            setError(t("jsonMissingNames"));
            return;
          }
        } catch {
          setError(t("invalidJson"));
          return;
        }
      }

      if (topics.length === 0) {
        setError(t("noTopicsFound"));
        return;
      }

      await onSave(topics);
      onClose();
    } catch (err) {
      setError(t("errorSaving"));
      console.error("Failed to create topics:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold">{t("bulkCreateTopics")}</h3>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* PDF Selector */}
          {pdfs.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("selectPdf")}{" "}
                <span className="text-gray-500">({t("optional")})</span>
              </label>
              <select
                value={selectedPdfId || ""}
                onChange={(e) => setSelectedPdfId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("noPdfSelected")}</option>
                {pdfs.map((pdf) => (
                  <option key={pdf.id} value={pdf.id}>
                    PDF #{pdf.id} - {pdf.pdfOrder || t("noOrder")}
                  </option>
                ))}
              </select>
              {selectedPdfId && (
                <p className="text-xs text-blue-600 mt-2">
                  {t("pdfWillBeLinked")}
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("format")}
            </label>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFormat("text")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${format === "text"
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                  }`}
              >
                {t("textFormat")}
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${format === "json"
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                  }`}
              >
                {t("jsonFormat")}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("instructions")}
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
              {format === "text" ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>{t("instruction1")}</li>
                  <li>{t("instruction2")}</li>
                  <li>{t("instruction3")}</li>
                </ul>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">{t("jsonInstructions")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>{t("jsonInstruction1")}</li>
                    <li>{t("jsonInstruction2")}</li>
                  </ul>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium hover:text-blue-900">
                      {t("jsonExample")}
                    </summary>
                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                      {`[
  {
    "title": "Function and its Presentation Methods",
    "start_page": 7,
    "end_page": 11
  },
  {
    "name": "Properties of Functions",
    "gradeLevel": 9,
    "chapterNumber": "2"
  }
]

// Supported fields:
// - name or title (required)
// - start_page or pdfPageStart
// - end_page or pdfPageEnd
// - body, gradeLevel, chapterNumber
// - isActiveForAi, aiSummary, aiGuide`}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("topicsList")} <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={
                format === "text"
                  ? t("topicsPlaceholder")
                  : t("jsonPlaceholder")
              }
              required
            />
            {format === "text" && (
              <p className="text-xs text-gray-500 mt-2">
                {t("linesCount")}:{" "}
                {bulkText.split("\n").filter((line) => line.trim()).length}
              </p>
            )}
            {format === "json" && bulkText && (
              <p className="text-xs text-gray-500 mt-2">
                {t("jsonPreview")}:{" "}
                {(() => {
                  try {
                    const parsed = JSON.parse(bulkText);
                    const arr = Array.isArray(parsed)
                      ? parsed
                      : parsed.topics || [];
                    return `${arr.length} ${t("topicsDetected")}`;
                  } catch {
                    return t("invalidJson");
                  }
                })()}
              </p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !bulkText.trim()}
            className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t("creating") : t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TopicEditModalProps {
  topic: Topic;
  onSave: (data: Partial<Topic>) => Promise<void>;
  onClose: () => void;
}

function TopicEditModal({ topic, onSave, onClose }: TopicEditModalProps) {
  const t = useTranslations("TopicEditModal");
  const [formData, setFormData] = useState({
    name: topic.name || "",
    description: topic.description || "",
    gradeLevel: topic.gradeLevel?.toString() || "",
    language: topic.language || "",
    aiSummary: topic.aiSummary || "",
    chapterNumber: topic.chapterNumber || "",
    topicEstimatedQuestionsCapacity:
      topic.topicEstimatedQuestionsCapacity?.toString() || "",
    pdfPageStart: (topic.pdfDetails?.pages?.start ?? topic.pdfPageStart)?.toString() || "",
    pdfPageEnd: (topic.pdfDetails?.pages?.end ?? topic.pdfPageEnd)?.toString() || "",
    estimatedEducationStartDate: topic.estimatedEducationStartDate
      ? new Date(topic.estimatedEducationStartDate).toISOString().slice(0, 16)
      : "",
    aiGuide: topic.aiGuide || "",
    questionsStats: topic.questionsStats || null,
    pdfDetails: topic.pdfDetails || null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const updateData: Partial<Topic> = {
        name: formData.name,
        description: formData.description || null,
        gradeLevel: formData.gradeLevel ? parseInt(formData.gradeLevel) : null,
        language: formData.language || null,
        aiSummary: formData.aiSummary || null,
        chapterNumber: formData.chapterNumber || null,
        topicEstimatedQuestionsCapacity:
          formData.topicEstimatedQuestionsCapacity
            ? parseInt(formData.topicEstimatedQuestionsCapacity)
            : null,
        pdfPageStart: formData.pdfPageStart
          ? parseInt(formData.pdfPageStart)
          : null,
        pdfPageEnd: formData.pdfPageEnd ? parseInt(formData.pdfPageEnd) : null,
        pdfDetails: (formData.pdfPageStart && formData.pdfPageEnd) ? {
          pages: {
            start: parseInt(formData.pdfPageStart),
            end: parseInt(formData.pdfPageEnd),
          },
        } : formData.pdfDetails,
        estimatedEducationStartDate:
          formData.estimatedEducationStartDate || null,
        aiGuide: formData.aiGuide || null,
      };

      await onSave(updateData);
      onClose();
    } catch (err) {
      setError(t("errorSaving"));
      console.error("Failed to save topic:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold">{t("editTopic")}</h3>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("topicName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("topicNamePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("topicDescription")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("topicDescriptionPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("language")}
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("gradeLevel")}
                </label>
                <input
                  type="number"
                  value={formData.gradeLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeLevel: e.target.value })
                  }
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("gradeLevelPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("chapterNumber")}
                </label>
                <input
                  type="text"
                  value={formData.chapterNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, chapterNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("chapterNumberPlaceholder")}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("aiSummary")}
              </label>
              <textarea
                value={formData.aiSummary}
                onChange={(e) =>
                  setFormData({ ...formData, aiSummary: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("aiSummaryPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("aiGuide")}
              </label>
              <textarea
                value={formData.aiGuide}
                onChange={(e) =>
                  setFormData({ ...formData, aiGuide: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={t("aiGuidePlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-500">{t("aiGuideHelp")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("estimatedQuestionsCapacity")}
              </label>
              <input
                type="number"
                value={formData.topicEstimatedQuestionsCapacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    topicEstimatedQuestionsCapacity: e.target.value,
                  })
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("estimatedQuestionsPlaceholder")}
              />
            </div>

            {formData.pdfDetails?.pages && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700">{t("pdfPages")}:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                  {formData.pdfDetails.pages.start} – {formData.pdfDetails.pages.end}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pdfPageStart")}
                </label>
                <input
                  type="number"
                  value={formData.pdfPageStart}
                  onChange={(e) =>
                    setFormData({ ...formData, pdfPageStart: e.target.value })
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("pdfPageStartPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pdfPageEnd")}
                </label>
                <input
                  type="number"
                  value={formData.pdfPageEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, pdfPageEnd: e.target.value })
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("pdfPageEndPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("estimatedEducationStartDate")}
              </label>
              <input
                type="datetime-local"
                value={formData.estimatedEducationStartDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedEducationStartDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {t("statistics")}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("publishedQuestions")}:
                  </span>
                  <span className="ml-2 font-medium">
                    {topic.topicPublishedQuestionsStats}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("generalQuestions")}:
                  </span>
                  <span className="ml-2 font-medium">
                    {topic.topicGeneralQuestionsStats}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("remainingToGenerate")}:
                  </span>
                  <span className="ml-2 font-medium">
                    {topic.topicQuestionsRemainingToGenerate ?? "N/A"}
                  </span>
                </div>
                {topic.totalPdfPages && (
                  <div>
                    <span className="text-gray-600">{t("totalPdfPages")}:</span>
                    <span className="ml-2 font-medium">
                      {topic.totalPdfPages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div >
    </div >
  );
}

export function SubjectTopicsSection({
  workspaceId,
  subjectId,
  subject,
  onShowQuestions,
}: SubjectTopicsSectionProps) {
  const t = useTranslations("SubjectTopicsSection");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pdfs, setPdfs] = useState<SubjectPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [showPdfExtractor, setShowPdfExtractor] = useState(false);
  const [generatingTestsFor, setGeneratingTestsFor] = useState<Topic | null>(null);
  const [activeAiGuideTopic, setActiveAiGuideTopic] = useState<Topic | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsData, pdfsData] = await Promise.all([
        apiCall<Topic[]>({
          url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics`,
          method: "GET",
        }),
        apiCall<SubjectPdf[]>({
          url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/pdfs`,
          method: "GET",
        }),
      ]);

      setTopics(topicsData ?? []);
      setPdfs(pdfsData ?? []);
    } catch (err) {
      console.error("Failed to fetch topics/pdfs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleUpdateTopic = async (topicId: string, updatedData: Partial<Topic>) => {
    try {
      await apiCall<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${topicId}/update`,
        method: "PUT",
        body: updatedData,
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to update topic:", err);
      throw err;
    }
  };

  const handleToggleAi = async (topicId: string, currentState: boolean | null) => {
    try {
      const newState = !currentState;
      await handleUpdateTopic(topicId, { isActiveAiGeneration: newState });
    } catch (err) {
      console.error("Failed to toggle AI status:", err);
    }
  };

  const handleEditClick = (topic: Topic) => {
    setEditingTopic(topic);
  };

  const handleSaveTopic = async (data: Partial<Topic>) => {
    if (!editingTopic) return;
    await handleUpdateTopic(editingTopic.id, data);
  };

  const handleBulkCreate = async (newTopics: Partial<Topic>[]) => {
    try {
      await apiCall<any>({
        method: "POST",
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/create`,
        body: { topics: newTopics },
      });
      await fetchData();
      setShowBulkCreate(false);
    } catch (err) {
      console.error("Failed to bulk create topics:", err);
      throw err;
    }
  };

  const handleGenerateTests = (topic: Topic) => {
    setGeneratingTestsFor(topic);
  };

  const handleGenerationSuccess = async () => {
    await fetchData();
  };

  if (loading && topics.length === 0) {
    return <GlobalLoaderTile message={t("loadingTopics")} />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t("topics")}</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {t("totalTopics")}:{" "}
            <span className="font-semibold">{topics.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkCreate(true)}
              className="px-4 py-2 bg-brand hover:bg-brand/80 text-brand-secondary rounded text-sm font-medium transition-colors"
            >
              {t("bulkCreate")}
            </button>
            <button
              onClick={() => setShowPdfExtractor(true)}
              className="px-4 py-2 bg-brand-secondary hover:bg-brand-secondary/80 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PiBookOpen className="w-4 h-4" />
              {t("extractFromPdf")}
            </button>
          </div>
        </div>
      </div>

      <div className="h-4" />

      {topics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">{t("noTopics")}</p>
          <p className="text-sm mt-2">{t("noTopicsDescription")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Row 1: Order and Name/Info */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 min-w-[3rem] shrink-0">
                  <span className="text-xs font-bold text-gray-500">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={topic.name}>
                    {topic.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                    {topic.chapterNumber && (
                      <span>{t("chapter")}: {topic.chapterNumber}</span>
                    )}
                    {topic.description && (
                      <span className="line-clamp-1 text-gray-500 border-l pl-4 border-gray-300">
                        {topic.description}
                      </span>
                    )}
                  </div>

                  {/* Mismatch Markers */}
                  {(topic.language && subject.language && topic.language !== subject.language || topic.gradeLevel !== null && subject.gradeLevel !== null && topic.gradeLevel !== subject.gradeLevel) && (
                    <div className="flex gap-2 mt-2">
                      {topic.language && subject.language && topic.language !== subject.language && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={t("languageMismatch")}>
                          {t("languageMismatch")} ({topic.language.toUpperCase()})
                        </span>
                      )}
                      {topic.gradeLevel !== null && subject.gradeLevel !== null && topic.gradeLevel !== subject.gradeLevel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title={t("gradeMismatch")}>
                          {t("gradeMismatch")} ({topic.gradeLevel})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Stats */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700">
                  {topic.gradeLevel && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider">{t("grade")}</span>
                      <span className="font-semibold">{topic.gradeLevel}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider">{t("questions")}</span>
                    <span className="font-semibold">{topic.questionsStats?.total || 0}</span>
                  </div>
                  {/* Only show capacity if it exists */}
                  {topic.topicEstimatedQuestionsCapacity && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider">{t("capacity")}</span>
                      <span className="font-semibold">{topic.topicEstimatedQuestionsCapacity}</span>
                    </div>
                  )}
                  {/* PDF Details integrated into stats row or strictly next to it? Let's put in grid if fits or separate line inside this box */}
                  {(topic.pdfDetails?.pages || topic.pdfDetails?.fileName) && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider">{t("pdfPages")}</span>
                      <span className="font-semibold truncate" title={topic.pdfDetails.fileName || ""}>
                        {topic.pdfDetails.pages ? `${topic.pdfDetails.pages.start}-${topic.pdfDetails.pages.end}` : "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onShowQuestions(topic.id, topic.name)}
                  className="px-3 py-1.5 bg-brand-secondary text-white hover:bg-brand-secondary/80 text-sm font-medium rounded transition-colors flex items-center gap-2"
                >
                  <PiListChecks className="w-4 h-4" />
                  {t("showQuestions")}
                </button>
                <button
                  onClick={() => handleToggleAi(topic.id, topic.isActiveAiGeneration)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${topic.isActiveAiGeneration
                    ? "bg-brand-secondary/50 text-brand-secondary border-brand-secondary hover:bg-brand-secondary/80"
                    : "bg-brand-secondary/20 text-brand-secondary border-brand-secondary hover:bg-brand-secondary/70 hover:text-white"
                    }`}
                >
                  {topic.isActiveAiGeneration ? t("aiActive") : t("aiInactive")}
                </button>
                <button
                  onClick={() => handleGenerateTests(topic)}
                  disabled={!topic.isActiveAiGeneration}
                  className="px-3 py-1.5 bg-brand hover:bg-brand-secondary/90 text-brand-secondary rounded text-sm font-medium transition-colors disabled:opacity-90  hover:text-white disabled:cursor-not-allowed flex items-center gap-2"
                  title={!topic.isActiveAiGeneration ? t("aiNotActive") : t("generateTestsTooltip")}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>{t("generateTests")}</span>
                </button>

                <div className="flex-1" /> {/* Spacer */}

                <button
                  onClick={() => setActiveAiGuideTopic(topic)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${topic.aiGuide
                    ? "bg-brand-secondary text-white  hover:bg-brand-secondary/80 hover:text-white"
                    : "bg-brand-secondary/20 text-brand-secondary hover:bg-brand-secondary/70 hover:text-white"
                    }`}
                  title={t("manageAiGuide")}
                >
                  <PiBrain className={topic.aiGuide ? "fill-current" : ""} />
                  <span className="hidden sm:inline">{t("manageAiGuide")}</span>
                </button>
                <button
                  onClick={() => handleEditClick(topic)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
                >
                  {t("edit")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {
        editingTopic && (
          <TopicEditModal
            topic={editingTopic}
            onSave={handleSaveTopic}
            onClose={() => setEditingTopic(null)}
          />
        )
      }

      {/* Bulk Create Modal */}
      {
        showBulkCreate && (
          <BulkTopicCreateModal
            subjectId={subjectId}
            pdfs={pdfs}
            onSave={handleBulkCreate}
            onClose={() => setShowBulkCreate(false)}
          />
        )
      }

      {/* PDF Topic Extractor Modal */}
      {
        showPdfExtractor && (
          <ProviderPdfTopicExtractorWidget
            workspaceId={workspaceId}
            subjectId={subjectId}
            pdfs={pdfs}
            isOpen={showPdfExtractor}
            onClose={() => setShowPdfExtractor(false)}
            onTopicsCreated={handleGenerationSuccess}
          />
        )
      }

      {/* Test Generation Modal */}
      {
        generatingTestsFor && (
          <TestGenerationModal
            workspaceId={workspaceId}
            subjectId={subjectId}
            topicId={generatingTestsFor.id}
            topicName={generatingTestsFor.name}
            onClose={() => setGeneratingTestsFor(null)}
            onSuccess={handleGenerationSuccess}
          />
        )
      }

      {/* AI Guide Modal */}
      {
        activeAiGuideTopic && (
          <ProviderAiGuideModalWidget
            isOpen={!!activeAiGuideTopic}
            entityType="topic"
            entityId={activeAiGuideTopic.id}
            subjectId={subjectId}
            currentAiGuide={activeAiGuideTopic.aiGuide || null}
            onClose={() => setActiveAiGuideTopic(null)}
            onSuccess={() => {
              // Trigger refresh or update local state
              fetchData();
              setActiveAiGuideTopic(null);
            }}
          />
        )
      }
    </div >
  );
}
