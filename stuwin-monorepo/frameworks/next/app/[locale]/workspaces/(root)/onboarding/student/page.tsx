"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { PiStudent, PiArrowLeft, PiArrowRight, PiCheckCircle, PiMagnifyingGlass, PiBuildings } from "react-icons/pi";
import { toast } from "react-toastify";

export default function StudentOnboardingPage() {
    const router = useRouter();
    const t = useTranslations('StudentOnboardingPage');
    const [step, setStep] = useState(1);
    // Steps: 1 = Provider Selection, 2 = Profile Details (Name/Grade), 3 = Success

    const [providers, setProviders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingProviders, setIsLoadingProviders] = useState(true);

    const [formData, setFormData] = useState({
        displayName: "",
        gradeLevel: "9",
        providerId: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            // Fetch providers
            // Using a large limit to get most relevant ones for client-side search for now
            const response = await apiCallForSpaHelper({
                url: "/api/providers?pageSize=100",
                method: "GET",
            });

            const data = response.data as any;

            // API returns { providers: [] } when params are present
            if (data.providers) {
                setProviders(data.providers);
            } else if (Array.isArray(data)) {
                setProviders(data);
            }
        } catch (error) {
            toast.error(t('failed_load_schools'));
        } finally {
            setIsLoadingProviders(false);
        }
    };

    const handleProviderSelect = (providerId: string) => {
        router.push(`/workspaces/enroll/${providerId}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.displayName) {
            toast.warn(t('enter_display_name_warn'));
            return;
        }
        if (!formData.providerId) {
            toast.warn(t('select_school_warn'));
            setStep(1);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiCallForSpaHelper({
                url: "/api/workspaces/onboarding",
                method: "POST",
                body: {
                    type: "student",
                    data: {
                        displayName: formData.displayName,
                        metadata: { gradeLevel: formData.gradeLevel },
                        providerId: formData.providerId,
                    }
                }
            } as any);

            const result = (response as any).data;
            if (result.success) {
                setStep(3);
            } else {
                toast.error(result.error || t('creation_failed'));
            }
        } catch (error) {
            toast.error(t('failed_create_workspace'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProviders = providers.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (step === 3) {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center ">
                <div className="max-w-2xl w-full bg-white rounded-[3rem] p-16 text-center shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
                        <PiCheckCircle />
                    </div>
                    <h1 className="text-4xl font-black text-dark mb-4 tracking-tight">{t('ready_title')}</h1>
                    <p className="text-body font-medium text-lg leading-relaxed mb-10 opacity-70">
                        {t('ready_message')}
                    </p>
                    <button
                        onClick={() => router.push("/workspaces")}
                        className="px-12 py-5 bg-dark text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-lg shadow-xl shadow-dark/20"
                    >
                        {t('go_to_dashboard')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 flex flex-col items-center justify-center ">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl space-y-12">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => step === 1 ? router.push("/workspaces/onboarding/welcome") : setStep(1)}
                        className="flex items-center gap-2 text-neutral-400 hover:text-dark transition font-black uppercase tracking-widest text-xs"
                    >
                        <PiArrowLeft /> {t('back')}
                    </button>
                    <div className="text-xs font-black uppercase tracking-widest text-brand">
                        {t('step_of', { current: step, total: 2 })}
                    </div>
                </div>

                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-dark tracking-tight leading-none">
                                {t('select_school')} <span className="text-teal-500">{t('school')}</span>
                            </h1>
                            <p className="text-body font-medium">
                                {t('find_school_message')}
                            </p>
                        </div>

                        <div className="relative">
                            <PiMagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-neutral-400" />
                            <input
                                type="text"
                                placeholder={t('search_schools')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-16 pl-16 pr-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-teal-500 outline-none font-bold"
                            />
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {isLoadingProviders ? (
                                <div className="text-center py-10 text-neutral-400 font-bold">{t('loading_schools')}</div>
                            ) : filteredProviders.length > 0 ? (
                                filteredProviders.map(provider => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleProviderSelect(provider.id)}
                                        className="w-full p-6 bg-white border-2 border-border hover:border-teal-500 rounded-2xl flex items-center gap-4 transition-all text-left group hover:shadow-lg"
                                    >
                                        <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-xl text-neutral-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                            <PiBuildings />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-dark group-hover:text-teal-600 truncate">{provider.title}</h3>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                                    {provider.city?.title || "Online"}
                                                </p>
                                                {provider.providerSubscriptionPrice !== undefined && (
                                                    <p className="text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg">
                                                        {provider.providerSubscriptionPrice === 0 ? t('free') : `${provider.providerSubscriptionPrice} AZN`}
                                                    </p>
                                                )}
                                                {provider.providerTrialDaysCount > 0 && (
                                                    <p className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                                                        {provider.providerTrialDaysCount} {t('trial_days')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <PiArrowRight className="ml-auto text-neutral-300 group-hover:text-teal-500" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10 text-neutral-400 font-bold">
                                    {t('no_schools_found')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-dark tracking-tight leading-none">
                                {t('student_profile')} <span className="text-teal-500">{t('profile')}</span>
                            </h1>
                            <p className="text-body font-medium">
                                {t('profile_message')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('display_name')}</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-teal-500 outline-none font-bold"
                                placeholder={t('display_name_placeholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('grade_level')}</label>
                            <select
                                name="gradeLevel"
                                value={formData.gradeLevel}
                                onChange={handleInputChange}
                                className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-teal-500 outline-none font-bold appearance-none"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                    <option key={g} value={g}>{t('grade_n', { n: g })}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full h-20 bg-teal-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20"
                        >
                            {isSubmitting ? t('creating') : t('create_workspace')}
                            <PiArrowRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
