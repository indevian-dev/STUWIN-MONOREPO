"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiCall } from "@/lib/utils/http/SpaApiClient";
import { useTranslations } from "next-intl";
import { PiPlus, PiX, PiBook } from "react-icons/pi";
import { toast } from "react-toastify";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoaderTile";

interface Subject {
  id: string;
  title: string;
  displayTitle?: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  aiLabel: string | null;
  aiGuide: string | null;
  createdAt: string;
}

const S3_PREFIX = (process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/$/, "");

/** Deterministic cover URL: {S3_PREFIX}/{workspaceId}/subjects/{subjectId}/covers/cover.webp */
function getSubjectCoverUrl(workspaceId: string, subjectId: string) {
  return `${S3_PREFIX}/${workspaceId}/subjects/${subjectId}/covers/cover.webp`;
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
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState({
    title: "",
    slug: "",
    description: "",
    language: "az",
    gradeLevel: 1
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        method: "GET",
      });
      setSubjects(data);
    } catch (err) {
      setError(t("errorFetchingSubjects"));
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const data = await apiCall<any>({
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        method: "POST",
        body: newSubject,
      });
      toast.success(t("subjectCreatedSuccessfully"));
      setIsModalOpen(false);
      setNewSubject({ title: "", slug: "", description: "", language: "az", gradeLevel: 1 });
      fetchSubjects();
    } catch (err) {
      toast.error(t("errorCreatingSubject"));
      console.error("Failed to create subject:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/${locale}/workspaces/provider/${workspaceId}/subjects/${subjectId}`);
  };

  const parseSubjectInfo = (title: string) => {
    const regex = / \.([A-Z]+)\.(\d+)$/;
    const match = title.match(regex);
    if (match) {
      return { lang: match[1], grade: match[2] };
    }
    return null;
  };

  const filteredSubjects = subjects.filter(subject => {
    const info = parseSubjectInfo(subject.title);
    const langMatch = filterLang === 'all' || (info && info.lang === filterLang);
    const gradeMatch = filterGrade === 'all' || (info && info.grade === filterGrade);
    return langMatch && gradeMatch;
  });

  const uniqueLangs = Array.from(new Set(subjects.map(s => parseSubjectInfo(s.title)?.lang).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(subjects.map(s => parseSubjectInfo(s.title)?.grade).filter(Boolean))).sort((a, b) => parseInt(a!) - parseInt(b!));

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
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="langFilter" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Language</label>
            <select
              id="langFilter"
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-brand focus:border-brand bg-white px-2 py-1 border outline-none"
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
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-brand focus:border-brand bg-white px-2 py-1 border outline-none"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
            </select>
          </div>

          <div className="mt-4 md:mt-0 pt-4 md:pt-0">
            <p className="text-xs text-gray-500">
              Showing {filteredSubjects.length} of {subjects.length} subjects
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-md hover:bg-brand/90 transition-colors shadow-sm"
        >
          <PiPlus className="w-5 h-5" />
          {t("createNewSubject")}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          <p className="text-lg font-medium">{t("noSubjects")}</p>
          <p className="text-sm mt-2">{subjects.length > 0 ? "No subjects match your filters" : t("noSubjectsDescription")}</p>
          {subjects.length > 0 && (
            <button
              onClick={() => {
                setFilterLang('all');
                setFilterGrade('all');
              }}
              className="mt-4 px-4 py-2 text-brand font-medium hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectClick(subject.id)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] flex flex-col"
            >
              <div className="mb-4 rounded-md overflow-hidden bg-gray-100 h-40 shrink-0">
                <img
                  src={getSubjectCoverUrl(workspaceId, subject.id)}
                  alt={subject.title}
                  onError={(e) => {
                    e.currentTarget.src = "/pg.webp";
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                  {subject.displayTitle || subject.title}
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
                <div className="flex items-center gap-2">
                  <span>{new Date(subject.createdAt).toLocaleDateString()}</span>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("language")}
                  </label>
                  <select
                    value={newSubject.language}
                    onChange={(e) => setNewSubject({ ...newSubject, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none bg-white"
                  >
                    <option value="az">Azerbaijani (AZ)</option>
                    <option value="ru">Russian (RU)</option>
                    <option value="en">English (EN)</option>
                    <option value="tr">Turkish (TR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("grade")}
                  </label>
                  <select
                    value={newSubject.gradeLevel}
                    onChange={(e) => setNewSubject({ ...newSubject, gradeLevel: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
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
