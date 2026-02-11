"use client";
import React from 'react';

const COMPLEXITY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

interface ProviderComplexitySelectorWidgetProps {
  selectedComplexity: string | null;
  onComplexitySelect: (complexity: string | null) => void;
  error?: string;
}

export function ProviderComplexitySelectorWidget({ selectedComplexity, onComplexitySelect, error }: ProviderComplexitySelectorWidgetProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onComplexitySelect(event.target.value || null);
  };

  return (
    <div className="w-full">
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        Complexity <span className="text-red-500">*</span>
      </label>
      <select
        value={selectedComplexity || ''}
        onChange={handleChange}
        className={`block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        <option value="">Select Complexity</option>
        {COMPLEXITY_LEVELS.map((complexity) => (
          <option key={complexity.value} value={complexity.value}>
            {complexity.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

