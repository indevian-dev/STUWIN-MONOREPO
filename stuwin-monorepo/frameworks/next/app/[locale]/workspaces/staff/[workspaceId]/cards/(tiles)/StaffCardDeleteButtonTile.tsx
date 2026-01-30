"use client";

import { useState } from 'react';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface StaffCardDeleteButtonElementProps {
  cardId: number;
  cardTitle?: string;
  onDelete: (cardId: number) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export default function StaffCardDeleteButtonElement({ cardId, cardTitle, onDelete, loading = false, disabled = false }: StaffCardDeleteButtonElementProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(cardId);
      setShowConfirmModal(false);
    } catch (error) {
      ConsoleLogger.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={disabled || loading || isDeleting}
        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2"
      >
        {isDeleting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Deleting...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Card
          </>
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full mx-4 max-w-md">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this card?
              </p>
              {cardTitle && (
                <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Card:</strong> {cardTitle}
                </p>
              )}
              <p className="text-sm text-red-600 mt-3 font-medium">
                This action cannot be undone. The card will be permanently removed from both the database and search index.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}