"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PiPencil, PiTrash, PiSealCheck, PiCaretDown, PiCaretUp, PiBrain, PiSparkle } from "react-icons/pi";
import { ProviderAiGuideModalWidget } from "./ProviderAiGuideModalWidget";
import { VisualGenerationModal } from "./VisualGenerationModal";
import type { QuestionVisualData } from "@/lib/domain/question/visual.types";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import { Question as QuestionType } from "@stuwin/shared/types/domain/question";
import { toast } from "react-toastify";
import { ConsoleLogger } from "@/lib/logging/ConsoleLogger";
import { GlobalMathMarkdownTile } from "@/app/[locale]/(global)/(tiles)/GlobalMathMarkdownTile";

interface ProviderQuestionListItemWidgetProps {
    question: QuestionType.PrivateAccess;
    onUpdate: (question: QuestionType.PrivateAccess) => void;
    onDelete: (questionId: string) => void;
}

export function ProviderQuestionListItemWidget({
    question,
    onUpdate,
    onDelete,
}: ProviderQuestionListItemWidgetProps) {
    const t = useTranslations("ProviderQuestionListItemWidget");
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [aiGuideOpen, setAiGuideOpen] = useState(false);
    const [visualModalOpen, setVisualModalOpen] = useState(false);

    const [editData, setEditData] = useState({
        question: question.question,
        answers: [...question.answers],
        correctAnswer: question.correctAnswer,
    });

    const complexityColors: Record<string, string> = {
        easy: "bg-green-50 text-green-700 border-green-200",
        medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
        hard: "bg-orange-50 text-orange-700 border-orange-200",
        expert: "bg-red-50 text-red-700 border-red-200",
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await apiCall({
                method: "DELETE",
                url: `/api/workspaces/provider/${workspaceId}/questions/delete/${question.id}`,
            });
            onDelete(question.id);
        } catch (err) {
            ConsoleLogger.error("Failed to delete question:", err);
            toast.error("Failed to delete question");
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);
            await apiCall({
                method: "PUT",
                url: `/api/workspaces/provider/${workspaceId}/questions/update/${question.id}`,
                body: { is_published: true },
            });
            onUpdate({ ...question, isPublished: true });
            toast.success("Question published");
        } catch (err) {
            ConsoleLogger.error("Failed to publish question:", err);
            toast.error("Failed to publish question");
        } finally {
            setPublishing(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await apiCall({
                method: "PUT",
                url: `/api/workspaces/provider/${workspaceId}/questions/update/${question.id}`,
                body: {
                    question: editData.question,
                    answers: editData.answers,
                    correct_answer: editData.correctAnswer,
                },
            });
            onUpdate({
                ...question,
                question: editData.question,
                answers: editData.answers,
                correctAnswer: editData.correctAnswer,
            });
            setIsEditing(false);
            toast.success("Question updated");
        } catch (err) {
            ConsoleLogger.error("Failed to update question:", err);
            toast.error("Failed to update question");
        }
    };

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...editData.answers];
        newAnswers[index] = value;
        setEditData({ ...editData, answers: newAnswers });
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-sm transition-shadow">
            {/* Header Row */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                        <GlobalMathMarkdownTile content={question.question} className="[&_p]:mb-0 [&_p]:inline" />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${complexityColors[question.complexity] || "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                        >
                            {question.complexity}
                        </span>
                        {question.topicTitle && (
                            <span className="text-xs text-gray-500 truncate">
                                {question.topicTitle}
                            </span>
                        )}
                        {!question.isPublished && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Draft
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">
                        {t("answers")}: {question.answers.length}
                    </span>
                    {isExpanded ? (
                        <PiCaretUp className="text-gray-400" />
                    ) : (
                        <PiCaretDown className="text-gray-400" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                    {isEditing ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Question
                                </label>
                                <textarea
                                    value={editData.question}
                                    onChange={(e) =>
                                        setEditData({ ...editData, question: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("answers")}
                                </label>
                                {editData.answers.map((answer, idx) => (
                                    <div key={idx} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={editData.correctAnswer === answer}
                                            onChange={() =>
                                                setEditData({ ...editData, correctAnswer: answer })
                                            }
                                            className="accent-green-600"
                                        />
                                        <input
                                            type="text"
                                            value={answer}
                                            onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditData({
                                            question: question.question,
                                            answers: [...question.answers],
                                            correctAnswer: question.correctAnswer,
                                        });
                                    }}
                                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                                >
                                    {t("cancel")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-800">
                                    <GlobalMathMarkdownTile content={question.question} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                {question.answers.map((answer, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${answer === question.correctAnswer
                                            ? "bg-green-50 border border-green-200 text-green-800 font-medium"
                                            : "bg-gray-50 border border-gray-100 text-gray-700"
                                            }`}
                                    >
                                        <span className="font-mono text-xs text-gray-400">
                                            {String.fromCharCode(65 + idx)}.
                                        </span>
                                        <GlobalMathMarkdownTile content={answer} className="[&_p]:mb-0 [&_p]:inline" />
                                        {answer === question.correctAnswer && (
                                            <PiSealCheck className="ml-auto text-green-600" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                    <PiPencil size={14} />
                                    {t("edit")}
                                </button>

                                <button
                                    onClick={() => setAiGuideOpen(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${question.aiGuide
                                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                                        : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                >
                                    <PiBrain size={14} className={question.aiGuide ? "fill-current" : ""} />
                                    AI Guide
                                </button>

                                <button
                                    onClick={() => setVisualModalOpen(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${question.visualData
                                        ? "text-purple-700 bg-purple-50 hover:bg-purple-100"
                                        : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                >
                                    <PiSparkle size={14} />
                                    Visual
                                </button>

                                {!question.isPublished && (
                                    <button
                                        onClick={handlePublish}
                                        disabled={publishing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                                    >
                                        <PiSealCheck size={14} />
                                        {publishing ? t("publishing") : t("publish")}
                                    </button>
                                )}

                                {confirmDelete ? (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            {deleting ? t("deleting") : t("confirm_delete")}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                        >
                                            {t("cancel")}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors ml-auto"
                                    >
                                        <PiTrash size={14} />
                                        {t("delete")}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AI Guide Modal */}
            {aiGuideOpen && (
                <ProviderAiGuideModalWidget
                    isOpen={aiGuideOpen}
                    entityType="question"
                    entityId={question.id}
                    subjectId={question.providerSubjectId ?? undefined}
                    currentAiGuide={question.aiGuide || null}
                    onClose={() => setAiGuideOpen(false)}
                    onSuccess={() => {
                        onUpdate({ ...question });
                        setAiGuideOpen(false);
                    }}
                />
            )}

            {/* Visual Generation Modal */}
            {visualModalOpen && (
                <VisualGenerationModal
                    workspaceId={workspaceId}
                    questionId={question.id}
                    questionText={question.question}
                    subjectName={question.subjectTitle}
                    topicName={question.topicTitle}
                    existingVisual={question.visualData as unknown as QuestionVisualData}
                    onClose={() => setVisualModalOpen(false)}
                    onSaved={(data) => {
                        onUpdate({ ...question, visualData: data as unknown as Record<string, unknown> });
                        setVisualModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
