"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { toast } from "react-toastify";
import { PiCheckCircle, PiWarningCircle, PiLightbulb, PiChartLine, PiArrowLeft, PiRobot } from "react-icons/pi";
import ReactMarkdown from "react-markdown";

interface QuizReport {
    id: string;
    reportText: string;
    learningInsights: {
        strengths: string[];
        gaps: string[];
        recommendations: string[];
    };
    createdAt: string;
}

interface StudentQuizReportWidgetProps {
    quizId: string;
    onBack?: () => void;
}

export function StudentQuizReportWidget({ quizId, onBack }: StudentQuizReportWidgetProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [report, setReport] = useState<QuizReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (quizId) {
            fetchReport();
        }
    }, [quizId]);

    const fetchReport = async () => {
        try {
            setIsLoading(true);
            const response = await apiCallForSpaHelper({
                url: `/api/workspaces/student/${workspaceId}/quizzes/analyze`,
                method: "POST",
                body: { quizId }
            } as any);

            const result = (response as any).data;

            if (result.success) {
                setReport(result.data);
            } else {
                toast.error(result.error || "Failed to load report");
            }
        } catch (error) {
            toast.error("Error loading quiz report");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || isLoading) return <GlobalLoaderTile message="Generating Learning Report" />;

    if (!report) return null;

    const { learningInsights } = report;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand transition font-medium text-sm"
                >
                    <PiArrowLeft />
                    Back to Quiz History
                </button>
            )}

            {/* Hero Header */}
            <div className="bg-gradient-to-br from-brand to-brand-dark rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <PiChartLine size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            AI Insight Report
                        </span>
                    </div>
                    <h1 className="text-4xl font-black mb-2">Learning Analysis</h1>
                    <p className="text-white/80 max-w-lg font-medium">
                        Great job completing the assessment! Here's a breakdown of your performance and tailored learning recommendations.
                    </p>
                </div>
            </div>

            {/* Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-green-700">
                        <PiCheckCircle size={24} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                        {learningInsights.strengths?.map((s, i) => (
                            <li key={i} className="text-sm text-green-800 font-medium flex gap-2">
                                <span className="opacity-50">•</span> {s}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-orange-700">
                        <PiWarningCircle size={24} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Gaps</h3>
                    </div>
                    <ul className="space-y-2">
                        {learningInsights.gaps?.map((g, i) => (
                            <li key={i} className="text-sm text-orange-800 font-medium flex gap-2">
                                <span className="opacity-50">•</span> {g}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-brand/5 border border-brand/10 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-brand">
                        <PiLightbulb size={24} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Next Steps</h3>
                    </div>
                    <ul className="space-y-2">
                        {learningInsights.recommendations?.map((r, i) => (
                            <li key={i} className="text-sm text-brand-dark font-medium flex gap-2">
                                <span className="opacity-50">•</span> {r}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-gray-50 rounded-xl">
                        <PiRobot size={24} className="text-brand" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Detailed Tutor Analysis</h2>
                </div>

                <div className="prose prose-brand max-w-none text-gray-700 leading-relaxed">
                    <ReactMarkdown>{report.reportText}</ReactMarkdown>
                </div>
            </div>

            <div className="flex justify-center pt-4">
                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                    Analyzed on {new Date(report.createdAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}
