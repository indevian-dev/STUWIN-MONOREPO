"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import type { QuestionVisualData } from "@/lib/domain/question/visual.types";
import { PiCube, PiSquare, PiSparkle, PiFloppyDisk, PiArrowClockwise, PiX, PiChatText } from "react-icons/pi";

// Lazy-load Three.js renderer to avoid bundle bloat on pages that don't use it
const ThreeJsSceneRenderer = dynamic(
    () => import("@/app/[locale]/(global)/(tiles)/ThreeJsSceneRenderer").then((m) => m.ThreeJsSceneRenderer),
    { ssr: false, loading: () => <div className="flex items-center justify-center h-[400px] bg-gray-900 rounded-xl"><div className="animate-pulse text-gray-400">Loading 3D viewer...</div></div> },
);

interface VisualGenerationModalProps {
    workspaceId: string;
    questionId: string;
    questionText: string;
    subjectName?: string;
    topicName?: string;
    existingVisual?: QuestionVisualData | null;
    onClose: () => void;
    onSaved?: (data: QuestionVisualData) => void;
}

export function VisualGenerationModal({
    workspaceId,
    questionId,
    questionText,
    subjectName,
    topicName,
    existingVisual,
    onClose,
    onSaved,
}: VisualGenerationModalProps) {
    const [mode, setMode] = useState<"3d" | "2d">(existingVisual?.mode || "3d");
    const [status, setStatus] = useState<"idle" | "generating" | "preview" | "saving" | "error">(
        existingVisual ? "preview" : "idle",
    );
    const [sceneData, setSceneData] = useState<QuestionVisualData | null>(existingVisual || null);
    const [error, setError] = useState<string | null>(null);
    const [guidance, setGuidance] = useState("");

    const handleGenerate = useCallback(async () => {
        try {
            setStatus("generating");
            setError(null);

            const data = await apiCall<QuestionVisualData>({
                url: `/api/workspaces/provider/${workspaceId}/questions/${questionId}/generate-visual`,
                method: "POST",
                body: {
                    mode,
                    questionText,
                    subjectName,
                    topicName,
                    ...(guidance.trim() && { guidance: guidance.trim() }),
                },
            });
            setSceneData(data);
            setStatus("preview");
        } catch (err) {
            console.error("Visual generation failed:", err);
            setError(err instanceof Error ? err.message : "Generation failed");
            setStatus("error");
        }
    }, [mode, questionText, subjectName, topicName, workspaceId, questionId, guidance]);

    const handleSave = useCallback(async () => {
        if (!sceneData) return;
        try {
            setStatus("saving");
            setError(null);

            await apiCall({
                url: `/api/workspaces/provider/${workspaceId}/questions/${questionId}/visual`,
                method: "PUT",
                body: { visualData: sceneData },
            });
            onSaved?.(sceneData);
            onClose();
        } catch (err) {
            console.error("Save visual failed:", err);
            setError(err instanceof Error ? err.message : "Save failed");
            setStatus("preview");
        }
    }, [sceneData, workspaceId, questionId, onSaved, onClose]);

    const isLoading = status === "generating" || status === "saving";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <PiSparkle className="w-5 h-5 text-purple-500" />
                            Generate Visual
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1 max-w-lg">
                            {questionText}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <PiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-5">
                    {/* Error */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Idle / Mode Selection */}
                    {(status === "idle" || status === "error") && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-5 shadow-lg">
                                <PiSparkle className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                AI Visual Generation
                            </h4>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Generate an interactive 3D or 2D visual to help students understand this question.
                            </p>

                            {/* Mode Selector */}
                            <div className="flex justify-center gap-3 mb-6">
                                <button
                                    onClick={() => setMode("3d")}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${mode === "3d"
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <PiCube className="w-5 h-5" />
                                    3D Visual
                                </button>
                                <button
                                    onClick={() => setMode("2d")}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${mode === "2d"
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <PiSquare className="w-5 h-5" />
                                    2D Visual
                                </button>
                            </div>

                            {/* Guidance Input */}
                            <div className="max-w-lg mx-auto mb-6 text-left">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                                    <PiChatText className="w-4 h-4" />
                                    Guidance (optional)
                                </label>
                                <textarea
                                    value={guidance}
                                    onChange={(e) => setGuidance(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-colors resize-none"
                                    placeholder="e.g. Show a 3D bar chart comparing the values. Use blue and orange colors. Add labels on each bar."
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-200 hover:shadow-purple-300"
                            >
                                <span className="flex items-center gap-2">
                                    <PiSparkle className="w-5 h-5" />
                                    Generate {mode.toUpperCase()} Visual
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Generating */}
                    {status === "generating" && (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-5">
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
                                Generating {mode.toUpperCase()} Visual...
                            </h4>
                            <p className="text-gray-500">
                                AI is creating an interactive scene for this question. This may take 10-15 seconds.
                            </p>
                        </div>
                    )}

                    {/* Preview */}
                    {(status === "preview" || status === "saving") && sceneData && (
                        <div>
                            {/* Scene Title */}
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{sceneData.title}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {sceneData.mode.toUpperCase()} • {sceneData.objects.length} objects
                                        {sceneData.animations?.length ? ` • ${sceneData.animations.length} animations` : ""}
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Ready
                                </span>
                            </div>

                            {/* Three.js Canvas */}
                            <ThreeJsSceneRenderer
                                data={sceneData}
                                height={400}
                                className="border border-gray-200 shadow-inner"
                            />

                            <p className="text-xs text-gray-400 mt-2 text-center">
                                🖱️ Drag to rotate • Scroll to zoom • Right-click to pan
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    {/* Guidance input in preview mode for regeneration */}
                    {(status === "preview" || status === "saving") && (
                        <div className="px-5 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 shrink-0">
                                    <PiChatText className="w-3.5 h-3.5" />
                                    Guidance
                                </div>
                                <input
                                    type="text"
                                    value={guidance}
                                    onChange={(e) => setGuidance(e.target.value)}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-colors disabled:opacity-50"
                                    placeholder="Describe changes for regeneration..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !isLoading) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-5">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-3">
                            {(status === "preview" || status === "saving") && (
                                <>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                                    >
                                        <PiArrowClockwise className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                                    >
                                        {status === "saving" ? (
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <PiFloppyDisk className="w-4 h-4" />
                                        )}
                                        {status === "saving" ? "Saving..." : "Save Visual"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
