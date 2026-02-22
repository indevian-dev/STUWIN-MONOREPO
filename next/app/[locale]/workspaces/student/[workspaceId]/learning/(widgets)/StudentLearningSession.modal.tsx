"use client";

import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { toast } from 'react-toastify';

export interface StudentLearningSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextType: 'quiz' | 'homework' | 'topic';
    contextId: string;
    initialQuestion: string;
    correctAnswer?: string;
    userAnswer?: string;
    subjectTitle?: string;
    complexity?: string;
}

interface DigestNode {
    id: string;
    parentId: string | null;
    type: 'analysis' | 'term';
    content: string;
    aiResponse: string;
    createdAt: string;
    children?: DigestNode[];
}

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Splits text into sentences/logical chunks for segmented selection.
 * Handles common abbreviations and preserves punctuation.
 */
const splitToSegments = (text: string): string[] => {
    if (!text) return [];
    // Split by sentence endings (., !, ?) followed by space or newline
    // Also split by double newlines to treat paragraphs as boundaries
    // We try to avoid splitting inside LaTeX formulas $...$
    // This is a simple heuristic: split only if not preceded by an odd number of $ in the current line
    const segments = text.split(/(?<=[.!?])\s+|\n\n/);
    return segments.filter(s => s.trim().length > 0);
};

export function StudentLearningSessionModal({
    isOpen,
    onClose,
    contextType,
    contextId,
    initialQuestion,
    correctAnswer,
    userAnswer,
    subjectTitle,
    complexity
}: StudentLearningSessionModalProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Session State
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [termLoading, setTermLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [locale, setLocale] = useState((params.locale as string) || 'az');

    // Focus State
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [navigationStack, setNavigationStack] = useState<string[]>([]);

    // Selection State (Segmented)
    const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
    const [selectionContext, setSelectionContext] = useState<{ id: string, type: 'question' | 'digest' } | null>(null);

    const fetchExistingSession = async () => {
        setLoading(true);
        try {
            const response = await fetchApiUtil<any>({
                method: 'GET',
                url: `/api/workspaces/student/${workspaceId}/learning/session`,
                params: {
                    contextType,
                    contextId
                }
            });

            if (response.status === 200 && response.data.data) {
                setSession(response.data.data);
                setHasStarted(true);
            }
        } catch (error) {
            ConsoleLogger.error('Failed to fetch existing session:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculated Selected Text
    const selectedText = useMemo(() => {
        if (selectedSegmentIds.size === 0) return '';

        const segments: string[] = [];

        // Check root question segments
        const rootSegments = splitToSegments(initialQuestion);
        rootSegments.forEach((seg, idx) => {
            if (selectedSegmentIds.has(`root:${idx}`)) segments.push(seg);
        });

        // Check digest segments
        const nodes = getDigests(session);
        nodes.forEach((node: DigestNode) => {
            const nodeSegments = splitToSegments(node.aiResponse);
            nodeSegments.forEach((seg, idx) => {
                if (selectedSegmentIds.has(`${node.id}:${idx}`)) segments.push(seg);
            });
        });

        return segments.join(' ').trim();
    }, [selectedSegmentIds, initialQuestion, session]);

    // Handle session cleanup and load
    useEffect(() => {
        if (!isOpen) {
            setHasStarted(false);
            setSession(null);
            setSelectedSegmentIds(new Set());
            setSelectionContext(null);
            setFocusedNodeId(null);
            setNavigationStack([]);
        } else {
            fetchExistingSession();
        }
    }, [isOpen]);

    // Scroll Lock Effect
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    function getDigests(currentSession: any): DigestNode[] {
        if (!currentSession?.digests) return [];
        if (Array.isArray(currentSession.digests)) return currentSession.digests;
        return currentSession.digests.nodes || [];
    }

    // Filter digests by focused parent
    const visibleNodes = useMemo(() => {
        const nodes = getDigests(session);
        return nodes.filter(node => node.parentId === focusedNodeId);
    }, [session, focusedNodeId]);

    const navigateToFocus = (nodeId: string) => {
        if (focusedNodeId) {
            setNavigationStack(prev => [...prev, focusedNodeId]);
        }
        setFocusedNodeId(nodeId);
        setSelectedSegmentIds(new Set());
        setSelectionContext(null);
    };

    const navigateBack = () => {
        const newStack = [...navigationStack];
        const prevId = newStack.pop();
        setNavigationStack(newStack);
        setFocusedNodeId(prevId || null);
        setSelectedSegmentIds(new Set());
        setSelectionContext(null);
    };

    const clearSelection = () => {
        setSelectedSegmentIds(new Set());
        setSelectionContext(null);
    };

    const startSession = async () => {
        setLoading(true);
        try {
            const response = await fetchApiUtil<any>({
                method: 'POST',
                url: `/api/workspaces/student/${workspaceId}/learning/analyze`,
                body: {
                    contextType,
                    contextId,
                    question: initialQuestion,
                    correctAnswer,
                    userAnswer,
                    subjectTitle,
                    complexity,
                    locale
                }
            });

            if (response.status === 200) {
                const newSession = response.data.data?.session;
                setSession(newSession);
                setHasStarted(true);
            } else {
                toast.error('Failed to start session');
            }
        } catch (error) {
            ConsoleLogger.error('Session start error:', error);
            toast.error('Failed to start analysis session');
        } finally {
            setLoading(false);
        }
    };

    const handleExplainSelection = async (regenerateId?: string) => {
        if (!selectedText && !regenerateId) {
            toast.info('Please select segments to explain');
            return;
        }

        setTermLoading(true);
        try {
            const parentDigestId = regenerateId ?
                getDigests(session).find(d => d.id === regenerateId)?.parentId :
                (selectionContext?.type === 'digest' ? selectionContext.id : focusedNodeId);

            const regenNode = regenerateId ? getDigests(session).find(d => d.id === regenerateId) : null;
            const textToExplain = regenNode ? regenNode.content : selectedText;

            const response = await fetchApiUtil<any>({
                method: 'POST',
                url: `/api/workspaces/student/${workspaceId}/learning/analyze`,
                body: {
                    contextType,
                    contextId,
                    question: initialQuestion,
                    correctAnswer,
                    userAnswer,
                    subjectTitle,
                    complexity,
                    selectedText: textToExplain,
                    digests: getDigests(session),
                    parentDigestId,
                    regenerateDigestId: regenerateId,
                    locale
                }
            });

            if (response.status === 200) {
                const updatedSession = response.data.data?.session;
                setSession(updatedSession);
                clearSelection();
            } else {
                toast.error('Failed to explain term');
            }
        } catch (error) {
            ConsoleLogger.error('Analysis error:', error);
            toast.error('Failed to explain');
        } finally {
            setTermLoading(false);
        }
    };

    const renderTextWithSegments = (text: string, nodeId: string, nodeType: 'question' | 'digest') => {
        const segments = splitToSegments(text);
        const digests = getDigests(session);

        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2">
                    {segments.map((seg, idx) => {
                        const segmentId = `${nodeId}:${idx}`;
                        const isSelected = selectedSegmentIds.has(segmentId);
                        // Find digest for EXACT segment or close match
                        const inlineDigest = digests.find(d => d.parentId === (nodeType === 'question' ? null : nodeId) && d.content.includes(seg.trim()));

                        return (
                            <div key={segmentId} className="inline-block max-w-full">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSegmentIds(prev => {
                                            const next = new Set(prev);
                                            if (next.has(segmentId)) next.delete(segmentId);
                                            else next.add(segmentId);
                                            return next;
                                        });
                                        setSelectionContext({ id: nodeId, type: nodeType });
                                    }}
                                    className={`px-1.5 py-0.5 rounded-app cursor-pointer transition-all duration-200 prose prose-sm max-w-none inline-block ${isSelected
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm font-medium'
                                        : 'hover:bg-indigo-50/50 text-gray-700'
                                        }`}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({ children }) => <span className="m-0">{children}</span>,
                                        }}
                                    >
                                        {seg}
                                    </ReactMarkdown>
                                </div>
                                {inlineDigest && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateToFocus(inlineDigest.id);
                                        }}
                                        className="mt-1 ml-4 pl-3 border-l-2 border-indigo-200 cursor-pointer group animate-fadeIn bg-app-bright-green/10"
                                    >
                                        <div className="text-[14px] text-secondary italic line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {inlineDigest.aiResponse.substring(0, 80)}...
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDigestNode = (node: DigestNode) => {
        return (
            <div key={node.id} className="relative mt-4 first:mt-0 animate-fadeIn">
                <div className="bg-white rounded-app shadow-sm border border-indigo-100/50 transition-all duration-300 hover:shadow-md hover:border-indigo-200 overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-indigo-50/30 border-b border-indigo-100/30">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-app bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">
                                    Explanation Step
                                </div>
                                <div className="text-sm font-bold text-gray-800 line-clamp-1">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({ children }) => <span className="m-0">{children}</span>,
                                        }}
                                    >
                                        {node.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleExplainSelection(node.id)}
                            disabled={termLoading}
                            className="text-[10px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 uppercase tracking-widest px-4 py-2 bg-indigo-100/50 rounded-app transition-all active:scale-95"
                        >
                            {termLoading ? 'Wait...' : 'Regenerate'}
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="text-gray-700 leading-relaxed">
                            {renderTextWithSegments(node.aiResponse, node.id, 'digest')}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    const focusedNode = focusedNodeId ? getDigests(session).find(d => d.id === focusedNodeId) : null;

    return (
        <div id="learning-modal-root" className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
            <div className='bg-white rounded-app shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all relative'>

                {/* Header */}
                <div className='flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 relative z-[56] shadow-sm'>
                    <div className="flex-1">
                        <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-3'>
                            <span className="text-3xl filter drop-shadow-sm">🧬</span>
                            <span>Learning Session</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            {navigationStack.length > 0 || focusedNodeId ? (
                                <button
                                    onClick={navigateBack}
                                    className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            ) : (
                                <p className='text-sm text-gray-500'>Explore concepts with AI-powered discovery.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                            className="text-sm font-semibold text-indigo-600 bg-indigo-50 border-none rounded-app px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
                        >
                            <option value="az">Azerbaijani</option>
                            <option value="en">English</option>
                            <option value="ru">Russian</option>
                        </select>
                        <button onClick={onClose} className='p-2.5 hover:bg-gray-200 rounded-app-full transition-colors group'>
                            <svg className='w-6 h-6 text-gray-400 group-hover:text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 bg-gray-50/30 p-6 overflow-y-auto scroll-smooth"
                >
                    {/* Breadcrumbs for deep nesting */}
                    {navigationStack.length > 0 && (
                        <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Path:</span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium whitespace-nowrap">
                                <span className="hover:text-indigo-600 cursor-pointer" onClick={() => { setFocusedNodeId(null); setNavigationStack([]); }}>Root</span>
                                {navigationStack.map((id, idx) => {
                                    const node = getDigests(session).find((d: any) => d.id === id);
                                    return (
                                        <div key={id} className="flex items-center gap-1">
                                            <span className="text-gray-300">/</span>
                                            <span
                                                className="hover:text-indigo-600 cursor-pointer max-w-[100px] truncate"
                                                onClick={() => {
                                                    const newStack = navigationStack.slice(0, idx);
                                                    setNavigationStack(newStack);
                                                    setFocusedNodeId(id);
                                                }}
                                            >
                                                {node?.content || '...'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!focusedNodeId ? (
                        /* Root View */
                        <div className={`transition-all duration-500 ${hasStarted ? 'mb-8' : 'my-12 scale-105 mx-auto max-w-2xl'}`}>
                            <div className="bg-white border rounded-app shadow-sm p-8 relative overflow-hidden transition-all border-indigo-100">
                                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                    <svg className="w-32 h-32 text-indigo-600 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                                </div>
                                <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-4">
                                    {contextType === 'quiz' ? 'Main Question' : contextType === 'homework' ? 'Homework Context' : 'Topic Discovery'}
                                </h3>
                                <div className="text-xl text-gray-800 leading-relaxed font-semibold relative z-10">
                                    {renderTextWithSegments(initialQuestion, 'root', 'question')}
                                </div>

                                {!hasStarted && (
                                    <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center gap-4 relative z-10">
                                        <p className="text-sm text-gray-400 font-medium text-center">
                                            Need help understanding this? Start a full analysis to explore the concepts.
                                        </p>
                                        <button
                                            onClick={startSession}
                                            disabled={loading}
                                            className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-app font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-app-full animate-spin" />
                                                    Initializing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Start Analysis
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Focus View */
                        <div className="mb-8 animate-fadeIn">
                            <div className="bg-white rounded relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/20">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">
                                        Focusing on: {focusedNode?.content}
                                    </h3>
                                    <button
                                        onClick={() => handleExplainSelection(focusedNodeId)}
                                        disabled={termLoading}
                                        className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest px-4 py-2 rounded-app shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                                    >
                                        {termLoading ? (
                                            <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        ) : 'Regenerate'}
                                    </button>
                                </div>
                                <div className="text-xl text-gray-800 leading-relaxed relative z-10">
                                    {renderTextWithSegments(focusedNode?.aiResponse || '', focusedNodeId, 'digest')}
                                </div>
                            </div>
                        </div>
                    )}

                    {hasStarted && (
                        <div className="space-y-6 pb-32">
                            {visibleNodes.map((node) => renderDigestNode(node))}
                        </div>
                    )}

                    {/* Accumulated Selection Bar */}
                    {selectedText && (
                        <div
                            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/95 text-white backdrop-blur-xl px-8 py-5 rounded-app shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 animate-slideUp z-[70] border border-white/10 max-w-[95vw]"
                        >
                            <div className="overflow-hidden min-w-[120px]">
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">Targeting {selectedSegmentIds.size} Chunks:</span>
                                <span className="font-semibold text-amber-300 truncate block max-w-[250px] text-lg italic">"{selectedText.substring(0, 40)}{selectedText.length > 40 ? '...' : ''}"</span>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={clearSelection}
                                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    CLEAR
                                </button>
                                <button
                                    onClick={() => handleExplainSelection()}
                                    disabled={termLoading}
                                    className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white text-base font-black rounded-app shadow-xl shadow-indigo-500/30 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {termLoading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    )}
                                    {termLoading ? 'Analyzing...' : 'DEEP DIVE'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
