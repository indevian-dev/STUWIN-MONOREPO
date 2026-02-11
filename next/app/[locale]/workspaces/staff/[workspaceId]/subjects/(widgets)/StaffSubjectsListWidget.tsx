"use client";

import { useState, useEffect, useCallback } from 'react';
import { StaffSubjectAddModalWidget } from './StaffSubjectAddModalWidget';
import { StaffSubjectEditModalWidget } from './StaffSubjectEditModalWidget';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { Subject } from '@/types/domain/subject';
import { ApiResponse, SuccessApiResponse } from '@/types';

interface OrganizedSubject extends Subject.PrivateAccess {
  children?: OrganizedSubject[];
}

export function StaffSubjectsListWidget() {
  const [subjectsList, setSubjectsList] = useState<OrganizedSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [currentEditSubjectId, setCurrentEditSubjectId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddSubjectModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditSubjectModalOpen] = useState<boolean>(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<boolean>(false);
  const [selectedSubjectForDeletion, setSelectedSubjectForDeletion] = useState<string | null>(null);

  const openAddSubjectMainModal = (): void => {
    setIsAddSubjectModalOpen(true);
  };

  const closeAddSubjectModal = (): void => {
    setIsAddSubjectModalOpen(false);
  };

  const openEditSubjectModal = (subjectId: string): void => {
    setCurrentEditSubjectId(subjectId);
    setIsEditSubjectModalOpen(true);
  };

  const closeEditSubjectModal = (): void => {
    setIsEditSubjectModalOpen(false);
    setCurrentEditSubjectId(null);
  };

  const fetchSubjects = useCallback(async (): Promise<void> => {
    setLoading(true);

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: '/api/workspaces/staff/subjects',
      params: {}
    });

    if (response.status === 200 && response.data) {
      const apiResponse = response.data as SuccessApiResponse<{ subjects: Subject.PrivateAccess[] }>;
      if (apiResponse.success && apiResponse.data) {
        setSubjectsList(apiResponse.data.subjects as OrganizedSubject[]);
      }
    }
    setLoading(false);
  }, []);

  const handleSubjectSuccess = (): void => {
    fetchSubjects();
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchSubjects());
  }, [fetchSubjects]);


  const openDeleteConfirmationModal = (subjectId: string): void => {
    setSelectedSubjectForDeletion(subjectId);
    setShowDeleteConfirmationModal(true);
  };

  const closeDeleteConfirmationModal = (): void => {
    setShowDeleteConfirmationModal(false);
    setSelectedSubjectForDeletion(null);
  };

  const deleteSubject = async (): Promise<void> => {
    if (!selectedSubjectForDeletion) return;

    const response = await apiCallForSpaHelper({
      method: 'DELETE',
      url: '/api/workspaces/staff/subjects/delete/' + selectedSubjectForDeletion,
      params: {}
    });

    if (response.status === 200) {
      fetchSubjects();
      closeDeleteConfirmationModal();
    }
  };

  const parseSubjectInfo = (title: string) => {
    const regex = / \.([A-Z]+)\.(\d+)$/;
    const match = title.match(regex);
    if (match) {
      return { lang: match[1], grade: match[2] };
    }
    return null;
  };

  const filteredSubjects = subjectsList.filter(subject => {
    const info = parseSubjectInfo(subject.title);
    const langMatch = filterLang === 'all' || (info && info.lang === filterLang);
    const gradeMatch = filterGrade === 'all' || (info && info.grade === filterGrade);
    return langMatch && gradeMatch;
  });

  const uniqueLangs = Array.from(new Set(subjectsList.map(s => parseSubjectInfo(s.title)?.lang).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(subjectsList.map(s => parseSubjectInfo(s.title)?.grade).filter(Boolean))).sort((a, b) => parseInt(a!) - parseInt(b!));

  const renderSubjects = (subjects: OrganizedSubject[]): React.ReactElement[] => {
    return subjects.map((subject) => (
      <div key={subject.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {subject.displayTitle || subject.title}
              </h2>
              {!subject.isActive && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded font-medium">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{subject.description}</p>
            <div className="flex gap-2 text-xs text-gray-500">
              <span>ID: {subject.id}</span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => openEditSubjectModal(subject.id)}
              className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setSelectedSubjectForDeletion(subject.id);
                setShowDeleteConfirmationModal(true);
              }}
              className="px-3 py-1.5 border rounded bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="langFilter" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Language</label>
            <select
              id="langFilter"
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white px-2 py-1 border"
            >
              <option value="all">All Languages</option>
              {uniqueLangs.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="gradeFilter" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Grade</label>
            <select
              id="gradeFilter"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white px-2 py-1 border"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
            </select>
          </div>

          <div className="mt-4 md:mt-0 pt-4 md:pt-0">
            <p className="text-xs text-gray-500">
              Showing {filteredSubjects.length} of {subjectsList.length} subjects
            </p>
          </div>
        </div>

        <button
          onClick={() => openAddSubjectMainModal()}
          className="px-4 py-2 border rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm flex items-center gap-2"
        >
          Add New Subject
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No subjects match your filters</p>
          <button
            onClick={() => {
              setFilterLang('all');
              setFilterGrade('all');
            }}
            className="px-4 py-2 text-emerald-600 font-medium hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {renderSubjects(filteredSubjects)}
        </div>
      )
      }

      <StaffSubjectAddModalWidget
        isOpen={isAddModalOpen}
        onClose={closeAddSubjectModal}
        onSuccess={handleSubjectSuccess}
      />

      <StaffSubjectEditModalWidget
        subjectId={currentEditSubjectId ?? ''}
        isOpen={isEditModalOpen}
        onClose={closeEditSubjectModal}
        onSuccess={handleSubjectSuccess}
      />

      {showDeleteConfirmationModal && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h2 className="text-xl font-semibold mb-3">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to delete this subject? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirmationModal}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteSubject}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
