"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchApiUtil } from "@/lib/utils/Http.FetchApiSPA.util";
import { PiMagnifyingGlass, PiCheckCircleFill, PiUserCircle, PiArrowLeft, PiArrowRight } from "react-icons/pi";
import { toast } from "react-toastify";

export default function ParentOnboardingPage() {
    const router = useRouter();
    const t = useTranslations('ParentOnboardingPage');
    const [fin, setFin] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!fin || fin.length < 5) {
            toast.warn(t('valid_fin_warn'));
            return;
        }

        try {
            setIsSearching(true);
            const response = await fetchApiUtil<any>({
                url: `/api/workspaces/onboarding/search-child?fin=${fin}`,
                method: "GET",
            } as any);

            const result = (response as any).data;
            if (result.success) {
                setResults(result.data);
            } else {
                toast.error(result.error || t('no_students_found'));
            }
        } catch (error) {
            toast.error(t('search_failed'));
        } finally {
            setIsSearching(false);
        }
    };

    const handleToggleSelection = (id: string) => {
        setSelectedWorkspaces(prev =>
            prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id]
        );
    };

    const handleComplete = async () => {
        if (selectedWorkspaces.length === 0) {
            toast.warn(t('select_workspace_warn'));
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetchApiUtil<any>({
                url: "/api/workspaces/onboarding",
                method: "POST",
                body: {
                    type: "parent",
                    data: { studentWorkspaceIds: selectedWorkspaces }
                }
            } as any);

            const result = (response as any).data;
            if (result.success) {
                toast.success(t('success_message'));
                router.push("/workspaces");
            } else {
                toast.error(result.error || t('onboarding_failed'));
            }
        } catch (error) {
            toast.error(t('failed_complete_onboarding'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center justify-center bg-section-gradient-app">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl space-y-12">
                <button
                    onClick={() => router.push("/workspaces/onboarding/welcome")}
                    className="flex items-center gap-2 text-neutral-400 hover:text-app-dark-blue dark:text-white transition font-black uppercase tracking-widest text-xs"
                >
                    <PiArrowLeft /> {t('back')}
                </button>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-app-dark-blue dark:text-white tracking-tight leading-none">
                        {t('find_your_child')} <span className="text-app-bright-green">{t('child')}</span>
                    </h1>
                    <p className="text-app-dark-blue/70 dark:text-white/70 font-medium">
                        {t('parent_message')}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={fin}
                            onChange={(e) => setFin(e.target.value.toUpperCase())}
                            placeholder={t('fin_placeholder')}
                            className="w-full h-20 px-8 bg-neutral-50 rounded-app border-2 border-black/10 dark:border-white/10 focus:border-app outline-none text-xl font-black tracking-widest placeholder:text-neutral-300 transition-all"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="absolute right-4 top-4 bottom-4 px-6 bg-app-bright-green-dark text-white rounded-app font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <PiMagnifyingGlass size={24} />
                            {isSearching ? t('searching') : t('search')}
                        </button>
                    </div>

                    {results.length > 0 && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">{t('available_workspaces')}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {results.map((res) => (
                                    <button
                                        key={res.workspaceId}
                                        onClick={() => handleToggleSelection(res.workspaceId)}
                                        className={`flex items-center justify-between p-6 rounded-app border-2 transition-all ${selectedWorkspaces.includes(res.workspaceId)
                                            ? "border-app bg-app-bright-green/5"
                                            : "border-black/10 dark:border-white/10 bg-white hover:border-neutral-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 bg-neutral-100 rounded-app flex items-center justify-center text-2xl">
                                                <PiUserCircle />
                                            </div>
                                            <div>
                                                <p className="font-black text-app-dark-blue dark:text-white leading-none mb-1">{res.workspaceTitle}</p>
                                                <p className="text-xs font-bold text-neutral-400">{res.studentName}</p>
                                            </div>
                                        </div>
                                        {selectedWorkspaces.includes(res.workspaceId) && (
                                            <PiCheckCircleFill className="text-app-bright-green text-2xl" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="w-full h-20 bg-app-bright-green text-app-dark-blue dark:text-white font-black rounded-app flex items-center justify-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-app/20"
                            >
                                {isSubmitting ? t('finishing') : t('continue_to_dashboard')}
                                <PiArrowRight />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
