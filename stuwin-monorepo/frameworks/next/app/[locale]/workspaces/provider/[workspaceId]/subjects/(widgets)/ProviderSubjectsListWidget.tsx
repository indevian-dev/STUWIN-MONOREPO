"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { useTranslations } from "next-intl";
import { PiPlus, PiX, PiBook } from "react-icons/pi";
import { toast } from "react-toastify";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";

interface Subject {
  id: number;
  title: string;
  description: string | null;
  cover: string | null;
  slug: string;
  isActive: boolean;
  aiLabel: string | null;
  createdAt: string;
}

interface SubjectsResponse {
  success: boolean;
  data: Subject[];
  error?: string;
}

export function ProviderSubjectsListWidget() {
  const t = useTranslations("ProviderSubjectsListWidget");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const workspaceId = params.workspaceId as string;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState({
    title: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        method: "GET",
      });

      if (response.status === 200 && response.data?.success && response.data?.data) {
        setSubjects(response.data.data);
      } else {
        setError(response.data?.error || t("errorFetchingSubjects"));
      }
    } catch (err) {
      setError(t("errorFetchingSubjects"));
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const response = await apiCallForSpaHelper({
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        method: "POST",
        body: newSubject,
      });

      if (response.status === 200 && response.data?.success) {
        toast.success(t("subjectCreatedSuccessfully"));
        setIsModalOpen(false);
        setNewSubject({ title: "", slug: "", description: "" });
        fetchSubjects();
      } else {
        toast.error(response.data?.error || t("errorCreatingSubject"));
      }
    } catch (err) {
      toast.error(t("errorCreatingSubject"));
      console.error("Failed to create subject:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleSubjectClick = (subjectId: number) => {
    router.push(`/${locale}/workspaces/provider/${workspaceId}/subjects/${subjectId}`);
  };

  if (loading) {
    return <GlobalLoaderTile />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">{t("error")}</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchSubjects}
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t("allSubjects")}</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-md hover:bg-brand/90 transition-colors shadow-sm"
        >
          <PiPlus className="w-5 h-5" />
          {t("createNewSubject")}
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          <p className="text-lg font-medium">{t("noSubjects")}</p>
          <p className="text-sm mt-2">{t("noSubjectsDescription")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectClick(subject.id)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              {subject.cover && (
                <div className="mb-4 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={subject.cover}
                    alt={subject.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {subject.title}
                </h3>
                {subject.aiLabel && (
                  <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {subject.aiLabel}
                  </span>
                )}
              </div>
              {subject.description && (
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {subject.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{subject.slug}</span>
                <span>{new Date(subject.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <PiBook className="text-brand w-6 h-6" />
                {t("createNewSubject")}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <PiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("subjectTitle")}
                </label>
                <input
                  type="text"
                  required
                  value={newSubject.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setNewSubject({ ...newSubject, title, slug });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none"
                  placeholder={t("enterSubjectTitle")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("subjectSlug")}
                </label>
                <input
                  type="text"
                  required
                  value={newSubject.slug}
                  onChange={(e) => setNewSubject({ ...newSubject, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none bg-gray-50"
                  placeholder={t("enterSubjectSlug")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("description")}
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none min-h-[100px]"
                  placeholder={t("enterSubjectDescription")}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {creating ? t("creating") : t("createSubject")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
