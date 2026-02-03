"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { StudentPageTitleWidget } from "../../(widgets)/StudentPageTitleWidget";
import { PiArrowLeft, PiPencil, PiTrash, PiDownload, PiRobot } from "react-icons/pi";
import { StudentHomeworkAiSidebarWidget } from "./StudentHomeworkAiSidebarWidget";

interface HomeworkDetail {
  id: string;
  title: string;
  description?: string;
  textContent?: string;
  dueDate?: string;
  status: "pending" | "submitted" | "graded";
  grade?: number;
  feedback?: string;
  submittedAt?: string;
  images?: Array<{
    id: string;
    url: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function StudentHomeworkDetailWidget() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;
  const workspaceId = params.workspaceId as string;

  const [homework, setHomework] = useState<HomeworkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    if (homeworkId) {
      fetchHomeworkDetail();
    }
  }, [homeworkId]);

  const fetchHomeworkDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/student/${workspaceId}/homeworks/${homeworkId}`,
        method: "GET",
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch homework");
      }

      setHomework(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch homework";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this homework?")) {
      return;
    }

    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/student/${workspaceId}/homeworks/${homeworkId}/delete`,
        method: "DELETE",
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || "Failed to delete homework");
      }

      toast.success("Homework deleted successfully");
      router.push(`/workspaces/student/${workspaceId}/homeworks`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete homework";
      toast.error(errorMessage);
    }
  };

  const handleEdit = () => {
    router.push(`/workspaces/student/${workspaceId}/homeworks/${homeworkId}/edit`);
  };

  if (loading || isLoading) return <GlobalLoaderTile />;

  if (error || !homework) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <PiArrowLeft size={20} />
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || "Homework not found"}
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "submitted":
        return "bg-blue-50 text-blue-700";
      case "graded":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] overflow-hidden gap-0">
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isAiOpen ? 'pr-0' : 'pr-0'}`}>
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2 text-gray-600"
              title="Go back"
            >
              <PiArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>

            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isAiOpen
                ? 'bg-brand text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand hover:text-brand'
                }`}
            >
              <PiRobot size={20} />
              {isAiOpen ? 'Hide Assistant' : 'AI Help'}
            </button>
          </div>

          <StudentPageTitleWidget pageTitle={homework.title} />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-start pb-6 border-b border-gray-100">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                  {homework.title}
                </h1>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(homework.status)}`}
                    >
                      {homework.status}
                    </span>
                  </div>
                  {homework.grade !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grade</span>
                      <span className="text-sm font-bold text-gray-900 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        {homework.grade}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {homework.status !== "graded" && (
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-xl transition"
                    title="Edit"
                  >
                    <PiPencil size={22} />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                  title="Delete"
                >
                  <PiTrash size={22} />
                </button>
              </div>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                {homework.description && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Description
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {homework.description}
                    </p>
                  </div>
                )}

                {/* Text Content */}
                {homework.textContent && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Homework Material
                    </h2>
                    <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-2xl">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {homework.textContent}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Dates & Timeline */}
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Timeline</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Assigned</span>
                      <span className="font-semibold text-gray-900">{formatDate(homework.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Deadline</span>
                      <span className="font-semibold text-red-500">{formatDate(homework.dueDate)}</span>
                    </div>
                    {homework.submittedAt && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Submitted</span>
                        <span className="font-semibold text-green-600">{formatDate(homework.submittedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback */}
                {homework.feedback && homework.status === "graded" && (
                  <div className="bg-brand/5 border border-brand/10 p-6 rounded-2xl space-y-3">
                    <h2 className="text-xs font-bold text-brand uppercase tracking-widest">Teacher's Feedback</h2>
                    <p className="text-brand-dark leading-relaxed text-sm font-medium">
                      {homework.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Images Grid */}
            {homework.images && homework.images.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Attachments ({homework.images.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {homework.images.map((image) => (
                    <div key={image.id} className="relative group overflow-hidden rounded-2xl border border-gray-100 shadow-sm aspect-video">
                      <img
                        src={image.url}
                        alt={`Homework resource ${image.id}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <a
                          href={image.url}
                          download
                          className="p-3 bg-white rounded-full shadow-xl hover:bg-gray-50 transition"
                        >
                          <PiDownload size={22} className="text-brand" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-gray-100">
              <button
                onClick={() => router.push(`/workspaces/student/${workspaceId}/homeworks`)}
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-bold text-sm"
              >
                Return to List
              </button>
              {homework.status === "pending" && (
                <button
                  onClick={() => router.push(`/workspaces/student/${workspaceId}/homeworks/${homeworkId}/submit`)}
                  className="px-8 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 hover:shadow-lg transition-all font-bold text-sm"
                >
                  Turn in Homework
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Sidebar */}
      <StudentHomeworkAiSidebarWidget
        homeworkId={homeworkId}
        isOpen={isAiOpen}
      />
    </div>
  );
}
