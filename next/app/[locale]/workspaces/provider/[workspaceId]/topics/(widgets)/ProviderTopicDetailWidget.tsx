"use client";

import { useState, useEffect } from 'react';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { Topic } from '@/types';
import { ApiResponse } from '@/types';
import { useRouter, useParams } from 'next/navigation';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface ProviderTopicDetailWidgetProps {
  topicId: string;
}

export function ProviderTopicDetailWidget({
  topicId
}: ProviderTopicDetailWidgetProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/topics?id=${topicId}`,
        params: {}
      });

      if (response.status === 200 && response.data) {
        const apiResponse = response.data as ApiResponse<{ topic: Topic }>;

        if ('data' in apiResponse && apiResponse.data && !Array.isArray(apiResponse.data)) {
          setTopic(apiResponse.data.topic);
        } else {
          setError('Failed to load topic');
        }
      } else {
        setError('Failed to load topic');
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching topic:', error);
      setError('Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const goBack = (): void => {
    router.push(`/workspaces/provider/${workspaceId}/topics`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Topic not found'}</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={goBack}
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded text-gray-700 font-medium"
        >
          ← Back to Topics
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>

        {topic.aiSummary && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">AI Summary</h3>
            <p className="text-blue-800">{topic.aiSummary}</p>
          </div>
        )}

        {topic.description && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Content</h3>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: topic.description }} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <span className="text-sm font-medium text-gray-600">Grade Level:</span>
            <span className="ml-2 text-sm text-gray-900">{topic.gradeLevel || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Subject ID:</span>
            <span className="ml-2 text-sm text-gray-900">{topic.providerSubjectId || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

