"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface Subject {
  id: string;
  title: string;
}

interface ProviderSubjectSelectorWidgetProps {
  selectedSubjectId: string | null;
  onSubjectSelect: (id: string | null) => void;
  error?: string;
}

export function ProviderSubjectSelectorWidget({ selectedSubjectId, onSubjectSelect, error }: ProviderSubjectSelectorWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await apiCallForSpaHelper({
          method: 'GET',
          url: `/api/workspaces/provider/${workspaceId}/subjects`,
          params: {},
          body: {}
        });

        if (response.status === 200) {
          setSubjects(response.data.subjects || []);
        } else {
          ConsoleLogger.error('Error fetching subjects:', response.data);
        }
      } catch (err) {
        ConsoleLogger.error('Error loading subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onSubjectSelect(value || null);
  };

  return (
    <div className="w-full">
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        Subject <span className="text-red-500">*</span>
      </label>
      <select
        value={selectedSubjectId || ''}
        onChange={handleChange}
        disabled={loading}
        className={`block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
      >
        <option value="">Select a Subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.title}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

