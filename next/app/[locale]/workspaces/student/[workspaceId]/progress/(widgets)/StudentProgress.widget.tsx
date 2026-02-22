"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoader.tile";
import { Card } from "@/app/primitives/Card.primitive";
import { ConsoleLogger } from "@/lib/logging/Console.logger";
import {
    PiChartLineUp,
    PiBookOpen,
    PiCheckCircle,
    PiQuestion,
    PiCalendar,
} from "react-icons/pi";

interface MasteryRecord {
    id: string;
    topicId: string;
    providerSubjectId: string | null;
    masteryScore: number | null;
    totalQuizzesTaken: number | null;
    questionsAttempted: number | null;
    questionsCorrect: number | null;
    lastAttemptAt: string | null;
    masteryTrend: { score: number; date: string }[] | null;
}

function MasteryBar({ score }: { score: number }) {
    const pct = Math.min(100, Math.max(0, score));
    const color =
        pct >= 75
            ? "bg-app-bright-green"
            : pct >= 50
                ? "bg-yellow-400"
                : "bg-app-bright-green-danger";
    return (
        <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-app-full overflow-hidden">
            <div
                className={`h-full rounded-app-full transition-all duration-500 ${color}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export function StudentProgressWidget() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [records, setRecords] = useState<MasteryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProgress = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchApiUtil<any>({
                method: "GET",
                url: `/api/workspaces/student/${workspaceId}/progress`,
            });
            if (res.status === 200) {
                setRecords(res.data?.data ?? []);
            }
        } catch (err) {
            ConsoleLogger.error("Error fetching progress:", err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const avgMastery =
        records.length > 0
            ? records.reduce((s, r) => s + (r.masteryScore ?? 0), 0) / records.length
            : 0;

    const totalQuestions = records.reduce(
        (s, r) => s + (r.questionsAttempted ?? 0),
        0
    );
    const totalCorrect = records.reduce(
        (s, r) => s + (r.questionsCorrect ?? 0),
        0
    );

    if (loading) return <GlobalLoaderTile message="Loading progress..." />;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        label: "Topics Tracked",
                        value: records.length,
                        icon: PiBookOpen,
                        color: "text-app-bright-green",
                    },
                    {
                        label: "Avg Mastery",
                        value: `${avgMastery.toFixed(0)}%`,
                        icon: PiChartLineUp,
                        color: "text-blue-500",
                    },
                    {
                        label: "Questions Done",
                        value: totalQuestions,
                        icon: PiQuestion,
                        color: "text-yellow-500",
                    },
                    {
                        label: "Correct",
                        value: totalCorrect,
                        icon: PiCheckCircle,
                        color: "text-app-bright-green",
                    },
                ].map((stat) => (
                    <Card key={stat.label} className="p-4 flex items-center gap-3">
                        <stat.icon className={`text-2xl shrink-0 ${stat.color}`} />
                        <div>
                            <p className="text-lg font-bold text-app-dark-blue dark:text-white">
                                {stat.value}
                            </p>
                            <p className="text-xs text-app-dark-blue/50 dark:text-white/50">
                                {stat.label}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Per-topic mastery */}
            {records.length === 0 ? (
                <Card className="p-12 text-center">
                    <PiChartLineUp className="mx-auto text-5xl text-app-dark-blue/20 dark:text-white/20 mb-3" />
                    <p className="font-semibold text-app-dark-blue dark:text-white">
                        No progress data yet
                    </p>
                    <p className="text-sm text-app-dark-blue/50 dark:text-white/50 mt-1">
                        Complete quizzes to track your topic mastery here.
                    </p>
                </Card>
            ) : (
                <Card className="p-6">
                    <h2 className="text-base font-bold text-app-dark-blue dark:text-white mb-4 flex items-center gap-2">
                        <PiChartLineUp className="text-app-bright-green" />
                        Topic Mastery Breakdown
                    </h2>
                    <div className="space-y-4">
                        {records.map((rec) => {
                            const score = rec.masteryScore ?? 0;
                            const accuracy =
                                rec.questionsAttempted && rec.questionsAttempted > 0
                                    ? ((rec.questionsCorrect ?? 0) / rec.questionsAttempted) * 100
                                    : 0;
                            return (
                                <div key={rec.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-app-dark-blue dark:text-white truncate max-w-[60%]">
                                            {rec.topicId}
                                        </span>
                                        <span className="font-bold text-app-dark-blue dark:text-white">
                                            {score.toFixed(0)}%
                                        </span>
                                    </div>
                                    <MasteryBar score={score} />
                                    <div className="flex gap-4 text-xs text-app-dark-blue/50 dark:text-white/50">
                                        <span>{rec.totalQuizzesTaken ?? 0} quizzes</span>
                                        <span>{rec.questionsAttempted ?? 0} questions</span>
                                        <span>{accuracy.toFixed(0)}% accuracy</span>
                                        {rec.lastAttemptAt && (
                                            <span className="flex items-center gap-1">
                                                <PiCalendar />
                                                {new Date(rec.lastAttemptAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}
