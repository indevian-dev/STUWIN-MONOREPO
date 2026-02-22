"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { GlobalMathMarkdownTile } from "@/app/[locale]/(global)/(tiles)/GlobalMathMarkdown.tile";
import { Button } from "@/app/primitives/Button.primitive";
import { PiX } from "react-icons/pi";

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
  const t = useTranslations("TestGeneration.modal");
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [complexityConfig, setComplexityConfig] = useState({
    easy: { enabled: true, count: 2 },
    medium: { enabled: true, count: 2 },
    hard: { enabled: true, count: 1 },
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = (complexityConfig.easy.enabled ? complexityConfig.easy.count : 0)
    + (complexityConfig.medium.enabled ? complexityConfig.medium.count : 0)
    + (complexityConfig.hard.enabled ? complexityConfig.hard.count : 0);

  const toggleComplexity = (level: "easy" | "medium" | "hard") => {
    setComplexityConfig(prev => ({
      ...prev,
      [level]: { ...prev[level], enabled: !prev[level].enabled },
    }));
  };

  const setComplexityCount = (level: "easy" | "medium" | "hard", count: number) => {
    setComplexityConfig(prev => ({
      ...prev,
      [level]: { ...prev[level], count: Math.max(1, Math.min(5, count)) },
    }));
  };

  const handleGenerate = async () => {
    try {
      setStatus("generating");
      setError(null);
      setGeneratedQuestions([]);

      const response = await fetchApiUtil<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${topicId}/generate-tests`,
        method: "POST",
        body: {
          counts: {
            easy: complexityConfig.easy.enabled ? complexityConfig.easy.count : 0,
            medium: complexityConfig.medium.enabled ? complexityConfig.medium.count : 0,
            hard: complexityConfig.hard.enabled ? complexityConfig.hard.count : 0,
          },
        },
      });

      if (true && response?.questions) {
        const questions = response.questions.map((q: GeneratedQuestion) => ({
          ...q,
          selected: true, // All questions selected by default
        }));
        setGeneratedQuestions(questions);
        setStatus("success");
      } else {
        throw new Error("Failed to generate tests");
      }
    } catch (err: unknown) {
      console.error("Failed to generate tests:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t("errorGenerating"));
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

      const response = await fetchApiUtil<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${topicId}/questions/create`,
        method: "POST",
        body: { questions: selectedQuestions },
      });

      if (!true) {
        throw new Error("Failed to save questions");
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save questions:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t("errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = generatedQuestions.filter((q) => q.selected).length;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-app-dark-blue/95 border border-black/10 dark:border-white/10 shadow-2xl rounded-app w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
          <div>
            <h3 className="text-xl font-bold text-app-dark-blue dark:text-white">{t("generateTests")}</h3>
            <p className="text-sm text-app-dark-blue/60 dark:text-white/60 mt-1">
              {t("topicLabel")}: <span className="font-semibold text-app-dark-blue dark:text-white">{topicName}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={status === "generating" || saving}
            className="rounded-full"
          >
            <PiX className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-app p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Idle State */}
          {status === "idle" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-app-full mb-4">
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
              <h4 className="text-lg font-semibold text-app-dark-blue dark:text-white mb-2">
                {t("readyToGenerate")}
              </h4>
              <p className="text-app-dark-blue/60 dark:text-white/60 mb-6">
                {t("generateDescription")}
              </p>

              {/* Complexity Selection */}
              <div className="mb-8 w-full max-w-sm mx-auto space-y-3">
                <p className="text-sm font-medium text-app-dark-blue/80 dark:text-white/80 mb-3 text-left">
                  {t("numberOfQuestions")}:
                </p>

                {/* Easy */}
                <div className={`flex items-center gap-3 p-3 rounded-app border transition-all ${complexityConfig.easy.enabled
                  ? "border-green-300/50 bg-green-50/60 dark:bg-green-500/10"
                  : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-60"
                  }`}>
                  <input
                    type="checkbox"
                    checked={complexityConfig.easy.enabled}
                    onChange={() => toggleComplexity("easy")}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-400 min-w-[52px] text-center">
                    Easy
                  </span>
                  <div className="flex items-center gap-2 ml-auto text-app-dark-blue dark:text-white">
                    <button
                      type="button"
                      disabled={!complexityConfig.easy.enabled || complexityConfig.easy.count <= 1}
                      onClick={() => setComplexityCount("easy", complexityConfig.easy.count - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-app bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-sm">
                      {complexityConfig.easy.enabled ? complexityConfig.easy.count : 0}
                    </span>
                    <button
                      type="button"
                      disabled={!complexityConfig.easy.enabled || complexityConfig.easy.count >= 5}
                      onClick={() => setComplexityCount("easy", complexityConfig.easy.count + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-app bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >+</button>
                  </div>
                </div>

                {/* Medium */}
                <div className={`flex items-center gap-3 p-3 rounded-app border transition-all ${complexityConfig.medium.enabled
                  ? "border-yellow-300/50 bg-yellow-50/60 dark:bg-yellow-500/10"
                  : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-60"
                  }`}>
                  <input
                    type="checkbox"
                    checked={complexityConfig.medium.enabled}
                    onChange={() => toggleComplexity("medium")}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                  />
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 min-w-[52px] text-center">
                    Medium
                  </span>
                  <div className="flex items-center gap-2 ml-auto text-app-dark-blue dark:text-white">
                    <button
                      type="button"
                      disabled={!complexityConfig.medium.enabled || complexityConfig.medium.count <= 1}
                      onClick={() => setComplexityCount("medium", complexityConfig.medium.count - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-app bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-sm">
                      {complexityConfig.medium.enabled ? complexityConfig.medium.count : 0}
                    </span>
                    <button
                      type="button"
                      disabled={!complexityConfig.medium.enabled || complexityConfig.medium.count >= 5}
                      onClick={() => setComplexityCount("medium", complexityConfig.medium.count + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-app bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >+</button>
                  </div>
                </div>

                {/* Hard */}
                <div className={`flex items-center gap-3 p-3 rounded-app border transition-all ${complexityConfig.hard.enabled
                  ? "border-red-300/50 bg-red-50/60 dark:bg-red-500/10"
                  : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-60"
                  }`}>
                  <input
                    type="checkbox"
                    checked={complexityConfig.hard.enabled}
                    onChange={() => toggleComplexity("hard")}
                    className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-400 min-w-[52px] text-center">
                    Hard
                  </span>
                  <div className="flex items-center gap-2 ml-auto text-app-dark-blue dark:text-white">
                    <button
                      type="button"
                      disabled={!complexityConfig.hard.enabled || complexityConfig.hard.count <= 1}
                      onClick={() => setComplexityCount("hard", complexityConfig.hard.count - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-app bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-sm">
                      {complexityConfig.hard.enabled ? complexityConfig.hard.count : 0}
                    </span>
                    <button
                      type="button"
                      disabled={!complexityConfig.hard.enabled || complexityConfig.hard.count >= 5}
                      onClick={() => setComplexityCount("hard", complexityConfig.hard.count + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-app bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    >+</button>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="text-center text-sm text-app-dark-blue/60 dark:text-white/60 pt-2">
                  Total: <span className="font-semibold text-app-bright-green">{totalCount}</span> question{totalCount !== 1 ? "s" : ""}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={totalCount === 0}
              >
                {t("startGeneration")}
              </Button>
            </div>
          )}

          {/* Generating State */}
          {status === "generating" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-app-bright-green/20 rounded-app-full mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-app-bright-green"
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
              <h4 className="text-lg font-semibold text-app-dark-blue dark:text-white mb-2">
                {t("generating")}
              </h4>
              <p className="text-app-dark-blue/60 dark:text-white/60">
                {t("generatingDescription")}
              </p>
            </div>
          )}

          {/* Success State - Show Generated Questions */}
          {status === "success" && generatedQuestions.length > 0 && (
            <div>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/10 dark:border-white/10">
                <div className="text-sm text-app-dark-blue/60 dark:text-white/60">
                  {t("questionsGenerated")}: <span className="font-semibold text-app-dark-blue dark:text-white">{generatedQuestions.length}</span>
                  {" | "}
                  {t("selected")}: <span className="font-semibold text-app-bright-green">{selectedCount}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                  >
                    {t("selectAll")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeselectAll}
                  >
                    {t("deselectAll")}
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className={`border rounded-app p-4 transition-all ${question.selected
                      ? "border-app-bright-green/50 bg-app-bright-green/10"
                      : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={question.selected}
                        onChange={() => handleToggleQuestion(index)}
                        className="mt-1 w-5 h-5 text-app-bright-green rounded focus:ring-2 focus:ring-app-bright-green cursor-pointer"
                      />

                      {/* Question Content */}
                      <div className="flex-1 text-app-dark-blue dark:text-white">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold">
                            {t("questionLabel")} {index + 1}
                          </h5>
                          {question.difficulty && (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${question.difficulty === "easy"
                              ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                              : question.difficulty === "medium"
                                ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                              }`}>
                              {question.difficulty}
                            </span>
                          )}
                        </div>

                        <GlobalMathMarkdownTile
                          content={question.questionText}
                          className="mb-3 text-app-dark-blue/80 dark:text-white/80"
                        />

                        <div className="space-y-2 mb-3">
                          {(question.options || []).map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-start gap-2 p-2 rounded-app transition-colors ${optIndex === question.correctAnswer
                                ? "bg-app-bright-green/20 border border-app-bright-green/50"
                                : "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                                }`}
                            >
                              <span className="font-semibold text-sm text-app-dark-blue/60 dark:text-white/60 mt-0.5">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <GlobalMathMarkdownTile content={option} className="text-sm flex-1 text-app-dark-blue/80 dark:text-white/80" />
                              {optIndex === question.correctAnswer && (
                                <span className="ml-auto text-xs font-medium text-app-bright-green">
                                  ✓ {t("correct")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="bg-app-dark-blue/5 dark:bg-white/5 border border-app-dark-blue/10 dark:border-white/10 rounded-app p-3">
                            <p className="text-xs font-medium text-app-dark-blue/80 dark:text-white/80 mb-1">
                              {t("explanation")}:
                            </p>
                            <GlobalMathMarkdownTile content={question.explanation} className="text-sm text-app-dark-blue/60 dark:text-white/60" />
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-app-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
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
              <h4 className="text-lg font-semibold text-app-dark-blue dark:text-white mb-2">
                {t("generationFailed")}
              </h4>
              <p className="text-app-dark-blue/60 dark:text-white/60 mb-6">{error || t("unknownError")}</p>
              <Button
                onClick={handleGenerate}
              >
                {t("tryAgain")}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "success" && generatedQuestions.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <div className="text-sm text-app-dark-blue/60 dark:text-white/60">
              {selectedCount > 0 ? (
                <span>
                  {t("selectedQuestionsInfo").replace("{count}", selectedCount.toString())}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  {t("noQuestionsSelectedWarning")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
                className="flex items-center gap-2"
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
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
