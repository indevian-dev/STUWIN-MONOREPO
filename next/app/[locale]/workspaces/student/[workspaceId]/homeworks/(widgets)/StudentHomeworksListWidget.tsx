"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { apiCallForSpaHelper } from "@/lib/utils/http/SpaApiClient";
import { StudentPageTitleWidget } from "../../(widgets)/StudentPageTitleWidget";
import { StudentAddHomeworkModalWidget } from "./StudentAddHomeworkModalWidget";
import { PiPlus, PiTrash, PiPencil } from "react-icons/pi";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";

interface Homework {
  id: string;
  title: string;
  description?: string;
  textContent?: string;
  dueDate?: string;
  status: "pending" | "submitted" | "graded";
  grade?: number;
  submittedAt?: string;
  images?: Array<{ id: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

export function StudentHomeworksListWidget() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/student/${workspaceId}/homeworks`, // Matches standardized route
        method: "GET",
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch homeworks");
      }

      setHomeworks(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch homeworks";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (homeworkId: string) => {
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

      setHomeworks(homeworks.filter((h) => h.id !== homeworkId));
      toast.success("Homework deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete homework";
      toast.error(errorMessage);
    }
  };

  const handleUpload = () => {
    setIsModalOpen(true);
  };

  const handleViewHomework = (homeworkId: string) => {
    router.push(`/workspaces/student/${workspaceId}/homeworks/${homeworkId}`);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <GlobalLoaderTile />;

  return (
    <div className="space-y-6">
      <StudentPageTitleWidget pageTitle="homework" />

      <StudentAddHomeworkModalWidget
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchHomeworks}
      />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">My Homeworks</h2>
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-primary hover:bg-brand/80 transition font-medium"
          >
            <PiPlus size={20} />
            Add Homework
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {homeworks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No homeworks yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Due Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Grade
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {homeworks.map((homework) => (
                  <tr
                    key={homework.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => handleViewHomework(homework.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-medium">
                        {homework.title}
                      </div>
                      {homework.textContent && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {homework.textContent}
                        </div>
                      )}
                      {homework.images && homework.images.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {homework.images.length} image(s)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(homework.dueDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(homework.status)}`}
                      >
                        {homework.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {homework.grade !== undefined
                        ? `${homework.grade}/100`
                        : "-"}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/workspaces/student/${workspaceId}/homeworks/${homework.id}`)
                        }
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="View"
                      >
                        <PiPencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(homework.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <PiTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
