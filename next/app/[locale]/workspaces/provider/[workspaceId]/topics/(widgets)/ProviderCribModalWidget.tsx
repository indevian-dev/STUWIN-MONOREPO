"use client";

import { useState, useEffect } from "react";
import { apiCallForSpaHelper } from "@/lib/utils/http/SpaApiClient";
import { useParams } from "next/navigation";

interface ProviderCribModalWidgetProps {
    isOpen: boolean;
    entityType: "subject" | "topic" | "question";
    entityId: string;
    subjectId?: string;
    currentCrib: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProviderCribModalWidget({
    isOpen,
    entityType,
    entityId,
    subjectId,
    currentCrib,
    onClose,
    onSuccess,
}: ProviderCribModalWidgetProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [cribText, setCribText] = useState(currentCrib || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setCribText(currentCrib || "");
        setError(null);
    }, [currentCrib, isOpen]);

    if (!isOpen) return null;

    const getUpdateUrl = (): string => {
        switch (entityType) {
            case "subject":
                return `/api/workspaces/provider/${workspaceId}/subjects/${entityId}/update`;
            case "topic":
                return `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${entityId}/update`;
            case "question":
                return `/api/workspaces/provider/${workspaceId}/questions/update/${entityId}`;
        }
    };

    const getBodyKey = (): string => {
        return entityType === "question" ? "ai_assistant_crib" : "aiAssistantCrib";
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await apiCallForSpaHelper({
                method: "PUT",
                url: getUpdateUrl(),
                body: { [getBodyKey()]: cribText || null },
            });

            if (response.status === 200) {
                onSuccess();
                onClose();
            } else {
                setError("Failed to save AI crib");
            }
        } catch {
            setError("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    return (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🧠</span>
                        <h2 className="text-lg font-semibold text-gray-900">
                            AI Assistant Crib — {entityLabel}
                        </h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Instructions for the AI when generating questions or assisting students with this {entityType}.
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <textarea
                        value={cribText}
                        onChange={(e) => setCribText(e.target.value)}
                        placeholder={`Enter AI instructions for this ${entityType}...\n\nExamples:\n- "Focus on practical applications"\n- "Use simple language suitable for beginners"\n- "Include real-world examples from Azerbaijan"`}
                        className="w-full h-48 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                            {cribText.length} characters
                        </span>
                        {cribText && (
                            <button
                                onClick={() => setCribText("")}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded text-gray-700 font-medium text-sm"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Crib"}
                    </button>
                </div>
            </div>
        </div>
    );
}
