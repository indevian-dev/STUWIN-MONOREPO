"use client";

import { ConsoleLogger } from '@/lib/logging/Console.logger';

import React
  from 'react';

interface FilterOption {
  id: number | string;
  title: string;
}

interface Filter {
  id: number | string;
  title: string;
  type: 'DYNAMIC' | 'STATIC';
  options: FilterOption[];
}

interface SelectedOption {
  filter_id: string;
  type: string;
  option_id: string | null;
  dynamic_value: string | null;
}

interface PublicFilterSelectorWidgetProps {
  filters: Filter[];
  onOptionsChange: (updater: (prevOptions: SelectedOption[]) => SelectedOption[]) => void;
}

const PublicFilterSelectorWidget = ({ filters, onOptionsChange }: PublicFilterSelectorWidgetProps) => {

  const handleOptionChange = (filterId: string, optionValue: string, type: string) => {
    ConsoleLogger.log("handleOptionChange called with filterId:", filterId, "optionValue:", optionValue, "type:", type);

    onOptionsChange((prevOptions: SelectedOption[]) => {
      const currentOptions = Array.isArray(prevOptions) ? prevOptions : [];
      const optionIndex = currentOptions.findIndex(option => option.filter_id === filterId);

      // Determine the structure of the update based on the filter type
      const updatedOption = {
        filter_id: filterId,
        type,
        // If the type is DYNAMIC, set option_id to null and assign optionValue to dynamic_value.
        // Otherwise, set option_id to optionValue and dynamic_value to null.
        option_id: type === 'DYNAMIC' ? null : optionValue,
        dynamic_value: type === 'DYNAMIC' ? optionValue : null,
      };

      if (optionIndex !== -1) {
        // If the filter already exists in the options, update it
        const updatedOptions = [...currentOptions];
        updatedOptions[optionIndex] = updatedOption;
        return updatedOptions;
      } else {
        // If it's a new filter, add it to the options array
        return [...currentOptions, updatedOption];
      }
    });
  };

  return (
    <div>
      {filters.map((filter) => (
        <div key={filter.id} className="mb-4">
          <label className="block text-gray-700 text-lg mt-2 mb-2">{filter.title}</label>
          {filter.type === 'DYNAMIC' ? (
            // Render input field for dynamic filters
            <input
              type="text" // or "number" if you expect numeric input
              className="shadow appearance-none border border-gray-600 rounded-app w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              onChange={(e) => handleOptionChange(filter.id.toString(), e.target.value, filter.type)}
            />
          ) : (
            // Render select dropdown for static filters
            <select
              className="block w-full mt-1 border border-gray-600 rounded-app shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 text-lg"
              onChange={(e) => handleOptionChange(filter.id.toString(), e.target.value, filter.type)}
            >
              <option value="">Select Option</option>
              {filter.options.map(option => (
                <option key={option.id} value={option.id}>{option.title}</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
};

export default PublicFilterSelectorWidget;
