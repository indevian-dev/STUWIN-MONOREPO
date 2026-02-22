// components/SubjectSelector.tsx
"use client";

import React, {
  useState,
  useEffect
} from 'react';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { useTranslations } from 'next-intl';
import { GlobalSelectWidget } from '@/app/[locale]/(global)/(widgets)/GlobalSelect.widget';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface Subject {
  id: string;
  title: string;
  parent_id: string | null;
  children?: Subject[];
}

interface PublicSubjectSelectorWidgetProps {
  onSubjectChange: (selectedPath: string[]) => void;
}

export function PublicSubjectSelectorWidget({ onSubjectChange }: PublicSubjectSelectorWidgetProps) {
  const t = useTranslations('Global');
  const [subjectsHierarchy, setSubjectsHierarchy] = useState<Subject[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const response = await fetchApiUtil<any>({
          method: 'GET',
          url: '/api/subjects'
        });

        // apiCall throws on error — no manual status check needed
        const subjects = response.subjects as Subject[];
        ConsoleLogger.log(subjects);

        const buildHierarchy = (arr: Subject[], parentId: string | null = null): Subject[] => arr
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildHierarchy(arr, item.id),
          }));

        const hierarchy = buildHierarchy(subjects);
        setSubjectsHierarchy(hierarchy);

      } catch (error) {
        ConsoleLogger.error('Error fetching subjects:', error instanceof Error ? error.message : String(error));
      }
    }

    fetchSubjects();
  }, []);

  useEffect(() => {
    // Communicate the selected subject path to the parent component
    onSubjectChange(selectedPath);
  }, [selectedPath, onSubjectChange]);

  const handleSubjectChange = (subjectId: string | number, level: number) => {
    // Clear all child selections when a parent subject changes
    const newPath = selectedPath.slice(0, level);
    newPath[level] = String(subjectId);
    setSelectedPath(newPath);
  };

  const renderSubjectSelect = (subjects: Subject[], level: number = 0): React.ReactElement | null => {
    if (!subjects || subjects.length === 0) return null;

    const selectedId = selectedPath[level];
    const selectedSubject = subjects.find(subj => subj.id === selectedId);

    return (
      <>
        <div className="mb-4 text-md">
          <label className="block text-app-dark-blue dark:text-white font-bold mt-2 mb-2">{t("subject")}</label>
          <GlobalSelectWidget
            options={subjects.map(subject => ({ label: subject.title, value: subject.id }))}
            onChange={(value: string | string[]) => handleSubjectChange(Array.isArray(value) ? value[0] : value, level)}
            value={selectedId}
          />
        </div>
        {selectedSubject?.children && selectedSubject.children.length > 0 &&
          renderSubjectSelect(selectedSubject.children, level + 1)}
      </>
    );
  };

  return (
    <>{renderSubjectSelect(subjectsHierarchy)}</>
  );
};
