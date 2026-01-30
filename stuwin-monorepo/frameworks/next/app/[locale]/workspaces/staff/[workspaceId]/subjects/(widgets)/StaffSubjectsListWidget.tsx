"use client";

import { useState, useEffect } from 'react';
import { StaffSubjectAddModalWidget } from './StaffSubjectAddModalWidget';
import { StaffSubjectEditModalWidget } from './StaffSubjectEditModalWidget';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { Subject } from '@/types/resources/subjects';
import { ApiResponse, SuccessApiResponse } from '@/types';

interface OrganizedSubject extends Subject.PrivateAccess {
  children?: OrganizedSubject[];
}

export function StaffSubjectsListWidget() {
  const [subjectsList, setSubjectsList] = useState<OrganizedSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentEditSubjectId, setCurrentEditSubjectId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddSubjectModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditSubjectModalOpen] = useState<boolean>(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState<boolean>(false);
  const [selectedSubjectForDeletion, setSelectedSubjectForDeletion] = useState<number | null>(null);

  const openAddSubjectMainModal = (): void => {
    setIsAddSubjectModalOpen(true);
  };

  const closeAddSubjectModal = (): void => {
    setIsAddSubjectModalOpen(false);
  };

  const openEditSubjectModal = (subjectId: number): void => {
    setCurrentEditSubjectId(subjectId);
    setIsEditSubjectModalOpen(true);
  };

  const closeEditSubjectModal = (): void => {
    setIsEditSubjectModalOpen(false);
    setCurrentEditSubjectId(null);
  };

  const handleSubjectSuccess = (): void => {
    fetchSubjects();
  };

  useEffect(() => {


    fetchSubjects();
  }, []);

  const fetchSubjects = async (): Promise<void> => {
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
  };

  const openDeleteConfirmationModal = (subjectId: number): void => {
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

  const renderSubjects = (subjects: OrganizedSubject[]): React.ReactElement[] => {
    return subjects.map((subject) => (
      <div key={subject.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {subject.title}
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
              {subject.aiLabel && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                  AI: {subject.aiLabel}
                </span>
              )}
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Total Subjects: {subjectsList.length}
          </p>
        </div>
        <button
          onClick={() => openAddSubjectMainModal()}
          className="px-4 py-2 border rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm"
        >
          Add New Subject
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      ) : subjectsList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No subjects found</p>
          <button
            onClick={() => openAddSubjectMainModal()}
            className="px-4 py-2 border rounded bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            Create Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {renderSubjects(subjectsList)}
        </div>
      )}

      <StaffSubjectAddModalWidget
        isOpen={isAddModalOpen}
        onClose={closeAddSubjectModal}
        onSuccess={handleSubjectSuccess}
      />

      <StaffSubjectEditModalWidget
        subjectId={currentEditSubjectId ?? 0}
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
