"use client";

import { useState, FormEvent, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { apiCallForSpaHelper } from "@/lib/utils/http/SpaApiClient";
import { PiX } from "react-icons/pi";

interface StudentAddHomeworkModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StudentAddHomeworkModalWidget({
  isOpen,
  onClose,
  onSuccess,
}: StudentAddHomeworkModalWidgetProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [quizId, setQuizId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubject("");
    setDueDate("");
    setTopicId("");
    setQuizId("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiCallForSpaHelper({
        method: "POST",
        url: `/api/workspaces/student/${workspaceId}/homeworks`,
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          subject: subject.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          topicId: topicId || undefined,
          quizId: quizId || undefined,
        },
      });

      if (response.data && response.data.success) {
        toast.success("Homework created successfully");
        resetForm();
        onSuccess?.();
        onClose();
      } else {
        const errorMsg = response.data?.error || "Failed to create homework";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create homework";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-primary shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add New Homework
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            type="button"
          >
            <PiX size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-dark mb-1"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter homework title"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter homework description (optional)"
              />
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter subject (optional)"
              />
            </div>

            {/* Due Date */}
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Topic ID */}
            <div>
              <label
                htmlFor="topicId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Topic ID
              </label>
              <input
                type="number"
                id="topicId"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter topic ID (optional)"
                min="1"
              />
            </div>

            {/* Quiz ID */}
            <div>
              <label
                htmlFor="quizId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quiz ID
              </label>
              <input
                type="number"
                id="quizId"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter quiz ID (optional)"
                min="1"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-primary text-gray-700 font-medium disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand hover:bg-brand/80 text-white rounded-primary font-medium disabled:opacity-50 transition"
            >
              {loading ? "Creating..." : "Create Homework"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
