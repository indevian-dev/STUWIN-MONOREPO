"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { useTranslations } from "next-intl";
import { PiPlus, PiX, PiBook } from "react-icons/pi";
import { toast } from "react-toastify";
import { GlobalLoaderTile } from "@/app/[locale]/(global)/(tiles)/GlobalLoader.tile";
import { GlobalImagePlaceholderTile } from "@/app/[locale]/(global)/(tiles)/GlobalImagePlaceholder.tile";
import { Card } from "@/app/primitives/Card.primitive";
import { Button } from "@/app/primitives/Button.primitive";

interface Subject {
  id: string;
  title: string;
  displayTitle?: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  aiLabel: string | null;
  aiGuide: string | null;
  gradeLevel: number | null;
  language: string | null;
  createdAt: string;
}

const S3_PREFIX = (process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/$/, "");

function getSubjectCoverUrl(workspaceId: string, subjectId: string) {
  return `${S3_PREFIX}/${workspaceId}/subjects/${subjectId}/covers/cover.webp`;
}

export function ProviderSubjectsListWidget() {
  const t = useTranslations("ProviderSubjectsList.widget");
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
      const data = await fetchApiUtil<Subject[]>({
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        method: "GET",
      });
      setSubjects(data);
    } catch (err: unknown) {
      setError(t("errorFetchingSubjects"));
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await fetchApiUtil<Subject>({
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        method: "POST",
        body: newSubject,
      });
      toast.success(t("subjectCreatedSuccessfully"));
      setIsModalOpen(false);
      setNewSubject({ title: "", slug: "", description: "", language: "az", gradeLevel: 1 });
      fetchSubjects();
    } catch (err: unknown) {
      toast.error(t("errorCreatingSubject"));
      console.error("Failed to create subject:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/${locale}/workspaces/provider/${workspaceId}/subjects/${subjectId}`);
  };

  const filteredSubjects = subjects.filter(subject => {
    const langMatch = filterLang === 'all' || (subject.language?.toUpperCase() === filterLang);
    const gradeMatch = filterGrade === 'all' || (subject.gradeLevel?.toString() === filterGrade);
    return langMatch && gradeMatch;
  });

  const uniqueLangs = Array.from(new Set(subjects.map(s => s.language?.toUpperCase()).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(subjects.map(s => s.gradeLevel?.toString()).filter(Boolean))).sort((a, b) => parseInt(a!) - parseInt(b!));

  if (loading) return <GlobalLoaderTile />;

  if (error) {
    return (
      <Card className="p-6 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30">
        <p className="font-semibold text-red-700 dark:text-red-400">{t("error")}</p>
        <p className="text-sm mt-1 text-red-600 dark:text-red-500">{error}</p>
        <button
          onClick={fetchSubjects}
          className="mt-3 px-4 py-2 rounded-app text-sm font-medium transition-colors
            bg-red-100 hover:bg-red-200 text-red-700
            dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300"
        >
          {t("retry")}
        </button>
      </Card>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Filter bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center
        bg-white/80 dark:bg-white/5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="langFilter" className="block text-xs font-black uppercase tracking-widest mb-1
              text-app-dark-blue/40 dark:text-white/40">
              {t("language")}
            </label>
            <select
              id="langFilter"
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="text-sm rounded-app px-3 py-1.5 outline-none transition-colors
                border border-black/10 dark:border-white/10
                bg-white dark:bg-white/5
                text-app-dark-blue dark:text-white
                focus:border-app-bright-green dark:focus:border-app-bright-green"
            >
              <option value="all">All Languages</option>
              {uniqueLangs.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="gradeFilter" className="block text-xs font-black uppercase tracking-widest mb-1
              text-app-dark-blue/40 dark:text-white/40">
              {t("grade")}
            </label>
            <select
              id="gradeFilter"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="text-sm rounded-app px-3 py-1.5 outline-none transition-colors
                border border-black/10 dark:border-white/10
                bg-white dark:bg-white/5
                text-app-dark-blue dark:text-white
                focus:border-app-bright-green dark:focus:border-app-bright-green"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
            </select>
          </div>

          <p className="text-xs text-app-dark-blue/40 dark:text-white/40 pb-1">
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <PiPlus className="w-4 h-4" />
          {t("createNewSubject")}
        </Button>
      </Card>

      {/* Grid */}
      {filteredSubjects.length === 0 ? (
        <Card className="p-10 flex flex-col items-center justify-center text-center gap-3
          bg-white/50 dark:bg-white/5 border-dashed border-2">
          <p className="text-lg font-semibold text-app-dark-blue dark:text-white">{t("noSubjects")}</p>
          <p className="text-sm text-app-dark-blue/50 dark:text-white/50">
            {subjects.length > 0 ? "No subjects match your filters" : t("noSubjectsDescription")}
          </p>
          {subjects.length > 0 && (
            <button
              onClick={() => { setFilterLang('all'); setFilterGrade('all'); }}
              className="mt-2 text-sm font-semibold text-app-bright-green hover:underline"
            >
              Clear Filters
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectClick(subject.id)}
              className="group cursor-pointer"
            >
              <Card className="h-full flex flex-col
                bg-white/80 dark:bg-white/5
                border-black/10 dark:border-white/10
                hover:border-app-bright-green/40 dark:hover:border-app-bright-green/40
                hover:shadow-xl hover:-translate-y-1
                transition-all duration-300 overflow-hidden p-0">
                {/* Cover image */}
                <div className="h-40 shrink-0 bg-black/5 dark:bg-white/5 overflow-hidden relative">
                  <GlobalImagePlaceholderTile
                    aspect=""
                    className="absolute inset-0 h-full w-full"
                  />
                  <img
                    src={getSubjectCoverUrl(workspaceId, subject.id)}
                    alt={subject.title}
                    onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-0 transition-opacity relative z-10"
                    style={{ opacity: 0, transition: 'opacity 0.3s' }}
                  />
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h3 className="text-base font-bold line-clamp-1
                      text-app-dark-blue dark:text-white
                      group-hover:text-app-bright-green transition-colors">
                      {subject.displayTitle || subject.title}
                    </h3>
                    {subject.aiLabel && (
                      <span className="shrink-0 px-2 py-0.5 text-xs font-semibold rounded-app
                        bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        {subject.aiLabel}
                      </span>
                    )}
                  </div>

                  {subject.description && (
                    <p className="text-sm line-clamp-2 mb-3 text-app-dark-blue/60 dark:text-white/60">
                      {subject.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    {subject.gradeLevel && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-app
                        bg-app-bright-green/10 dark:bg-app-bright-green/20
                        text-app-bright-green">
                        Grade {subject.gradeLevel}
                      </span>
                    )}
                    {subject.language && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-app uppercase
                        bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        {subject.language}
                      </span>
                    )}
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center justify-between mt-auto text-xs
                    text-app-dark-blue/40 dark:text-white/40">
                    <span>{subject.slug}</span>
                    <span>{new Date(subject.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Create Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200
            bg-white dark:bg-app-dark-blue/90 border-black/10 dark:border-white/10 shadow-2xl p-0 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
              <h3 className="text-xl font-bold text-app-dark-blue dark:text-white flex items-center gap-2">
                <PiBook className="text-app-bright-green w-6 h-6" />
                {t("createNewSubject")}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-app-full transition-colors
                  hover:bg-black/5 dark:hover:bg-white/10
                  text-app-dark-blue/50 dark:text-white/50"
              >
                <PiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              {/* Shared input classes */}
              {(() => {
                const inputCls = "w-full px-4 py-2 rounded-app outline-none transition-all border\
                  border-black/10 dark:border-white/10\
                  bg-white dark:bg-white/5\
                  text-app-dark-blue dark:text-white\
                  placeholder:text-app-dark-blue/30 dark:placeholder:text-white/30\
                  focus:border-app-bright-green dark:focus:border-app-bright-green";
                const labelCls = "block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70";

                return (
                  <>
                    <div>
                      <label className={labelCls}>{t("subjectTitle")}</label>
                      <input
                        type="text"
                        required
                        value={newSubject.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          setNewSubject({ ...newSubject, title, slug });
                        }}
                        className={inputCls}
                        placeholder={t("enterSubjectTitle")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>{t("language")}</label>
                        <select
                          value={newSubject.language}
                          onChange={(e) => setNewSubject({ ...newSubject, language: e.target.value })}
                          className={inputCls}
                        >
                          <option value="az">Azerbaijani (AZ)</option>
                          <option value="ru">Russian (RU)</option>
                          <option value="en">English (EN)</option>
                          <option value="tr">Turkish (TR)</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>{t("grade")}</label>
                        <select
                          value={newSubject.gradeLevel}
                          onChange={(e) => setNewSubject({ ...newSubject, gradeLevel: parseInt(e.target.value) })}
                          className={inputCls}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>{t("subjectSlug")}</label>
                      <input
                        type="text"
                        required
                        value={newSubject.slug}
                        onChange={(e) => setNewSubject({ ...newSubject, slug: e.target.value })}
                        className={inputCls}
                        placeholder={t("enterSubjectSlug")}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>{t("description")}</label>
                      <textarea
                        value={newSubject.description}
                        onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                        className={`${inputCls} min-h-[100px] resize-none`}
                        placeholder={t("enterSubjectDescription")}
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2 rounded-app font-medium transition-colors
                          border border-black/10 dark:border-white/10
                          text-app-dark-blue dark:text-white
                          hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={creating}
                        className="flex-1 px-4 py-2 rounded-app font-semibold transition-colors shadow-md
                          bg-app-bright-green hover:bg-app-bright-green/90
                          text-white dark:text-app-dark-blue
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creating ? t("creating") : t("createSubject")}
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
