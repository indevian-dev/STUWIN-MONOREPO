"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoader.tile";
import { Card } from "@/app/primitives/Card.primitive";
import { ConsoleLogger } from "@/lib/logging/Console.logger";
import {
    PiTarget,
    PiGameController,
    PiTrophy,
    PiFire,
    PiArrowRight,
    PiCheck,
} from "react-icons/pi";

interface Quiz {
    id: number;
    score?: number | null;
    status: string;
    totalQuestions: number;
    createdAt: string;
    subjectTitle?: string;
}

interface GoalConfig {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    target: number;
    unit: string;
    href?: string;
}

function GoalCard({
    goal,
    current,
    workspaceId,
}: {
    goal: GoalConfig;
    current: number;
    workspaceId: string;
}) {
    const pct = Math.min(100, (current / goal.target) * 100);
    const done = pct >= 100;
    const Icon = goal.icon;

    return (
        <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-app flex items-center justify-center ${done
                            ? "bg-app-bright-green/15 text-app-bright-green"
                            : "bg-black/5 dark:bg-white/5 text-app-dark-blue/60 dark:text-white/60"
                            }`}
                    >
                        <Icon className="text-xl" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-app-dark-blue dark:text-white">
                            {goal.label}
                        </p>
                        <p className="text-xs text-app-dark-blue/50 dark:text-white/50">
                            {goal.description}
                        </p>
                    </div>
                </div>
                {done && <PiCheck className="text-app-bright-green text-xl shrink-0" />}
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-app-dark-blue/60 dark:text-white/60">
                    <span>
                        {current} / {goal.target} {goal.unit}
                    </span>
                    <span className="font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-app-full overflow-hidden">
                    <div
                        className={`h-full rounded-app-full transition-all duration-500 ${done ? "bg-app-bright-green" : "bg-app-bright-green/60"
                            }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {goal.href && !done && (
                <Link
                    href={`/workspaces/student/${workspaceId}${goal.href}`}
                    className="mt-1 text-xs font-semibold text-app-bright-green flex items-center gap-1 hover:underline w-fit"
                >
                    Continue <PiArrowRight />
                </Link>
            )}
        </Card>
    );
}

export function StudentGoalsWidget() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchApiUtil<any>({
                method: "GET",
                url: `/api/workspaces/student/${workspaceId}/quizzes/history?pageSize=100`,
            });
            if (res.status === 200) {
                setQuizzes(res.data?.data?.quizzes ?? []);
            }
        } catch (err) {
            ConsoleLogger.error("Error fetching quiz history for goals:", err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const completed = quizzes.filter((q) => q.status === "completed");
    const highScores = completed.filter((q) => (q.score ?? 0) >= 80);
    const perfectScores = completed.filter((q) => (q.score ?? 0) >= 95);

    const avgScore =
        completed.length > 0
            ? completed.reduce((s, q) => s + (q.score ?? 0), 0) / completed.length
            : 0;

    const goals: GoalConfig[] = [
        {
            id: "first_quiz",
            label: "Getting Started",
            description: "Complete your first quiz",
            icon: PiGameController,
            target: 1,
            unit: "quizzes",
            href: "/quizzes/start",
        },
        {
            id: "ten_quizzes",
            label: "Quiz Veteran",
            description: "Complete 10 quizzes",
            icon: PiTarget,
            target: 10,
            unit: "quizzes",
            href: "/quizzes/start",
        },
        {
            id: "high_score",
            label: "High Achiever",
            description: "Score 80%+ on 5 quizzes",
            icon: PiTrophy,
            target: 5,
            unit: "high-score quizzes",
            href: "/quizzes/start",
        },
        {
            id: "streak",
            label: "On Fire",
            description: "Complete 25 quizzes total",
            icon: PiFire,
            target: 25,
            unit: "quizzes",
            href: "/quizzes/start",
        },
        {
            id: "perfect",
            label: "Perfectionist",
            description: "Get 95%+ score 3 times",
            icon: PiCheck,
            target: 3,
            unit: "near-perfect quizzes",
            href: "/quizzes/start",
        },
    ];

    const goalCurrentValues: Record<string, number> = {
        first_quiz: completed.length,
        ten_quizzes: completed.length,
        high_score: highScores.length,
        streak: completed.length,
        perfect: perfectScores.length,
    };

    if (loading) return <GlobalLoaderTile message="Loading goals..." />;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                    {
                        label: "Quizzes Completed",
                        value: completed.length,
                        icon: PiGameController,
                    },
                    {
                        label: "Average Score",
                        value: `${avgScore.toFixed(0)}%`,
                        icon: PiTrophy,
                    },
                    {
                        label: "Goals Achieved",
                        value: goals.filter(
                            (g) => goalCurrentValues[g.id] >= g.target
                        ).length,
                        icon: PiTarget,
                    },
                ].map((stat) => (
                    <Card key={stat.label} className="p-4 flex items-center gap-3">
                        <stat.icon className="text-2xl text-app-bright-green shrink-0" />
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

            {/* Goals grid */}
            <div>
                <h2 className="text-base font-bold text-app-dark-blue dark:text-white mb-3 flex items-center gap-2">
                    <PiTarget className="text-app-bright-green" />
                    Activity Goals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {goals.map((goal) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            current={goalCurrentValues[goal.id]}
                            workspaceId={workspaceId}
                        />
                    ))}
                </div>
            </div>

            {/* CTA if no quizzes */}
            {completed.length === 0 && (
                <Card className="p-10 text-center">
                    <PiTarget className="mx-auto text-5xl text-app-dark-blue/20 dark:text-white/20 mb-3" />
                    <p className="font-semibold text-app-dark-blue dark:text-white">
                        Start your journey
                    </p>
                    <p className="text-sm text-app-dark-blue/50 dark:text-white/50 mt-1 mb-4">
                        Complete your first quiz to unlock goal tracking.
                    </p>
                    <Link
                        href={`/workspaces/student/${workspaceId}/quizzes/start`}
                        className="inline-flex items-center gap-2 bg-app-bright-green text-white font-semibold px-5 py-2.5 rounded-app text-sm hover:bg-app-bright-green-dark transition-colors"
                    >
                        <PiGameController className="text-lg" />
                        Start a Quiz
                    </Link>
                </Card>
            )}
        </div>
    );
}
