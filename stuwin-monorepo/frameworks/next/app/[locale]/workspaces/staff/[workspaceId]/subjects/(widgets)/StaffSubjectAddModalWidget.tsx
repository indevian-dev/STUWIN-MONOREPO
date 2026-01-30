"use client";

import { useState, FormEvent } from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface StaffSubjectAddModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StaffSubjectAddModalWidget({ 
  isOpen, 
  onClose, 
  onSuccess
}: StaffSubjectAddModalWidgetProps) {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [aiLabel, setAiLabel] = useState<string>('');
  const [cover, setCover] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiCallForSpaHelper({ 
        method: 'POST', 
        url: '/api/workspaces/staff/subjects/create',
        params: {},
        body: { 
          title, 
          description,
          ...(aiLabel && { aiLabel }),
          ...(cover && { cover })
        }
      });

      if (response.status === 200 || response.status === 201) {
        // Reset form
        setTitle('');
        setDescription('');
        setAiLabel('');
        setCover('');
        setIsActive(true);
        
        // Notify parent and close
        onSuccess?.();
        onClose();
      } else {
        setError(response.data?.error || 'Failed to create subject');
      }
    } catch (err) {
      ConsoleLogger.error('Error creating subject:', err);
      setError('Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setAiLabel('');
      setCover('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded w-full max-w-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Add New Subject</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loading}
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loading}
            />
          </div>

          {/* AI Label Input */}
          <div>
            <label htmlFor="aiLabel" className="block text-sm font-medium text-gray-700 mb-1">
              AI Label (Optional)
            </label>
            <input
              type="text"
              id="aiLabel"
              value={aiLabel}
              onChange={(e) => setAiLabel(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Cover URL Input */}
          <div>
            <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-1">
              Cover URL (Optional)
            </label>
            <input
              type="text"
              id="cover"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Subject'}
          </button>
        </div>
      </form>
    </div>
  );
}
