"use client";

import { useState, useEffect } from "react";
import { ProviderTopicAddModalWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderTopicAddModalWidget";
import { ProviderTopicEditModalWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderTopicEditModalWidget";
import { ProviderTopicsFiltersWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderTopicsFiltersWidget";
import { ProviderBulkTopicUploadWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderBulkTopicUploadWidget";
import { ProviderManualGenerateQuestionsModal } from "@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderManualGenerateQuestionsModal";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { Topic, TopicFilters } from "@/types";
import { useRouter, useParams } from "next/navigation";

export function ProviderTopicsListWidget() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [topicsList, setTopicsList] = useState<Topic[]>([]);
  const [filteredTopicsList, setFilteredTopicsList] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentEditTopicId, setCurrentEditTopicId] = useState<string | null>(
    null,
  );
  const [isAddModalOpen, setIsAddTopicModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditTopicModalOpen] = useState<boolean>(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState<boolean>(false);
  const [selectedTopicForDeletion, setSelectedTopicForDeletion] = useState<
    string | null
  >(null);
  const [activeFilters, setActiveFilters] = useState<TopicFilters>({});
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] =
    useState<boolean>(false);
  const [isManualGenerateModalOpen, setIsManualGenerateModalOpen] =
    useState<boolean>(false);
  const [selectedTopicIdForGeneration, setSelectedTopicIdForGeneration] =
    useState<string | null>(null);

  const openAddTopicMainModal = (): void => {
    setIsAddTopicModalOpen(true);
  };

  const closeAddTopicModal = (): void => {
    setIsAddTopicModalOpen(false);
  };

  const openBulkUploadModal = (): void => {
    setIsBulkUploadModalOpen(true);
  };

  const closeBulkUploadModal = (): void => {
    setIsBulkUploadModalOpen(false);
  };

  const openEditTopicModal = (topicId: string): void => {
    setCurrentEditTopicId(topicId);
    setIsEditTopicModalOpen(true);
  };

  const closeEditTopicModal = (): void => {
    setIsEditTopicModalOpen(false);
    setCurrentEditTopicId(null);
  };

  const handleTopicSuccess = (): void => {
    fetchTopics();
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async (): Promise<void> => {
    setLoading(true);

    const response = await apiCallForSpaHelper({
      method: "GET",
      url: `/api/workspaces/provider/${workspaceId}/topics`,
      params: {},
    });

    if (response.status === 200 && response.data) {
      const apiResponse = response.data as { topics: Topic[] };
      if (apiResponse.topics) {
        setTopicsList(apiResponse.topics);
        applyFiltersToTopics(apiResponse.topics, activeFilters);
      }
    }
    setLoading(false);
  };

  const applyFiltersToTopics = (
    topics: Topic[],
    filters: TopicFilters,
  ): void => {
    let filtered = [...topics];

    // Filter by search query (topic name)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((topic) =>
        topic.name?.toLowerCase().includes(query),
      );
    }

    // Filter by subject
    if (filters.subjectId) {
      filtered = filtered.filter(
        (topic) => topic.subjectId === filters.subjectId,
      );
    }

    // Filter by grade level
    if (filters.gradeLevel) {
      filtered = filtered.filter(
        (topic) => topic.gradeLevel === filters.gradeLevel,
      );
    }

    setFilteredTopicsList(filtered);
  };

  const handleFiltersChange = (filters: TopicFilters): void => {
    setActiveFilters(filters);
    applyFiltersToTopics(topicsList, filters);
  };

  const openDeleteConfirmationModal = (topicId: string): void => {
    setSelectedTopicForDeletion(topicId);
    setShowDeleteConfirmationModal(true);
  };

  const closeDeleteConfirmationModal = (): void => {
    setShowDeleteConfirmationModal(false);
    setSelectedTopicForDeletion(null);
  };

  const openManualGenerateModal = (topicId: string): void => {
    setSelectedTopicIdForGeneration(topicId);
    setIsManualGenerateModalOpen(true);
  };

  const closeManualGenerateModal = (): void => {
    setIsManualGenerateModalOpen(false);
    setSelectedTopicIdForGeneration(null);
  };

  const deleteTopic = async (): Promise<void> => {
    if (!selectedTopicForDeletion) return;

    const response = await apiCallForSpaHelper({
      method: "DELETE",
      url: `/api/workspaces/provider/${workspaceId}/topics/delete/${selectedTopicForDeletion}`,
      params: {},
    });

    if (response.status === 200) {
      fetchTopics();
      closeDeleteConfirmationModal();
    }
  };

  const viewTopicDetail = (topicId: string): void => {
    router.push(`/workspaces/provider/${workspaceId}/topics/${topicId}`);
  };

  const truncateText = (
    text: string | undefined | null,
    maxLength: number,
  ): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const toggleActiveForAi = async (
    topicId: string,
    currentState: boolean | null,
  ): Promise<void> => {
    const newState = !currentState;

    const response = await apiCallForSpaHelper({
      method: "PUT",
      url: `/api/workspaces/provider/${workspaceId}/topics/update/${topicId}`,
      params: {},
      body: {
        is_active_for_ai: newState,
      },
    });

    if (response.status === 200) {
      fetchTopics();
    }
  };

  const renderTopics = (topics: Topic[]): React.ReactElement[] => {
    return topics.map((topic) => (
      <div
        key={topic.id}
        className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {topic.name}
              </h2>
              {topic.gradeLevel && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
                  Grade {topic.gradeLevel}
                </span>
              )}
              {topic.isActiveForAi && (
                <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded font-medium">
                  AI Active
                </span>
              )}
            </div>
            {topic.aiSummary && (
              <p className="text-sm text-gray-600 mb-2">
                {truncateText(topic.aiSummary, 150)}
              </p>
            )}
            <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
              <span>ID: {topic.id}</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                Published: {topic.topicPublishedQuestionsStats}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                General: {topic.topicGeneralQuestionsStats}
              </span>
              {topic.topicEstimatedQuestionsCapacity !== null && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Capacity: {topic.topicEstimatedQuestionsCapacity}
                </span>
              )}
              {topic.topicQuestionsRemainingToGenerate !== null && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                  Remaining: {topic.topicQuestionsRemainingToGenerate}
                </span>
              )}
              {topic.pdfS3Key && (
                <>
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded font-medium">
                    📄 PDF
                  </span>
                  {topic.pdfPageStart !== null && topic.pdfPageEnd !== null && (
                    <span className="px-2 py-1 bg-pink-50 text-pink-700 rounded">
                      Pages: {topic.pdfPageStart}-{topic.pdfPageEnd}
                    </span>
                  )}
                  {topic.totalPdfPages !== null && (
                    <span className="px-2 py-1 bg-pink-50 text-pink-700 rounded">
                      Total: {topic.totalPdfPages}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <div className="flex gap-2">
              <button
                onClick={() => viewTopicDetail(topic.id)}
                className="px-3 py-1.5 border border-blue-300 rounded bg-blue-50 hover:bg-blue-100 text-sm font-medium text-blue-700"
              >
                View
              </button>
              <button
                onClick={() => openEditTopicModal(topic.id)}
                className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={() => openManualGenerateModal(topic.id)}
                className="px-3 py-1.5 border border-emerald-300 rounded bg-emerald-50 hover:bg-emerald-100 text-sm font-medium text-emerald-700"
                title="Generate questions for this topic"
              >
                Generate
              </button>
              <button
                onClick={() => {
                  setSelectedTopicForDeletion(topic.id);
                  setShowDeleteConfirmationModal(true);
                }}
                className="px-3 py-1.5 border rounded bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
              >
                Delete
              </button>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-gray-600">AI Active:</span>
              <button
                onClick={() =>
                  toggleActiveForAi(topic.id, topic.isActiveForAi ?? null)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${topic.isActiveForAi ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                role="switch"
                aria-checked={topic.isActiveForAi ?? false}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${topic.isActiveForAi ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  // Determine which list to display
  const displayTopics =
    Object.keys(activeFilters).length > 0 ? filteredTopicsList : topicsList;

  return (
    <div className="container mx-auto p-4">
      {/* Filters Widget */}
      <ProviderTopicsFiltersWidget
        onFiltersChange={handleFiltersChange}
        currentFilters={activeFilters}
      />

      {/* Stats and Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <p className="text-sm text-gray-600">
            Total Topics:{" "}
            <span className="font-semibold">{topicsList.length}</span>
          </p>
          {Object.keys(activeFilters).length > 0 && (
            <p className="text-sm text-blue-600">
              Filtered:{" "}
              <span className="font-semibold">{filteredTopicsList.length}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openBulkUploadModal()}
            className="px-4 py-2 border border-purple-300 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium shadow-sm flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Books Bulk Topic Upload
          </button>
          <button
            onClick={() => openAddTopicMainModal()}
            className="px-4 py-2 border rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm"
          >
            Add New Topic
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading topics...</p>
        </div>
      ) : displayTopics.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">
            {Object.keys(activeFilters).length > 0
              ? "No topics match your filters"
              : "No topics found"}
          </p>
          {Object.keys(activeFilters).length === 0 && (
            <button
              onClick={() => openAddTopicMainModal()}
              className="px-4 py-2 border rounded bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              Create Your First Topic
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {renderTopics(displayTopics)}
        </div>
      )}

      <ProviderTopicAddModalWidget
        isOpen={isAddModalOpen}
        onClose={closeAddTopicModal}
        onSuccess={handleTopicSuccess}
      />

      <ProviderTopicEditModalWidget
        topicId={currentEditTopicId ?? ""}
        isOpen={isEditModalOpen}
        onClose={closeEditTopicModal}
        onSuccess={handleTopicSuccess}
      />

      {showDeleteConfirmationModal && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h2 className="text-xl font-semibold mb-3">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this topic? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirmationModal}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteTopic}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ProviderBulkTopicUploadWidget
        isOpen={isBulkUploadModalOpen}
        onClose={closeBulkUploadModal}
        onSuccess={handleTopicSuccess}
      />

      {selectedTopicIdForGeneration && (
        <ProviderManualGenerateQuestionsModal
          isOpen={isManualGenerateModalOpen}
          onClose={closeManualGenerateModal}
          topicId={selectedTopicIdForGeneration}
          onSuccess={handleTopicSuccess}
        />
      )}
    </div>
  );
}
