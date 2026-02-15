"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PiBrain, PiX, PiFloppyDisk } from "react-icons/pi";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import { useParams } from "next/navigation";

interface ProviderAiGuideModalWidgetProps {
    isOpen: boolean;
    entityType: "subject" | "topic" | "question";
    entityId: string;
    subjectId?: string;
    currentAiGuide: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProviderAiGuideModalWidget({
    isOpen,
    entityType,
    entityId,
    subjectId,
    currentAiGuide,
    onClose,
    onSuccess,
}: ProviderAiGuideModalWidgetProps) {
    const t = useTranslations("ProviderAiGuideModal");
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [aiGuide, setAiGuide] = useState(currentAiGuide || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            let url: string;
            let body: Record<string, unknown>;
            if (entityType === "subject") {
                url = `/api/workspaces/provider/${workspaceId}/subjects/${entityId}/update`;
                body = { aiGuide: aiGuide.trim() || null };
            } else if (entityType === "question") {
                url = `/api/workspaces/provider/${workspaceId}/questions/update/${entityId}`;
                body = { ai_guide: aiGuide.trim() || null };
            } else {
                // topic — nested under subject
                url = `/api/workspaces/provider/${workspaceId}/subjects/${subjectId}/topics/${entityId}/update`;
                body = { aiGuide: aiGuide.trim() || null };
            }

            await apiCall({
                method: "PUT",
                url,
                body,
            });

            onSuccess();
        } catch (err) {
            console.error("Failed to save AI guide:", err);
            setError(t("errorSaving"));
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setAiGuide("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-50">
                            <PiBrain className="text-amber-600 text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {t("title")}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {entityType === "subject" ? t("forSubject") : entityType === "question" ? t("forQuestion") : t("forTopic")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <PiX className="text-gray-500 text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        {t("description")}
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <textarea
                        value={aiGuide}
                        onChange={(e) => setAiGuide(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-colors resize-y"
                        placeholder={t("placeholder")}
                    />

                    {currentAiGuide && (
                        <button
                            onClick={handleClear}
                            className="text-sm text-red-500 hover:text-red-700 transition-colors"
                        >
                            {t("clearGuide")}
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        <PiFloppyDisk size={16} />
                        {saving ? t("saving") : t("save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
