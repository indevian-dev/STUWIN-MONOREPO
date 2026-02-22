"use client";

import { ConsoleLogger } from '@/lib/logging/Console.logger';

import {
  useState,
  useRef,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import {
  toast
} from 'react-toastify';

interface StudentQuizAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  subjectTitle?: string;
  complexity?: string;
}

export function StudentQuizAnalysisModal({
  isOpen,
  onClose,
  question,
  correctAnswer,
  userAnswer,
  subjectTitle,
  complexity
}: StudentQuizAnalysisModalProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  // Session State
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [termLoading, setTermLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [locale, setLocale] = useState(params.locale as string || 'az');

  // Selection State
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  // selectionContext tracks WHICH block we are selecting from
  const [selectionContext, setSelectionContext] = useState<{ id: string, type: 'question' | 'digest', fullText: string } | null>(null);

  // Reset session state when modal closes OR when question changes (new question = fresh start)
  useEffect(() => {
    setHasStarted(false);
    setSession(null);
    setSelectedIndices([]);
    setSelectedText('');
    setSelectionContext(null);
  }, [isOpen, question]);

  const getDigests = (currentSession: any): any[] => {
    if (!currentSession?.digests) return [];
    if (Array.isArray(currentSession.digests)) return currentSession.digests;
    return currentSession.digests.nodes || [];
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/workspaces/student/${workspaceId}/quizzes/analyze`,
        body: {
          question,
          correctAnswer,
          userAnswer,
          subjectTitle,
          complexity,
          locale
        }
      });

      if (response.status === 200) {
        setSession(response.data.data?.session);
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

  const handleExplainSelection = async () => {
    if (!selectedText) {
      toast.info('Please select text to explain');
      return;
    }

    setTermLoading(true);
    try {
      // Find parentDigestId if selecting from an AI response
      const parentDigestId = selectionContext?.type === 'digest' ? selectionContext.id : undefined;

      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/workspaces/student/${workspaceId}/quizzes/analyze`,
        body: {
          question,
          correctAnswer,
          userAnswer,
          subjectTitle,
          complexity,
          locale,
          selectedText,
          digests: getDigests(session),
          parentDigestId
        }
      });

      if (response.status === 200) {
        setSession(response.data.data?.session);
        // Reset selection
        setSelectedIndices([]);
        setSelectedText('');
        setSelectionContext(null);
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

  const handleWordClick = (word: string, index: number, fullText: string, contextId: string, contextType: 'question' | 'digest') => {
    // If clicking in a different block, reset selection to this new block
    if (selectionContext?.id !== contextId) {
      setSelectedIndices([index]);
      setSelectionContext({ id: contextId, type: contextType, fullText });
      setSelectedText(word);
      return;
    }

    // Toggle logic for same block
    setSelectedIndices(prev => {
      let newIndices;
      if (prev.includes(index)) {
        newIndices = prev.filter(i => i !== index);
      } else {
        newIndices = [...prev, index].sort((a, b) => a - b);
      }

      const words = fullText.split(/(\s+|[.,;:!?()]+)/g);
      const text = newIndices.map(i => words[i]).join('');
      setSelectedText(text);

      if (newIndices.length === 0) {
        setSelectionContext(null);
      }

      return newIndices;
    });
  };

  const ClickableText = ({ text, contextId, contextType }: { text: string, contextId: string, contextType: 'question' | 'digest' }) => {
    if (!text) return null;
    const words = text.split(/(\s+|[.,;:!?()]+)/g).filter(w => w !== '');

    return (
      <span>
        {words.map((word, i) => {
          const isInteractive = !/^\s+$/.test(word);
          const isSelected = selectionContext?.id === contextId && selectedIndices.includes(i);

          return isInteractive ? (
            <span
              key={i}
              onClick={() => handleWordClick(word, i, text, contextId, contextType)}
              className={`cursor-pointer px-0.5 rounded transition-all ${isSelected ? 'bg-amber-300 text-gray-900 font-medium' : 'hover:bg-amber-100'}`}
            >
              {word}
            </span>
          ) : <span key={i}>{word}</span>;
        })}
      </span>
    );
  };

  const renderDigestNode = (node: any) => {
    return (
      <div key={node.id} className="relative pl-6 border-l-2 border-indigo-200 ml-4 mt-4 animate-fadeIn">
        <div className="absolute -left-2 top-0 w-4 h-4 rounded-app-full bg-indigo-500 border-2 border-white"></div>
        <div className="bg-white rounded-app p-4 shadow-xs border border-gray-100">
          <div className="text-xs font-bold text-indigo-500 uppercase mb-1 tracking-wider flex justify-between">
            <span>{node.type === 'term' ? 'Term Explanation' : 'Analysis'}</span>
            <span className="text-gray-400 font-normal">{new Date(node.createdAt).toLocaleTimeString()}</span>
          </div>
          {node.type === 'term' && (
            <div className="text-sm font-semibold text-gray-800 mb-2 bg-amber-50 inline-block px-2 py-1 rounded">
              "{node.content}"
            </div>
          )}
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
            <ClickableText text={node.aiResponse} contextId={node.id} contextType="digest" />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const currentDigests = getDigests(session);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
      <div className='bg-white rounded-app shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all'>

        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
              <span className="text-3xl">🧬</span> Learning Session
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              Deep dive into concepts. Click words to explore further.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">AI Language:</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 border-none rounded-app px-2 py-1 focus:ring-1 focus:ring-indigo-200 cursor-pointer"
              >
                <option value="az">AZ</option>
                <option value="en">EN</option>
                <option value="ru">RU</option>
              </select>
            </div>
            <button onClick={onClose} className='p-2 hover:bg-gray-200 rounded-app-full transition-colors'>
              <svg className='w-6 h-6 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto bg-gray-50/30 p-6 scroll-smooth'>

          {/* Root Context Card */}
          <div className={`transition-all duration-500 ${hasStarted ? 'mb-8' : 'my-12 scale-105'}`}>
            <div className={`bg-white border rounded-app shadow-sm p-6 relative overflow-hidden transition-colors ${selectionContext?.id === 'root-question' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-blue-100'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg className="w-32 h-32 text-blue-600 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
              </div>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Root Question</h3>
              <div className="text-lg text-gray-800 leading-relaxed font-medium relative z-10">
                {hasStarted ? <ClickableText text={question} contextId="root-question" contextType="question" /> : question}
              </div>
            </div>
          </div>

          {!hasStarted && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-indigo-100 rounded-app-full flex items-center justify-center mb-6">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start your discovery</h3>
              <p className="text-gray-600 max-w-sm mb-8 leading-relaxed">
                Unlock deeper insights about this question. We'll analyze your answer and identify key concepts to explore.
              </p>
              <button
                onClick={startSession}
                disabled={loading}
                className="group relative inline-flex items-center gap-3 px-10 py-4 bg-app-bright-green text-white font-bold text-lg rounded-app-full shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Waking up AI...
                  </>
                ) : (
                  <>
                    <span>Begin Analysis</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' /></svg>
                  </>
                )}
              </button>
            </div>
          )}

          {hasStarted && (
            <div className="space-y-4 pb-24">
              {currentDigests.map((node) => renderDigestNode(node))}
            </div>
          )}

          {/* Floating Selection Bar */}
          {selectedText && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/95 text-white backdrop-blur-lg px-6 py-4 rounded-app shadow-2xl flex items-center gap-6 animate-slideUp z-50 border border-white/10 max-w-[90vw]">
              <div className="overflow-hidden">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Exploration target:</span>
                <span className="font-semibold text-amber-300 truncate block">"{selectedText}"</span>
              </div>
              <div className="h-8 w-px bg-gray-700/50"></div>
              <button
                onClick={handleExplainSelection}
                disabled={termLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-app shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {termLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                {termLoading ? 'Analyzing...' : 'Deep Dive'}
              </button>
              <button
                onClick={() => { setSelectedIndices([]); setSelectedText(''); setSelectionContext(null); }}
                className="p-2 hover:bg-white/10 rounded-app text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

