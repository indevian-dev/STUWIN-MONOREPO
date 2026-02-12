"use client";

import { PiHandHeartFill, PiGameControllerFill, PiNavigationArrowFill, PiStudentFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { IconType } from "react-icons";

interface VisionPointTranslation {
    title: string;
    description: string;
}

interface VisionPoint extends VisionPointTranslation {
    Icon: IconType;
}

export function PublicHomeVisionWidget() {
    const t = useTranslations('PublicHomeVisionWidget');
    const pointsTranslations = t.raw('vision_points') as VisionPointTranslation[];

    const pointIcons = [
        PiHandHeartFill,
        PiGameControllerFill,
        PiNavigationArrowFill,
        PiStudentFill
    ];

    const visionPoints: VisionPoint[] = pointsTranslations.map((p, idx: number) => ({
        ...p,
        Icon: pointIcons[idx]
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
                        {visionPoints.slice(0, 4).map((point, idx: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="group relative p-8 rounded bg-brand/5 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden"
                            >
                                {/* Background Icon */}
                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-[0.10] pointer-events-none group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-700">
                                    <point.Icon className="text-[20rem] leading-none text-brand/70" />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
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
