"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { StudentPageTitleWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget";
import { PiPlus, PiTrash, PiArrowRight } from "react-icons/pi";

interface LearningSession {
  id: string;
  title?: string;
  topic: string;
  description?: string;
  textContent?: string;
  messages?: number;
  status: "active" | "archived" | "completed";
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export function StudentLearningSessionsListWidget() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/student/${workspaceId}/learning-conversations`,
        method: "GET",
      });

      if (response.data && !response.data.success) {
        throw new Error(response.data.error || "Failed to fetch sessions");
      }

      setSessions(response.data?.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch sessions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this learning session?")
    ) {
      return;
    }

    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/student/${workspaceId}/learning-conversations/${sessionId}/archive`,
        method: "PATCH",
      });

      if (response.data && !response.data.success) {
        throw new Error(response.data.error || "Failed to delete session");
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success("Learning session deleted");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete session";
      toast.error(errorMessage);
    }
  };

  const handleCreateSession = async () => {
    try {
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/student/${workspaceId}/learning-conversations`,
        method: "POST",
        body: {
          topic: "New Learning Session",
        },
      });

      if (response.data && !response.data.success) {
        throw new Error(response.data.error || "Failed to create session");
      }

      toast.success("Learning session created");
      await fetchSessions();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create session";
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700";
      case "completed":
        return "bg-blue-50 text-blue-700";
      case "archived":
        return "bg-gray-50 text-gray-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentPageTitleWidget pageTitle="learning_sessions" />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Learning Sessions
          </h2>
          <button
            onClick={handleCreateSession}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            <PiPlus size={20} />
            Start New Session
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No learning sessions yet</p>
            <button
              onClick={handleCreateSession}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              <PiPlus size={20} />
              Create First Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() =>
                  router.push(`/student/learning/sessions/${session.id}`)
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {session.title || session.topic || "Untitled Session"}
                      </h3>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(session.status)}`}
                      >
                        {session.status}
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    {session.textContent && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2 bg-blue-50 p-2 rounded">
                        {session.textContent}
                      </p>
                    )}

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Created: {formatDate(session.createdAt)}</span>
                      {session.lastMessageAt && (
                        <span>Last: {formatDate(session.lastMessageAt)}</span>
                      )}
                      {session.messages !== undefined && (
                        <span>{session.messages} messages</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/learning/sessions/${session.id}`);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="View"
                    >
                      <PiArrowRight size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <PiTrash size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
