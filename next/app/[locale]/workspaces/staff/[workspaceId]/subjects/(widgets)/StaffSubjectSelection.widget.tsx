import { ConsoleLogger } from '@/lib/logging/Console.logger';


"use client";
import {
  useState,
  useEffect
} from 'react';
import supabase
  from '@/lib/integrations/supabase/Pgsql.client';

interface Type {
  id: number;
  title: string;
}

interface StaffSubjectSelectionWidgetProps {
  selectedTypeId?: number | string;
  onTypeSelect: (typeId: string) => void;
}

export function StaffSubjectSelectionWidget({ selectedTypeId, onTypeSelect }: StaffSubjectSelectionWidgetProps) {
  const [types, setTypes] = useState<Type[]>([]);
  const [selectedType, setSelectedType] = useState<string>(String(selectedTypeId || ''));

  useEffect(() => {
    const fetchTypes = async () => {
      let { data, error } = await supabase.from('types').select('id, title');
      if (error) {
        ConsoleLogger.error('Error fetching types:', error);
      } else {
        setTypes(data ?? []);
      }
    };

    fetchTypes();
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      setSelectedType(String(selectedTypeId));
    }
  }, [selectedTypeId]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(event.target.value);
    onTypeSelect(event.target.value);
  };

  return (
    <div className="relative inline-block w-full">
      <select
        value={selectedType}
        onChange={handleChange}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-app shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">Select a Type</option>
        {types.map((type) => (
          <option key={type.id} value={type.id}>
            {type.title}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.516 7.548c0.436-0.446 1.043-0.481 1.576 0l2.908 2.957 2.908-2.957c0.533-0.481 1.141-0.446 1.576 0 0.436 0.445 0.408 1.197 0 1.615l-3.415 3.473c-0.267 0.271-0.701 0.271-0.968 0l-3.415-3.473c-0.408-0.418-0.436-1.17 0-1.615z" />
        </svg>
      </div>
    </div>
  );

}
