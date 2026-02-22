"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoader.tile";
import { Question as QuestionType } from "@stuwin/shared/types/domain/Question.types";
import { ProviderQuestionListItemWidget } from "./ProviderQuestionListItem.widget";
import { Card } from "@/app/primitives/Card.primitive";
import { toast } from "react-toastify";
import { ConsoleLogger } from "@/lib/logging/Console.logger";
import { PiX, PiListChecks } from "react-icons/pi";

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
    const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all');
    const [pagination, setPagination] = useState<PaginationState>({
        total: 0,
        totalPages: 0,
        pageSize: 10,
    });

    useEffect(() => { setPage(1); }, [topicId]);
    useEffect(() => { setPage(1); }, [publishedFilter]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pagination.pageSize.toString(),
                subjectId,
            });
            if (topicId) params.append("topicId", topicId);
            if (publishedFilter === 'published') params.append("published", "true");
            if (publishedFilter === 'unpublished') params.append("published", "false");

            const response = await fetchApiUtil<{
                questions: QuestionType.PrivateAccess[];
                total: number;
                totalPages: number;
                pageSize: number;
            }>({
                method: "GET",
                url: `/api/workspaces/provider/${workspaceId}/questions?${params.toString()}`,
            });

            setQuestions(response?.questions || []);
            setPagination({
                total: response?.total || 0,
                totalPages: response?.totalPages || 0,
                pageSize: response?.pageSize || 10,
            });
        } catch (err: unknown) {
            ConsoleLogger.error("Error fetching questions:", err);
            toast.error(t("errorFetchingQuestions"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, subjectId, topicId, publishedFilter]);

    const handleQuestionUpdate = (updatedQuestion: QuestionType.PrivateAccess): void => {
        setQuestions((prev) => prev.map((q) => q.id === updatedQuestion.id ? updatedQuestion : q));
    };

    const handleQuestionDelete = (deletedId: string): void => {
        setQuestions((prev) => prev.filter((q) => q.id !== deletedId));
        toast.success(t("questionDeleted"));
        fetchQuestions();
    };

    return (
        <Card className="mt-4 p-6 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-app-dark-blue dark:text-white flex items-center gap-2">
                    <PiListChecks className="text-app-bright-green" />
                    {t("questions")}
                    {pagination.total > 0 && (
                        <span className="text-sm font-normal text-app-dark-blue/40 dark:text-white/40">
                            ({pagination.total})
                        </span>
                    )}
                </h2>
            </div>

            {/* Published filter tabs */}
            <div className="flex items-center gap-1 mb-4 p-1 rounded-app bg-black/5 dark:bg-white/5 w-fit">
                {(['all', 'published', 'unpublished'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setPublishedFilter(f)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-app transition-all ${publishedFilter === f
                            ? 'bg-white dark:bg-white/10 text-app-dark-blue dark:text-white shadow-sm'
                            : 'text-app-dark-blue/50 dark:text-white/50 hover:text-app-dark-blue dark:hover:text-white'
                            }`}
                    >
                        {f === 'all' ? t('filterAll') : f === 'published' ? t('filterPublished') : t('filterUnpublished')}
                    </button>
                ))}
            </div>

            {/* Topic filter pill */}
            {topicId && (
                <div className="mb-6 px-4 py-3 rounded-app flex items-center justify-between
                    bg-app-bright-green/10 dark:bg-app-bright-green/15
                    border border-app-bright-green/30">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-app-dark-blue dark:text-white">{t("filteredByTopic")}:</span>
                        <span className="text-app-bright-green font-bold">{topicName || topicId}</span>
                    </div>
                    {onClearFilter && (
                        <button
                            onClick={onClearFilter}
                            className="p-1 rounded-app-full transition-colors
                                text-app-dark-blue/50 dark:text-white/50
                                hover:bg-black/10 dark:hover:bg-white/10"
                            title={t("clearFilter")}
                        >
                            <PiX className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <GlobalLoaderTile message={t("loadingQuestions")} />
            ) : (
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="text-center py-12 rounded-app border-2 border-dashed
                            border-black/10 dark:border-white/10
                            bg-black/2 dark:bg-white/5">
                            <PiListChecks className="mx-auto w-10 h-10 mb-2 text-app-dark-blue/20 dark:text-white/20" />
                            <p className="text-app-dark-blue/50 dark:text-white/50">
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

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-app text-sm font-medium transition-colors
                            border border-black/10 dark:border-white/10
                            text-app-dark-blue dark:text-white
                            hover:bg-black/5 dark:hover:bg-white/10
                            disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t("previous")}
                    </button>
                    <span className="px-4 py-2 text-sm text-app-dark-blue/60 dark:text-white/60">
                        {t("pageOf", { page, totalPages: pagination.totalPages })}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 rounded-app text-sm font-medium transition-colors
                            border border-black/10 dark:border-white/10
                            text-app-dark-blue dark:text-white
                            hover:bg-black/5 dark:hover:bg-white/10
                            disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t("next")}
                    </button>
                </div>
            )}
        </Card>
    );
}
