"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PiBookOpen, PiBrain, PiListChecks, PiX } from "react-icons/pi";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { Topic } from "@stuwin/shared/types/domain/Topic.types";
import { ProviderPdfTopicExtractorWidget } from "./ProviderPdfTopicExtractor.widget";
import { TestGenerationModal } from "./TestGeneration.modal";
import { ProviderAiGuideModalWidget } from "./ProviderAiGuideModal.widget";
import type { SubjectPdf, Subject } from "./ProviderSubjectDetail.widget";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoader.tile";
import { Card } from "@/app/primitives/Card.primitive";
import { Button } from "@/app/primitives/Button.primitive";

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
            pdfFileName: selectedPdf ? selectedPdf.pdfUrl.split("/").pop() : null,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden
        bg-white dark:bg-app-dark-blue/95 border-black/10 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-app-dark-blue dark:text-white">{t("bulkCreateTopics")}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <PiX className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-app p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* PDF Selector */}
          {pdfs.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                {t("selectPdf")}{" "}
                <span className="text-app-dark-blue/40 dark:text-white/40">({t("optional")})</span>
              </label>
              <select
                value={selectedPdfId || ""}
                onChange={(e) => setSelectedPdfId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
              >
                <option value="">{t("noPdfSelected")}</option>
                {pdfs.map((pdf) => (
                  <option key={pdf.id} value={pdf.id}>
                    PDF #{pdf.id} - {pdf.pdfOrder || t("noOrder")}
                  </option>
                ))}
              </select>
              {selectedPdfId && (
                <p className="text-xs text-app-bright-green mt-2">{t("pdfWillBeLinked")}</p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">{t("format")}</label>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFormat("text")}
                className={`px-4 py-2 rounded-app text-sm font-semibold transition-colors ${format === "text"
                  ? "bg-app-bright-green/20 text-app-bright-green border-2 border-app-bright-green/50"
                  : "border border-black/10 dark:border-white/10 text-app-dark-blue/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
              >
                {t("textFormat")}
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`px-4 py-2 rounded-app text-sm font-semibold transition-colors ${format === "json"
                  ? "bg-app-bright-green/20 text-app-bright-green border-2 border-app-bright-green/50"
                  : "border border-black/10 dark:border-white/10 text-app-dark-blue/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
              >
                {t("jsonFormat")}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">{t("instructions")}</label>
            <div className="rounded-app p-3 text-sm
              bg-app-bright-green/5 dark:bg-app-bright-green/10
              border border-app-bright-green/20
              text-app-dark-blue/80 dark:text-white/80 mb-4">
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
            <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
              {t("topicsList")} <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 rounded-app text-sm font-mono outline-none transition-colors border
                border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                text-app-dark-blue dark:text-white focus:border-app-bright-green"
              placeholder={format === "text" ? t("topicsPlaceholder") : t("jsonPlaceholder")}
              required
            />
            {format === "text" && (
              <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mt-2">
                {t("linesCount")}:{" "}
                {bulkText.split("\n").filter((line) => line.trim()).length}
              </p>
            )}
            {format === "json" && bulkText && (
              <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mt-2">
                {t("jsonPreview")}:{" "}
                {(() => {
                  try {
                    const parsed = JSON.parse(bulkText);
                    const arr = Array.isArray(parsed) ? parsed : parsed.topics || [];
                    return `${arr.length} ${t("topicsDetected")}`;
                  } catch { return t("invalidJson"); }
                })()}
              </p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-black/10 dark:border-white/10">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !bulkText.trim()}>
            {saving ? t("creating") : t("create")}
          </Button>
        </div>
      </Card>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden
        bg-white dark:bg-app-dark-blue/95 border-black/10 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
          <h3 className="text-xl font-bold text-app-dark-blue dark:text-white">{t("editTopic")}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <PiX className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-app text-sm
              bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700
              text-red-700 dark:text-red-400">
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
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                placeholder={t("topicNamePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                {t("topicDescription")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                placeholder={t("topicDescriptionPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                {t("language")}
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
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
                <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
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
                  className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                  placeholder={t("gradeLevelPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                  {t("chapterNumber")}
                </label>
                <input
                  type="text"
                  value={formData.chapterNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, chapterNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                  placeholder={t("chapterNumberPlaceholder")}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                {t("aiSummary")}
              </label>
              <textarea
                value={formData.aiSummary}
                onChange={(e) =>
                  setFormData({ ...formData, aiSummary: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                placeholder={t("aiSummaryPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                {t("aiGuide")}
              </label>
              <textarea
                value={formData.aiGuide}
                onChange={(e) =>
                  setFormData({ ...formData, aiGuide: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-app focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={t("aiGuidePlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-500">{t("aiGuideHelp")}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
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
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                placeholder={t("estimatedQuestionsPlaceholder")}
              />
            </div>

            {formData.pdfDetails?.pages && (
              <div className="rounded-app p-3 flex items-center gap-2
              bg-app-bright-green/10 dark:bg-app-bright-green/15
              border border-app-bright-green/30">
                <span className="text-sm font-semibold text-app-dark-blue dark:text-white">{t("pdfPages")}:</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold
                bg-app-bright-green/20 text-app-bright-green">
                  {formData.pdfDetails.pages.start} – {formData.pdfDetails.pages.end}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                  {t("pdfPageStart")}
                </label>
                <input
                  type="number"
                  value={formData.pdfPageStart}
                  onChange={(e) =>
                    setFormData({ ...formData, pdfPageStart: e.target.value })
                  }
                  min="1"
                  className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                  placeholder={t("pdfPageStartPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
                  {t("pdfPageEnd")}
                </label>
                <input
                  type="number"
                  value={formData.pdfPageEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, pdfPageEnd: e.target.value })
                  }
                  min="1"
                  className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
                  placeholder={t("pdfPageEndPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70">
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
                className="w-full px-3 py-2 rounded-app text-sm outline-none transition-colors border
                  border-black/10 dark:border-white/10 bg-white dark:bg-white/5
                  text-app-dark-blue dark:text-white focus:border-app-bright-green"
              />
            </div>

            <div className="rounded-app p-4 border border-black/10 dark:border-white/10 bg-black/3 dark:bg-white/5">
              <h4 className="text-sm font-bold text-app-dark-blue dark:text-white mb-2">{t("statistics")}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-app-dark-blue/50 dark:text-white/50">{t("publishedQuestions")}:</span>
                  <span className="ml-2 font-semibold text-app-dark-blue dark:text-white">{topic.topicPublishedQuestionsStats}</span>
                </div>
                <div>
                  <span className="text-app-dark-blue/50 dark:text-white/50">{t("generalQuestions")}:</span>
                  <span className="ml-2 font-semibold text-app-dark-blue dark:text-white">{topic.topicGeneralQuestionsStats}</span>
                </div>
                <div>
                  <span className="text-app-dark-blue/50 dark:text-white/50">{t("remainingToGenerate")}:</span>
                  <span className="ml-2 font-semibold text-app-dark-blue dark:text-white">{topic.topicQuestionsRemainingToGenerate ?? "N/A"}</span>
                </div>
                {topic.totalPdfPages && (
                  <div>
                    <span className="text-app-dark-blue/50 dark:text-white/50">{t("totalPdfPages")}:</span>
                    <span className="ml-2 font-semibold text-app-dark-blue dark:text-white">{topic.totalPdfPages}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-black/10 dark:border-white/10">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </Card>
    </div>
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
        fetchApiUtil<Topic[]>({
          url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics`,
          method: "GET",
        }),
        fetchApiUtil<SubjectPdf[]>({
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
      await fetchApiUtil<unknown>({
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
      await fetchApiUtil<unknown>({
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
    <Card className="mt-4 p-6 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-app-dark-blue dark:text-white">{t("topics")}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-app-dark-blue/50 dark:text-white/50">
            {t("totalTopics")}: <span className="font-semibold text-app-dark-blue dark:text-white">{topics.length}</span>
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBulkCreate(true)}
            >
              {t("bulkCreate")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPdfExtractor(true)}
              className="flex items-center gap-2"
            >
              <PiBookOpen className="w-4 h-4" />
              {t("extractFromPdf")}
            </Button>
          </div>
        </div>
      </div>

      <div className="h-4" />

      {topics.length === 0 ? (
        <div className="py-12 text-center">
          <PiListChecks className="mx-auto w-12 h-12 mb-3 text-app-dark-blue/20 dark:text-white/20" />
          <p className="text-base font-semibold text-app-dark-blue/50 dark:text-white/50">{t("noTopics")}</p>
          <p className="text-sm mt-1 text-app-dark-blue/30 dark:text-white/30">{t("noTopicsDescription")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex flex-col gap-4 p-4 rounded-app border transition-colors
                border-black/10 dark:border-white/10
                hover:border-app-bright-green/30 dark:hover:border-app-bright-green/30
                bg-white/50 dark:bg-white/5"
            >
              {/* Row 1: Order and Name/Info */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center rounded-app px-3 py-2 min-w-[3rem] shrink-0
                  bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                  <span className="text-xs font-bold text-app-dark-blue/50 dark:text-white/50">#{index + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-app-dark-blue dark:text-white line-clamp-1" title={topic.name}>
                    {topic.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-app-dark-blue/50 dark:text-white/50 mt-1">
                    {topic.chapterNumber && (
                      <span>{t("chapter")}: {topic.chapterNumber}</span>
                    )}
                    {topic.description && (
                      <span className="line-clamp-1 text-app-dark-blue/40 dark:text-white/40 border-l pl-4 border-black/10 dark:border-white/10">
                        {topic.description}
                      </span>
                    )}
                  </div>

                  {/* Mismatch Markers */}
                  {(topic.language && subject.language && topic.language !== subject.language || topic.gradeLevel !== null && subject.gradeLevel !== null && topic.gradeLevel !== subject.gradeLevel) && (
                    <div className="flex gap-2 mt-2">
                      {topic.language && subject.language && topic.language !== subject.language && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                          bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          {t("languageMismatch")} ({topic.language.toUpperCase()})
                        </span>
                      )}
                      {topic.gradeLevel !== null && subject.gradeLevel !== null && topic.gradeLevel !== subject.gradeLevel && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                          bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {t("gradeMismatch")} ({topic.gradeLevel})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Stats */}
              <div className="rounded-app p-3 bg-black/3 dark:bg-white/5 border border-black/8 dark:border-white/8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-app-dark-blue/70 dark:text-white/70">
                  {topic.gradeLevel && (
                    <div className="flex flex-col">
                      <span className="text-app-dark-blue/40 dark:text-white/40 mb-0.5 text-[10px] uppercase tracking-wider">{t("grade")}</span>
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
                      <span className="text-app-dark-blue/40 dark:text-white/40 mb-0.5 text-[10px] uppercase tracking-wider">{t("capacity")}</span>
                      <span className="font-semibold">{topic.topicEstimatedQuestionsCapacity}</span>
                    </div>
                  )}
                  {/* PDF Details integrated into stats row or strictly next to it? Let's put in grid if fits or separate line inside this box */}
                  {(topic.pdfDetails?.pages || topic.pdfDetails?.fileName) && (
                    <div className="flex flex-col">
                      <span className="text-app-dark-blue/40 dark:text-white/40 mb-0.5 text-[10px] uppercase tracking-wider">{t("pdfPages")}</span>
                      <span className="font-semibold truncate" title={topic.pdfDetails.fileName || ""}>
                        {topic.pdfDetails.pages ? `${topic.pdfDetails.pages.start}-${topic.pdfDetails.pages.end}` : "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onShowQuestions(topic.id, topic.name)}
                  className="flex items-center gap-2"
                >
                  <PiListChecks className="w-4 h-4" />
                  {t("showQuestions")}
                </Button>
                <Button
                  size="sm"
                  variant={topic.isActiveAiGeneration ? "secondary" : "outline"}
                  onClick={() => handleToggleAi(topic.id, topic.isActiveAiGeneration)}
                  className={topic.isActiveAiGeneration ? "" : "opacity-70 hover:opacity-100"}
                >
                  {topic.isActiveAiGeneration ? t("aiActive") : t("aiInactive")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGenerateTests(topic)}
                  disabled={!topic.isActiveAiGeneration}
                  className="flex items-center gap-2"
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
                </Button>

                <div className="flex-1" /> {/* Spacer */}

                <Button
                  size="sm"
                  variant={topic.aiGuide ? "secondary" : "outline"}
                  onClick={() => setActiveAiGuideTopic(topic)}
                  className={`flex items-center gap-2 ${topic.aiGuide ? "" : "opacity-70 hover:opacity-100"}`}
                  title={t("manageAiGuide")}
                >
                  <PiBrain className={topic.aiGuide ? "fill-current" : ""} />
                  <span className="hidden sm:inline">{t("manageAiGuide")}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditClick(topic)}
                >
                  {t("edit")}
                </Button>
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
    </Card>
  );
}
