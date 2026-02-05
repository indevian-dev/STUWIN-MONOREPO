'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchPrompts, createPrompt, updatePrompt, deletePrompt, SystemPrompt } from '@/lib/utils/staffAiLabApiHelper';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { PiSpinner } from 'react-icons/pi';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

export function SystemPromptsManager() {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState<Partial<SystemPrompt>>({
        title: '',
        usageFlowType: 'HOMEWORK_EXPLANATION',
        body: '',
        isActive: false
    });

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const res = await fetchPrompts(workspaceId);
            if (res.success) {
                setPrompts(res.data);
            } else {
                setError("Failed to load prompts");
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) loadPrompts();
    }, [workspaceId]);

    const handleSave = async () => {
        try {
            if (currentPrompt.id) {
                await updatePrompt(workspaceId, currentPrompt.id, currentPrompt);
            } else {
                await createPrompt(workspaceId, currentPrompt);
            }
            setIsEditing(false);
            setCurrentPrompt({});
            loadPrompts();
        } catch (err) {
            alert("Failed to save: " + (err as Error).message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deletePrompt(workspaceId, id);
            loadPrompts();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handleToggleActive = async (prompt: SystemPrompt) => {
        try {
            await updatePrompt(workspaceId, prompt.id, { isActive: !prompt.isActive });
            loadPrompts();
        } catch (err) {
            alert("Failed to update");
        }
    };

    const handleEdit = (prompt: SystemPrompt) => {
        setCurrentPrompt(prompt);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentPrompt({
            title: '',
            usageFlowType: 'HOMEWORK_EXPLANATION',
            body: '',
            isActive: false
        });
        setIsEditing(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">System Prompt Cribs</h2>
                <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <FiPlus /> New Crib
                </button>
            </div>

            {loading && <GlobalLoaderTile />}

            {error && <div className="text-red-500">{error}</div>}

            {!loading && !isEditing && (
                <div className="grid grid-cols-1 gap-4">
                    {prompts.map(prompt => (
                        <div key={prompt.id} className={`p-4 rounded border ${prompt.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{prompt.title}</h3>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">{prompt.usageFlowType}</span>
                                        {prompt.isActive && <span className="text-xs px-2 py-0.5 rounded bg-green-200 text-green-800 flex items-center gap-1"><FiCheckCircle /> Active</span>}
                                    </div>
                                    <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded max-h-32 overflow-hidden text-ellipsis">
                                        {prompt.body.slice(0, 200)}...
                                    </pre>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleEdit(prompt)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit Crib"><FiEdit2 /></button>
                                    <button onClick={() => handleDelete(prompt.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete Crib"><FiTrash2 /></button>
                                    <button onClick={() => handleToggleActive(prompt)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Toggle Active Status">
                                        <FiRefreshCw />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditing && (
                <div className="bg-white p-6 rounded border shadow">
                    <h3 className="text-lg font-bold mb-4">{currentPrompt.id ? 'Edit System Crib' : 'Create System Crib'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Crib Title</label>
                            <input
                                className="w-full border rounded p-2 text-black"
                                placeholder="E.g. Azerbaijan Math Specifics"
                                value={currentPrompt.title}
                                onChange={e => setCurrentPrompt({ ...currentPrompt, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Usage context (Flow Type)</label>
                            <select
                                className="w-full border rounded p-2 text-black"
                                value={currentPrompt.usageFlowType}
                                onChange={e => setCurrentPrompt({ ...currentPrompt, usageFlowType: e.target.value })}
                            >
                                <option value="QUESTION_EXPLANATION">QUESTION_EXPLANATION</option>
                                <option value="HOMEWORK_EXPLANATION">HOMEWORK_EXPLANATION</option>
                                <option value="QUESTION_GENERATION">QUESTION_GENERATION</option>
                                <option value="TOPIC_EXPLORATION">TOPIC_EXPLORATION</option>
                                <option value="STUDENT_QUIZ_SUMMARY">STUDENT_QUIZ_SUMMARY</option>
                                <option value="STUDENT_PROGRESS_SUMMARY">STUDENT_PROGRESS_SUMMARY</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Crib Content (Prompts Addition)</label>
                            <textarea
                                className="w-full border rounded p-2 font-mono h-64 text-black"
                                placeholder="Add instructions or knowledge that should be appended to the base prompt..."
                                value={currentPrompt.body}
                                onChange={e => setCurrentPrompt({ ...currentPrompt, body: e.target.value })}
                            />
                            <div className="bg-blue-50 p-2 rounded mt-1 border border-blue-100">
                                <p className="text-xs text-blue-800">
                                    <strong>How it works:</strong> This content is treated as a "System Crib". It will be prepended to any Subject/Topic/Question cribs and then injected into the <code>{'{{aiCrib}}'}</code> placeholder of the hardcoded core prompt.
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={currentPrompt.isActive}
                                    onChange={e => setCurrentPrompt({ ...currentPrompt, isActive: e.target.checked })}
                                />
                                <span className="text-sm font-medium">Set as Active</span>
                            </label>
                            <p className="text-xs text-yellow-600 ml-6">Caution: Setting this to active will deactivate other prompts for the same flow type.</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
