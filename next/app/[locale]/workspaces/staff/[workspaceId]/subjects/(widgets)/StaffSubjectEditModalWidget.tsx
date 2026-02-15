"use client";

import React, {
  useState,
  useEffect
} from 'react';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { BaseModalProps } from '@stuwin/shared/types';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface Subject {
  id: string;
  title: string;
  description: string;
  cover: string | null;
  isActive: boolean;
  aiLabel: string | null;
  language: string;
  gradeLevel: number;
}

interface StaffSubjectEditModalWidgetProps extends BaseModalProps {
  subjectId: string;
  onSuccess?: () => void;
}

export function StaffSubjectEditModalWidget({
  subjectId,
  isOpen,
  onClose,
  onSuccess
}: StaffSubjectEditModalWidgetProps) {
  const [subject, setSubject] = useState<Subject>({
    id: subjectId,
    title: '',
    description: '',
    cover: null,
    isActive: true,
    aiLabel: null,
    language: 'az',
    gradeLevel: 1
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      if (!subjectId || !isOpen) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiCall<any>({
          method: 'GET',
          url: `/api/workspaces/staff/subjects/${subjectId}`,
          params: {}
        });

        const s = response.subject;
        // Ensure defaults if missing
        setSubject({
          ...s,
          language: s.language || 'az',
          gradeLevel: s.gradeLevel || 1
        });

      } catch (error) {
        ConsoleLogger.error('Error fetching subject:', error);
        setError('Failed to fetch subject');
      }
      setLoading(false);
    };

    fetchSubject();
  }, [subjectId, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSubject({
      ...subject,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!subject.title.trim()) {
        setError("Title is required");
        setLoading(false);
        return;
      }

      const response = await apiCall<any>({
        method: 'PUT',
        url: `/api/workspaces/staff/subjects/update/${subjectId}`,
        params: {},
        body: {
          title: subject.title,
          description: subject.description,
          is_active: subject.isActive,
          language: subject.language,
          gradeLevel: subject.gradeLevel,
          cover: subject.cover || undefined,
          aiLabel: subject.aiLabel || undefined
        }
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      ConsoleLogger.error('Error updating subject:', error);
      setError('Failed to update subject');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed w-full inset-0 top-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-start p-4 md:p-16 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded w-full mx-4 lg:w-2/3 max-w-3xl shadow-xl my-8">
        <h2 className="text-2xl font-bold mb-4">Edit Subject</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && !subject.title ? (
          <GlobalLoaderTile />
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={subject.title}
                onChange={handleChange}
                placeholder="e.g. Matematika .AZ.9"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {"The name of the subject (e.g. \"Mathematics\")"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Language *
                </label>
                <select
                  name="language"
                  id="language"
                  value={subject.language}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  <option value="az">Azerbaijani (AZ)</option>
                  <option value="ru">Russian (RU)</option>
                  <option value="en">English (EN)</option>
                  <option value="tr">Turkish (TR)</option>
                </select>
              </div>
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade *
                </label>
                <select
                  name="gradeLevel"
                  id="gradeLevel"
                  value={subject.gradeLevel}
                  onChange={(e) => setSubject({ ...subject, gradeLevel: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                id="description"
                value={subject.description}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="aiLabel" className="block text-sm font-medium text-gray-700 mb-1">
                AI Label (Optional)
              </label>
              <input
                type="text"
                name="aiLabel"
                id="aiLabel"
                value={subject.aiLabel || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-1">
                Cover URL (Optional)
              </label>
              <input
                type="text"
                name="cover"
                id="cover"
                value={subject.cover || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={subject.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

