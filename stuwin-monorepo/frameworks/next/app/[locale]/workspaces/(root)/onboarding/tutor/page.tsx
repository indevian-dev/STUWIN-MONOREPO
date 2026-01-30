"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { PiChalkboardTeacher, PiArrowLeft, PiArrowRight, PiCheckCircle } from "react-icons/pi";
import { toast } from "react-toastify";

export default function TutorOnboardingPage() {
    const router = useRouter();
    const t = useTranslations('TutorOnboardingPage');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        subjects: "",
        experience: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.subjects) {
            toast.warn(t('fill_fields_warn'));
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiCallForSpaHelper({
                url: "/api/workspaces/onboarding",
                method: "POST",
                body: {
                    type: "tutor",
                    data: {
                        title: formData.title, // e.g. "Math Tutor John"
                        metadata: {
                            subjects: formData.subjects,
                            experience: formData.experience
                        }
                    }
                }
            } as any);

            const result = (response as any).data;
            if (result.success) {
                setStep(2);
            } else {
                toast.error(result.error || t('application_failed'));
            }
        } catch (error) {
            toast.error(t('failed_submit'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center justify-center bg-section-gradient-brand">
                <div className="max-w-2xl w-full bg-white rounded-[3rem] p-16 text-center shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
                        <PiCheckCircle />
                    </div>
                    <h1 className="text-4xl font-black text-dark mb-4 tracking-tight">{t('application_submitted')}</h1>
                    <p className="text-body font-medium text-lg leading-relaxed mb-10 opacity-70">
                        {t('review_message')}
                    </p>
                    <button
                        onClick={() => router.push("/workspaces")}
                        className="px-12 py-5 bg-dark text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-lg shadow-xl shadow-dark/20"
                    >
                        {t('back_to_home')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center justify-center bg-section-gradient-brand">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl space-y-12">
                <button
                    onClick={() => router.push("/workspaces/onboarding/welcome")}
                    className="flex items-center gap-2 text-neutral-400 hover:text-dark transition font-black uppercase tracking-widest text-xs"
                >
                    <PiArrowLeft /> {t('back')}
                </button>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-dark tracking-tight leading-none">
                        {t('become_tutor')} <span className="text-purple-600">{t('tutor')}</span>
                    </h1>
                    <p className="text-body font-medium">
                        {t('share_knowledge')}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('display_title')}</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-purple-500 outline-none font-bold"
                            placeholder={t('display_title_placeholder')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('subjects')}</label>
                        <input
                            type="text"
                            name="subjects"
                            value={formData.subjects}
                            onChange={handleInputChange}
                            className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-purple-500 outline-none font-bold"
                            placeholder={t('subjects_placeholder')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('experience')}</label>
                        <input
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-purple-500 outline-none font-bold"
                            placeholder={t('experience_placeholder')}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-20 bg-purple-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-600/20"
                    >
                        {isSubmitting ? t('submitting') : t('submit_application')}
                        <PiArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
}
