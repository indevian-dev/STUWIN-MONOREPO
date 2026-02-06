"use client";

import { PiHandHeartFill, PiGameControllerFill, PiNavigationArrowFill, PiShieldCheckeredFill, PiStudentFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Vision points will be mapped from translations inside the component

export function PublicHomeVisionWidget() {
    const t = useTranslations('PublicHomeVisionWidget');
    const pointsTranslations = t.raw('vision_points');

    const pointIcons = [
        <PiHandHeartFill className="text-4xl text-brand-secondary" />,
        <PiGameControllerFill className="text-4xl text-brand-secondary" />,
        <PiNavigationArrowFill className="text-4xl text-brand-secondary" />,
        <PiStudentFill className="text-4xl text-brand-secondary" />
    ];

    const visionPoints = pointsTranslations.map((p: any, idx: number) => ({
        ...p,
        icon: pointIcons[idx]
    }));

    return (
        <section id="vision" className="relative py-24 lg:py-32 bg-white overflow-hidden">
            {/* Soft Glows for trust/calm atmosphere */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-brand/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative max-w-7xl mx-auto px-4">
                <div className="flex flex-col gap-16 text-left items-center">
                    {/* Full Width Header */}
                    <div className="grid grid-cols-1 gap-8 w-full">
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                            {t('headline_start')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary">{t('headline_end')}</span> {t('headline_extra')}
                        </h2>

                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                            {t('body')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 w-full text-left">
                        {visionPoints.slice(0, 4).map((point: any, idx: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="group relative p-8 rounded-[2.5rem] bg-brand/10 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                            >
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="p-5 rounded-3xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-500">
                                        {point.icon}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-slate-900">{point.title}</h3>
                                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                            {point.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
