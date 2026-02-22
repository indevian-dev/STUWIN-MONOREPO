"use client";

import { PiHandHeartFill, PiGameControllerFill, PiNavigationArrowFill, PiStudentFill } from "react-icons/pi";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { IconType } from "react-icons";
import { Card, CardHeader, CardTitle, CardDescription } from "../../../primitives/Card.primitive";
import { Section } from "../../../primitives/Section.primitive";

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
        <Section padding="lg" layout="centered" id="vision" className="bg-white dark:bg-app-dark-blue overflow-hidden transition-colors duration-300 rounded-app border border-black/10 dark:border-white/10 shadow-app-widget">


            <div className="relative w-full z-10">
                <div className="flex flex-col gap-16 text-left items-center">
                    {/* Full Width Header */}
                    <div className="grid grid-cols-1 gap-8 w-full">
                        <h2 className="text-4xl lg:text-6xl font-black text-app-dark-blue dark:text-white leading-[1.1] tracking-tighter">
                            {t('headline_start')} <span className="text-app-bright-green">{t('headline_end')}</span> {t('headline_extra')}
                        </h2>

                        <p className="text-lg text-app-dark-blue/70 dark:text-white/70 leading-relaxed font-medium">
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
                                className="h-full"
                            >
                                <Card className="group relative h-full bg-black/5 dark:bg-white/5 backdrop-blur-md border-black/10 dark:border-white/10 hover:bg-black/5 dark:bg-white/5 backdrop-blur-md hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                                    {/* Background Icon */}
                                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none group-hover:opacity-[0.10] group-hover:scale-110 transition-all duration-700 text-app-bright-green">
                                        <point.Icon className="text-[20rem] leading-none text-app-bright-green/70" />
                                    </div>

                                    <CardHeader className="relative z-10 p-8 space-y-4">
                                        <CardTitle className="text-2xl font-black text-app-dark-blue dark:text-white">{point.title}</CardTitle>
                                        <CardDescription className="text-lg text-app-dark-blue/70 dark:text-white/70 font-medium leading-relaxed">
                                            {point.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </Section>
    );
}
