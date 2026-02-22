"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PiUsersThree, PiBuildings, PiArrowRight, PiStudent, PiChalkboardTeacher } from "react-icons/pi";

export default function OnboardingWelcomePage() {
    const router = useRouter();
    const t = useTranslations('OnboardingWelcomePage');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="max-w-4xl w-full space-y-12 text-center">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-app-dark-blue dark:text-white tracking-tighter">
                        {t('choose_your_journey')} <span className="text-app-bright-green">{t('journey')}</span>
                    </h1>
                    <p className="text-xl text-app-dark-blue/70 dark:text-white/70 max-w-2xl mx-auto font-medium">
                        {t('get_started_message')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Path */}
                    <button
                        onClick={() => router.push("/workspaces/onboarding/student")}
                        className="group relative bg-white p-8 rounded-[2.5rem] border border-black/10 dark:border-white/10 hover:border-teal-500 transition-all duration-500 text-left hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-app flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                            <PiStudent />
                        </div>
                        <h3 className="text-2xl font-black text-app-dark-blue dark:text-white mb-2 group-hover:text-teal-600 transition-colors">{t('im_student')}</h3>
                        <p className="text-app-dark-blue/70 dark:text-white/70 text-sm font-medium mb-6 leading-relaxed opacity-80">
                            {t('student_desc')}
                        </p>
                        <div className="flex items-center gap-2 text-teal-600 font-black uppercase tracking-widest text-xs">
                            {t('start_learning')} <PiArrowRight />
                        </div>
                    </button>

                    {/* Parent Path */}
                    <button
                        onClick={() => router.push("/workspaces/onboarding/parent")}
                        className="group relative bg-white p-8 rounded-[2.5rem] border border-black/10 dark:border-white/10 hover:border-app transition-all duration-500 text-left hover:shadow-xl hover:shadow-app/10 hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-app-bright-green-light text-app-bright-green rounded-app flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                            <PiUsersThree />
                        </div>
                        <h3 className="text-2xl font-black text-app-dark-blue dark:text-white mb-2 group-hover:text-app-bright-green transition-colors">{t('im_parent')}</h3>
                        <p className="text-app-dark-blue/70 dark:text-white/70 text-sm font-medium mb-6 leading-relaxed opacity-80">
                            {t('parent_desc')}
                        </p>
                        <div className="flex items-center gap-2 text-app-bright-green font-black uppercase tracking-widest text-xs">
                            {t('start_monitoring')} <PiArrowRight />
                        </div>
                    </button>

                    {/* Provider Path */}
                    <button
                        onClick={() => router.push("/workspaces/onboarding/provider")}
                        className="group relative bg-white p-8 rounded-[2.5rem] border border-black/10 dark:border-white/10 hover:border-blue-500 transition-all duration-500 text-left hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-app flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                            <PiBuildings />
                        </div>
                        <h3 className="text-2xl font-black text-app-dark-blue dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{t('im_provider')}</h3>
                        <p className="text-app-dark-blue/70 dark:text-white/70 text-sm font-medium mb-6 leading-relaxed opacity-80">
                            {t('provider_desc')}
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs">
                            {t('apply_as_provider')} <PiArrowRight />
                        </div>
                    </button>
                </div>

                <div className="pt-12 text-center">
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">
                        {t('staff_access_notice')}
                    </p>
                </div>
            </div>
        </div>
    );
}
