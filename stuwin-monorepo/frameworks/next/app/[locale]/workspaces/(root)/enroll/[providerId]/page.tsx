"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { PiArrowLeft, PiCheckCircleBold, PiBuildingsBold, PiCreditCardBold, PiLightningBold, PiStudentBold } from "react-icons/pi";
import { toast } from "react-toastify";

export default function EnrollmentPage() {
    const router = useRouter();
    const params = useParams();
    const providerId = params.providerId as string;
    const t = useTranslations('EnrollmentPage');

    const [provider, setProvider] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        displayName: "",
        gradeLevel: "9",
    });

    useEffect(() => {
        if (providerId) {
            fetchProvider();
        }
    }, [providerId]);

    const fetchProvider = async () => {
        try {
            const response = await apiCallForSpaHelper({
                url: `/api/providers/${providerId}`,
                method: "GET",
            });
            const data = response.data as any;
            if (data.provider) {
                setProvider(data.provider);
            } else {
                toast.error(t('provider_not_found'));
            }
        } catch (error) {
            toast.error(t('failed_to_load_provider'));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEnroll = async (useTrial: boolean = true) => {
        if (!formData.displayName) {
            toast.warn(t('enter_display_name_warn'));
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
                        providerId: provider.id,
                    }
                }
            } as any);

            const result = (response as any).data;
            if (result.success) {
                toast.success(t('enrollment_success'));
                router.push("/workspaces");
            } else {
                toast.error(result.error || t('enrollment_failed'));
            }
        } catch (error) {
            toast.error(t('enrollment_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
                <h1 className="text-2xl font-black text-dark mb-4">{t('provider_not_found')}</h1>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-dark text-white rounded-xl font-bold"
                >
                    {t('go_back')}
                </button>
            </div>
        );
    }

    const price = provider.providerSubscriptionPrice || 0;
    const trialDays = provider.providerTrialDaysCount || 0;

    return (
        <div className="min-h-screen bg-neutral-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Enrollment Info */}
                <div className="space-y-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-neutral-400 hover:text-dark transition font-black uppercase tracking-widest text-xs"
                    >
                        <PiArrowLeft /> {t('back')}
                    </button>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-black uppercase tracking-widest">
                            <PiBuildingsBold /> {t('school_enrollment')}
                        </div>
                        <h1 className="text-5xl font-black text-dark tracking-tight leading-tight">
                            {t('enroll_in')} <br /> <span className="text-teal-500">{provider.title}</span>
                        </h1>
                        <p className="text-body text-lg font-medium opacity-70">
                            {provider.providerProgramDescription || t('default_description')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 space-y-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                                <PiCheckCircleBold />
                            </div>
                            <h3 className="font-black text-dark">{t('what_you_get')}</h3>
                            <ul className="text-sm font-medium text-neutral-500 space-y-2">
                                <li className="flex items-center gap-2 italic">✓ {t('feature_ai_subjects')}</li>
                                <li className="flex items-center gap-2 italic">✓ {t('feature_quizzes')}</li>
                                <li className="flex items-center gap-2 italic">✓ {t('feature_progress')}</li>
                            </ul>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 space-y-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl">
                                <PiLightningBold />
                            </div>
                            <h3 className="font-black text-dark">{t('pricing_plan')}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-dark">{price} AZN</span>
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">/ {t('month')}</span>
                            </div>
                            {trialDays > 0 && (
                                <p className="text-xs font-black text-orange-600 uppercase tracking-tighter">
                                    {t('includes_trial', { days: trialDays })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Profile & Action Card */}
                <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-dark/5 border border-slate-100 space-y-10 h-fit lg:sticky lg:top-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl">
                                <PiStudentBold />
                            </div>
                            <h2 className="text-2xl font-black text-dark tracking-tight">{t('student_profile')}</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">
                                    {t('display_name')}
                                </label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                    placeholder={t('student_name_placeholder')}
                                    className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-teal-500 outline-none font-bold placeholder:text-neutral-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">
                                    {t('grade_level')}
                                </label>
                                <div className="relative">
                                    <select
                                        name="gradeLevel"
                                        value={formData.gradeLevel}
                                        onChange={handleInputChange}
                                        className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-teal-500 outline-none font-bold appearance-none cursor-pointer pr-12"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>{t('grade_n', { n: g })}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                        <PiArrowLeft className="-rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        {trialDays > 0 ? (
                            <button
                                onClick={() => handleEnroll(true)}
                                disabled={isSubmitting}
                                className="w-full h-20 bg-dark text-white font-black rounded-3xl flex items-center justify-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-dark/20 group"
                            >
                                <PiLightningBold className="text-teal-400 group-hover:scale-125 transition-transform" />
                                {isSubmitting ? t('processing') : t('start_free_trial')}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleEnroll(false)}
                                disabled={isSubmitting}
                                className="w-full h-20 bg-teal-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20"
                            >
                                <PiCreditCardBold />
                                {isSubmitting ? t('processing') : t('pay_and_enroll')}
                            </button>
                        )}
                        <p className="text-center text-[11px] font-bold text-neutral-400 px-4 leading-relaxed">
                            {t('terms_note')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
