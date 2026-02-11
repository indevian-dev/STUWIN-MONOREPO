"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { PiBookOpen } from "react-icons/pi";
import { apiCallForSpaHelper } from "@/lib/utils/http/SpaApiClient";
import { Topic } from "@/types";
import { ProviderPdfTopicExtractorWidget } from "./ProviderPdfTopicExtractorWidget";
import { TestGenerationModal } from "./TestGenerationModal";
import { ProviderCribModalWidget } from "../../topics/(widgets)/ProviderCribModalWidget";
import { PiBrain } from "react-icons/pi";
import type { SubjectPdf, Subject } from "./ProviderSubjectDetailWidget";

interface SubjectTopicsSectionProps {
  workspaceId: string;
  subjectId: string;
  subject: Subject;
  topics: Topic[];
  pdfs: SubjectPdf[];
  onUpdate: (topicId: string, data: Partial<Topic>) => Promise<void>;
  onTopicsCreated?: () => Promise<void>;
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

          topics = topicsArray.map((item: any) => ({
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
            aiAssistantCrib: item.aiAssistantCrib || null,
            providerSubjectId: subjectId,
          }));

          // Validate that all topics have names
          if (topics.some((t) => !t.name || !t.name.trim())) {
            setError(t("jsonMissingNames"));
            return;
          }
        } catch (jsonError) {
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
// - isActiveForAi, aiSummary, aiAssistantCrib`}
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
    pdfPageStart: topic.pdfPageStart?.toString() || "",
    pdfPageEnd: topic.pdfPageEnd?.toString() || "",
    estimatedEducationStartDate: topic.estimatedEducationStartDate
      ? new Date(topic.estimatedEducationStartDate).toISOString().slice(0, 16)
      : "",
    aiAssistantCrib: topic.aiAssistantCrib || "",
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
        estimatedEducationStartDate:
          formData.estimatedEducationStartDate || null,
        aiAssistantCrib: formData.aiAssistantCrib || null,
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
                {t("aiAssistantCrib")}
              </label>
              <textarea
                value={formData.aiAssistantCrib}
                onChange={(e) =>
                  setFormData({ ...formData, aiAssistantCrib: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={t("aiAssistantCribPlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-500">{t("aiAssistantCribHelp")}</p>
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
  topics,
  pdfs,
  onUpdate,
  onTopicsCreated,
}: SubjectTopicsSectionProps) {
  const t = useTranslations("SubjectTopicsSection");
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [showPdfExtractor, setShowPdfExtractor] = useState(false);
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics);
  const [generatingTestsFor, setGeneratingTestsFor] = useState<Topic | null>(null);
  const [activeCribTopic, setActiveCribTopic] = useState<Topic | null>(null);

  // Update local topics when props change
  useState(() => {
    setLocalTopics(topics);
  });


  const handleToggleAi = async (topic: Topic) => {
    try {
      await onUpdate(topic.id, { isActiveAiGeneration: !topic.isActiveAiGeneration });
    } catch (err) {
      console.error("Failed to toggle AI status:", err);
    }
  };

  const handleEditClick = (topic: Topic) => {
    setEditingTopic(topic);
  };

  const handleSaveTopic = async (data: Partial<Topic>) => {
    if (!editingTopic) return;
    await onUpdate(editingTopic.id, data);
  };

  const handleBulkCreate = async (newTopics: Partial<Topic>[]) => {
    try {
      const response = await apiCallForSpaHelper({
        method: "POST",
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/create`,
        body: { topics: newTopics },
      });

      if (response.data?.success) {
        if (onTopicsCreated) {
          await onTopicsCreated();
        }
        setShowBulkCreate(false);
      } else {
        throw new Error(response.data?.error || "Failed to create topics");
      }
    } catch (err) {
      console.error("Failed to bulk create topics:", err);
      throw err; // Propagate to modal to show error
    }
  };

  const handleGenerateTests = (topic: Topic) => {
    setGeneratingTestsFor(topic);
  };

  const handleGenerationSuccess = async () => {
    // Refresh topics to get updated stats
    if (onTopicsCreated) {
      await onTopicsCreated();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t("topics")}</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {t("totalTopics")}:{" "}
            <span className="font-semibold">{localTopics.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkCreate(true)}
              className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm font-medium transition-colors"
            >
              {t("bulkCreate")}
            </button>
            <button
              onClick={() => setShowPdfExtractor(true)}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PiBookOpen className="w-4 h-4" />
              {t("extractFromPdf")}
            </button>
          </div>
        </div>
      </div>

      <div className="h-4" />

      {localTopics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">{t("noTopics")}</p>
          <p className="text-sm mt-2">{t("noTopicsDescription")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localTopics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 min-w-[3rem]">
                <span className="text-xs font-bold text-gray-500">
                  #{index + 1}
                </span>
              </div>

              {/* Topic Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2" title={topic.name}>
                      {topic.name}
                    </h3>
                    {topic.chapterNumber && (
                      <p className="text-sm text-gray-600 mt-1">
                        {t("chapter")}: {topic.chapterNumber}
                      </p>
                    )}

                    {/* Mismatch Markers */}
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
                  </div>

                  {topic.description && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {topic.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600 mb-3">
                    {topic.gradeLevel && (
                      <div>
                        <span className="font-medium">{t("grade")}:</span>{" "}
                        {topic.gradeLevel}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{t("questions")}:</span>{" "}
                      {(topic.questionsStats as any)?.total || 0}
                    </div>
                    {(topic as any).topicEstimatedQuestionsCapacity && (
                      <div>
                        <span className="font-medium">{t("capacity")}:</span>{" "}
                        {(topic as any).topicEstimatedQuestionsCapacity}
                      </div>
                    )}
                  </div>

                  {(topic.pdfDetails?.pages || topic.pdfDetails?.fileName) && (
                    <div className="text-xs text-gray-600 mb-3">
                      <span className="font-medium">{t("pdf")}:</span>{" "}
                      {topic.pdfDetails.fileName}
                      {topic.pdfDetails.pages?.start && ` (${t("pages")}: ${topic.pdfDetails.pages.start}-${topic.pdfDetails.pages.end})`}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      onClick={() => handleToggleAi(topic)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${topic.isActiveAiGeneration
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      {topic.isActiveAiGeneration ? t("aiActive") : t("aiInactive")}
                    </button>
                    <button
                      onClick={() => handleEditClick(topic)}
                      className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => setActiveCribTopic(topic)}
                      className={`px-3 py-1.5 border rounded text-sm font-medium transition-colors flex items-center gap-2 ${topic.aiAssistantCrib
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      title={t("manageCrib")}
                    >
                      <PiBrain className={topic.aiAssistantCrib ? "fill-current" : ""} />
                    </button>
                    <button
                      onClick={() => handleGenerateTests(topic)}
                      disabled={!topic.isActiveAiGeneration}
                      className="px-4 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  </div>
                </div>
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

      {/* Crib Modal */}
      {
        activeCribTopic && (
          <ProviderCribModalWidget
            isOpen={!!activeCribTopic}
            entityType="topic"
            entityId={activeCribTopic.id}
            currentCrib={activeCribTopic.aiAssistantCrib || null}
            onClose={() => setActiveCribTopic(null)}
            onSuccess={() => {
              // Trigger refresh or update local state
              if (onTopicsCreated) onTopicsCreated();
              setActiveCribTopic(null);
            }}
          />
        )
      }
    </div >
  );
}
