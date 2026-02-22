"use client";
import React, { useState, useEffect } from 'react';
import Editor from '@/app/[locale]/(global)/(widgets)/GlobalRichTextEditor.widget';
import { useParams } from 'next/navigation';

interface StaffDocEditWidgetProps {
    type?: string;
    title?: string;
}

export function StaffDocEditWidget({ type = 'about', title = 'About us' }: StaffDocEditWidgetProps) {
    const params = useParams();
    const workspaceId = params?.workspaceId;
    const [localizedContent, setLocalizedContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!workspaceId || !type) return;
            try {
                const res = await fetch(`/api/workspaces/staff/${workspaceId}/docs?type=${type}`);
                const data = await res.json();
                if (data.success && data.doc) {
                    setLocalizedContent(data.doc.localizedContent || {
                        az: { title: '' },
                        en: { title: '' },
                        ru: { title: '' }
                    });
                }
            } catch (error) {
                console.error("Failed to fetch doc data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [workspaceId, type]);

    const handleSave = async () => {
        if (!workspaceId || !type) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/workspaces/staff/${workspaceId}/docs/update?type=${type}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ localizedContent })
            });
            if (res.ok) {
                alert("Saved successfully!");
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || 'Failed to save'}`);
            }
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-white py-12 px-6 rounded-app shadow-sm border border-gray-100 animate-pulse">
                <div className="h-8 bg-gray-100 rounded w-1/4 mb-6"></div>
                <div className="h-[400px] bg-gray-50 rounded"></div>
            </div>
        );
    }

    return (
        <div className='w-full bg-white py-8 px-6 rounded-app shadow-sm border border-gray-100'>
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage localized content for this document</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-app hover:bg-blue-700 active:transform active:scale-95 transition-all shadow-md shadow-blue-500/20 disabled:bg-gray-400 disabled:shadow-none flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-app-full animate-spin"></div>
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </div>

            {localizedContent && (
                <Editor
                    isLocalized={true}
                    withTitle={false}
                    initialContent={localizedContent}
                    onChange={setLocalizedContent}
                    height="600px"
                />
            )}

        </div>
    );
}
