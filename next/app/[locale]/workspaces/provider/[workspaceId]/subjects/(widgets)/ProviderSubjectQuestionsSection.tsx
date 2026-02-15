"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";
import { Question as QuestionType } from "@stuwin/shared/types/domain/question";
import { ProviderQuestionListItemWidget } from "./ProviderQuestionListItemWidget";
import { toast } from "react-toastify";
import { ConsoleLogger } from "@/lib/logging/ConsoleLogger";
import { PiX } from "react-icons/pi";

interface ProviderSubjectQuestionsSectionProps {
    workspaceId: string;
    subjectId: string;
    topicId?: string | null;
    topicName?: string | null;
    onClearFilter?: () => void;
}

interface PaginationState {
    total: number;
    totalPages: number;
    pageSize: number;
}

export function ProviderSubjectQuestionsSection({
    workspaceId,
    subjectId,
    topicId,
    topicName,
    onClearFilter,
}: ProviderSubjectQuestionsSectionProps) {
    const t = useTranslations("ProviderSubjectQuestionsSection");
    const [questions, setQuestions] = useState<QuestionType.PrivateAccess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [pagination, setPagination] = useState<PaginationState>({
        total: 0,
        totalPages: 0,
        pageSize: 10,
    });

    // Reset page when topic filter changes
    useEffect(() => {
        setPage(1);
    }, [topicId]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pagination.pageSize.toString(),
                subjectId: subjectId,
            });

            if (topicId) {
                params.append("topicId", topicId);
            }

            const response = await apiCall<any>({
                method: "GET",
                url: `/api/workspaces/provider/${workspaceId}/questions?${params.toString()}`,
            });

            const result = response as any;

            setQuestions(result.questions || []);
            setPagination({
                total: result.total || 0,
                totalPages: result.totalPages || 0,
                pageSize: result.pageSize || 10,
            });
        } catch (err) {
            ConsoleLogger.error("Error fetching questions:", err);
            toast.error(t("errorFetchingQuestions"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, subjectId, topicId]);

    const handleQuestionUpdate = (
        updatedQuestion: QuestionType.PrivateAccess,
    ): void => {
        setQuestions((prevQuestions) =>
            prevQuestions.map((q) =>
                q.id === updatedQuestion.id ? updatedQuestion : q,
            ),
        );
    };

    const handleQuestionDelete = (deletedQuestionId: string): void => {
        setQuestions((prevQuestions) =>
            prevQuestions.filter((q) => q.id !== deletedQuestionId),
        );
        toast.success(t("questionDeleted"));
        fetchQuestions(); // Refresh to keep pagination correct
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t("questions")}</h2>
            </div>

            {topicId && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-800">
                        <span className="font-medium">{t("filteredByTopic")}:</span>
                        <span className="font-bold">{topicName || topicId}</span>
                    </div>
                    {onClearFilter && (
                        <button
                            onClick={onClearFilter}
                            className="p-1 hover:bg-blue-100 rounded-full transition-colors text-blue-600 hover:text-blue-800"
                            title={t("clearFilter")}
                        >
                            <PiX className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <GlobalLoaderTile message={t("loadingQuestions")} />
            ) : (
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                            <p className="text-gray-500">
                                {topicId ? t("noQuestionsForTopic") : t("noQuestionsFound")}
                            </p>
                        </div>
                    ) : (
                        questions.map((question) => (
                            <ProviderQuestionListItemWidget
                                key={question.id}
                                question={question}
                                onUpdate={handleQuestionUpdate}
                                onDelete={handleQuestionDelete}
                            />
                        ))
                    )}
                </div>
            )}

            {!loading && pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
                    >
                        {t("previous")}
                    </button>
                    <span className="px-4 py-2 text-gray-700 text-sm">
                        {t("pageOf", { page, totalPages: pagination.totalPages })}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
                    >
                        {t("next")}
                    </button>
                </div>
            )}
        </div>
    );
}
