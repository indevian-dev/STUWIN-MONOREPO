"use client";
import React from 'react';

const GRADE_LEVELS = [
  { value: 1, label: 'Grade 1' },
  { value: 2, label: 'Grade 2' },
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'Grade 7' },
  { value: 8, label: 'Grade 8' },
  { value: 9, label: 'Grade 9' },
  { value: 10, label: 'Grade 10' },
  { value: 11, label: 'Grade 11' },
  { value: 12, label: 'Grade 12' }
];

interface ProviderGradeLevelSelectorWidgetProps {
  selectedGradeLevel: number | null;
  onGradeLevelSelect: (level: number | null) => void;
  error?: string;
}

export function ProviderGradeLevelSelectorWidget({ selectedGradeLevel, onGradeLevelSelect, error }: ProviderGradeLevelSelectorWidgetProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onGradeLevelSelect(value ? parseInt(value) : null);
  };

  return (
    <div className="w-full">
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        Grade Level <span className="text-red-500">*</span>
      </label>
      <select
        value={selectedGradeLevel || ''}
        onChange={handleChange}
        className={`block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        <option value="">Select Grade Level</option>
        {GRADE_LEVELS.map((grade) => (
          <option key={grade.value} value={grade.value}>
            {grade.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

