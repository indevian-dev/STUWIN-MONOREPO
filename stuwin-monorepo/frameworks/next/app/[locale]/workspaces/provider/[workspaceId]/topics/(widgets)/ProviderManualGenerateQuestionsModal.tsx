"use client";

import { useState, useEffect } from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useParams } from 'next/navigation';
import { ApiResponse } from '@/types';
import { Topic } from '@/types/resources/topics';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface ProviderManualGenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  onSuccess?: () => void;
}

interface Subject {
  id: string;
  title: string;
}

export function ProviderManualGenerateQuestionsModal({
  isOpen,
  onClose,
  topicId,
  onSuccess
}: ProviderManualGenerateQuestionsModalProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [loading, setLoading] = useState<boolean>(false);
  const [topic, setTopic] = useState<Topic | null>(null);

  const [formData, setFormData] = useState({
    language: 'azerbaijani' as 'azerbaijani' | 'russian' | 'english',
    mode: 'text' as 'text' | 'pdf' | 'image',
    complexities: {
      easy: false,
      medium: false,
      hard: false
    },
    questionsPerComplexity: 5
  });

  useEffect(() => {
    if (isOpen && topicId) {
      fetchTopicDetails();
    }
  }, [isOpen, topicId]);

  const fetchTopicDetails = async (): Promise<void> => {
    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/provider/${workspaceId}/topics`,
      params: { id: topicId }
    }) as ApiResponse<{ topic: Topic }>;

    if ('success' in response && response.success && 'data' in response && response.data) {
      setTopic(response.data.topic);
    }
  };

  const handleComplexityChange = (complexity: 'easy' | 'medium' | 'hard'): void => {
    setFormData(prev => ({
      ...prev,
      complexities: {
        ...prev.complexities,
        [complexity]: !prev.complexities[complexity]
      }
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    const selectedComplexities = Object.entries(formData.complexities)
      .filter(([_, selected]) => selected)
      .map(([complexity, _]) => complexity);

    if (selectedComplexities.length === 0) {
      alert('Please select at least one complexity level');
      return;
    }

    setLoading(true);

    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/provider/${workspaceId}/questions/queue`,
        body: {
          topicId,
          language: formData.language,
          mode: formData.mode,
          complexities: selectedComplexities,
          questionsPerComplexity: formData.questionsPerComplexity
        }
      });

      if (response.status === 200) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      ConsoleLogger.error('Error queuing generation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded w-full max-w-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Generate Questions for Topic</h2>

        {topic && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="font-medium">{topic.name}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complexity Levels</label>
            <div className="space-y-2">
              {(['easy', 'medium', 'hard'] as const).map(complexity => (
                <label key={complexity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.complexities[complexity]}
                    onChange={() => handleComplexityChange(complexity)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="capitalize">{complexity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions per Complexity</label>
            <input
              type="number"
              value={formData.questionsPerComplexity}
              onChange={(e) => setFormData({ ...formData, questionsPerComplexity: parseInt(e.target.value) || 1 })}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="azerbaijani">Azerbaijani</option>
              <option value="russian">Russian</option>
              <option value="english">English</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded text-gray-700 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Queueing...' : 'Generate Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}

