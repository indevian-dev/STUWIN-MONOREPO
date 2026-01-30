"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";

interface GeneratedQuestion {
  id?: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: string;
  selected: boolean;
}

interface TestGenerationModalProps {
  workspaceId: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TestGenerationModal({
  workspaceId,
  subjectId,
  topicId,
  topicName,
  onClose,
  onSuccess,
}: TestGenerationModalProps) {
  const t = useTranslations("TestGenerationModal");
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    try {
      setStatus("generating");
      setError(null);
      setGeneratedQuestions([]);

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${topicId}/generate-tests`,
        method: "POST",
      });

      if (response.data?.success && response.data?.data?.questions) {
        const questions = response.data.data.questions.map((q: any) => ({
          ...q,
          selected: true, // All questions selected by default
        }));
        setGeneratedQuestions(questions);
        setStatus("success");
      } else {
        throw new Error(response.data?.error || "Failed to generate tests");
      }
    } catch (err: any) {
      console.error("Failed to generate tests:", err);
      setError(err.message || t("errorGenerating"));
      setStatus("error");
    }
  };

  const handleToggleQuestion = (index: number) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, selected: !q.selected } : q))
    );
  };

  const handleSelectAll = () => {
    setGeneratedQuestions((prev) => prev.map((q) => ({ ...q, selected: true })));
  };

  const handleDeselectAll = () => {
    setGeneratedQuestions((prev) => prev.map((q) => ({ ...q, selected: false })));
  };

  const handleSave = async () => {
    const selectedQuestions = generatedQuestions.filter((q) => q.selected);

    if (selectedQuestions.length === 0) {
      setError(t("noQuestionsSelected"));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${topicId}/questions/create`,
        method: "POST",
        body: { questions: selectedQuestions },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to save questions");
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save questions:", err);
      setError(err.message || t("errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = generatedQuestions.filter((q) => q.selected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold">{t("generateTests")}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t("topicLabel")}: {topicName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={status === "generating" || saving}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
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

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Idle State */}
          {status === "idle" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
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
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("readyToGenerate")}
              </h4>
              <p className="text-gray-600 mb-6">
                {t("generateDescription")}
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                {t("startGeneration")}
              </button>
            </div>
          )}

          {/* Generating State */}
          {status === "generating" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("generating")}
              </h4>
              <p className="text-gray-600">
                {t("generatingDescription")}
              </p>
            </div>
          )}

          {/* Success State - Show Generated Questions */}
          {status === "success" && generatedQuestions.length > 0 && (
            <div>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="text-sm text-gray-600">
                  {t("questionsGenerated")}: <span className="font-semibold">{generatedQuestions.length}</span>
                  {" | "}
                  {t("selected")}: <span className="font-semibold text-purple-600">{selectedCount}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition-colors"
                  >
                    {t("selectAll")}
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded transition-colors"
                  >
                    {t("deselectAll")}
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${question.selected
                        ? "border-purple-300 bg-purple-50/50"
                        : "border-gray-200 bg-gray-50/50"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={question.selected}
                        onChange={() => handleToggleQuestion(index)}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />

                      {/* Question Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">
                            {t("questionLabel")} {index + 1}
                          </h5>
                          {question.difficulty && (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${question.difficulty === "easy"
                                ? "bg-green-100 text-green-700"
                                : question.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                              {question.difficulty}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-800 mb-3">{question.questionText}</p>

                        {/* Options */}
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-start gap-2 p-2 rounded ${optIndex === question.correctAnswer
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-white border border-gray-200"
                                }`}
                            >
                              <span className="font-semibold text-sm text-gray-600 mt-0.5">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="text-sm text-gray-800">{option}</span>
                              {optIndex === question.correctAnswer && (
                                <span className="ml-auto text-xs font-medium text-green-700">
                                  ✓ {t("correct")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-xs font-medium text-blue-900 mb-1">
                              {t("explanation")}:
                            </p>
                            <p className="text-sm text-blue-800">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
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
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("generationFailed")}
              </h4>
              <p className="text-gray-600 mb-6">{error || t("unknownError")}</p>
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                {t("tryAgain")}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "success" && generatedQuestions.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedCount > 0 ? (
                <span>
                  {t("selectedQuestionsInfo").replace("{count}", selectedCount.toString())}
                </span>
              ) : (
                <span className="text-amber-600">
                  {t("noQuestionsSelectedWarning")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {saving ? t("saving") : t("addSelectedTests")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
