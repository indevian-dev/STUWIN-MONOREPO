"use client";

import { PiHandHeartFill, PiGameControllerFill, PiNavigationArrowFill, PiShieldCheckeredFill, PiStudentFill } from "react-icons/pi";
import { motion } from "framer-motion";

const visionPoints = [
    {
        icon: <PiHandHeartFill className="text-4xl text-brand-secondary" />,
        title: "The Trust-First Reporting Model",
        description: "We don't show raw scores to parents. We report exclusively on 'Work Done on Mistakes'. By focusing on effort over failure, we eliminate the child's urge to hide results and prevent parent-child tension."
    },
    {
        icon: <PiGameControllerFill className="text-4xl text-brand-secondary" />,
        title: "Micro-Block Interactive Flow",
        description: "Learning is delivered in small, high-intensity blocks. This keeps sessions interactive, reduces cognitive load, and makes 'skipping' almost impossible through engagement."
    },
    {
        icon: <PiNavigationArrowFill className="text-4xl text-brand-secondary" />,
        title: "Guided Navigation vs. Output",
        description: "Our AI is a navigator, not a solver. It will never finish homework for a student. Instead, it guides them through the Socratic method so they achieve the solution themselves."
    },
    {
        icon: <PiStudentFill className="text-4xl text-brand-secondary" />,
        title: "Motivation Over Output",
        description: "A student motivated to work on their weak points is a student destined for success."
    }
];

export function PublicHomeVisionWidget() {
    return (
        <section id="vision" className="relative py-24 lg:py-32 bg-white overflow-hidden">
            {/* Soft Glows for trust/calm atmosphere */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-brand/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative max-w-7xl mx-auto px-4">
                <div className="flex flex-col gap-16 text-center items-center">

                    {/* Full Width Header */}
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand-secondary text-xs font-bold tracking-[0.2em] uppercase">
                            <PiShieldCheckeredFill className="text-brand" />
                            <span>Our Pedagogical Vision</span>
                        </div>

                        <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-secondary">Character,</span> Not just Scores.
                        </h2>

                        <p className="text-xl text-slate-600 leading-relaxed font-medium">
                            At STUWIN, we believe education should build trust, not anxiety. Our platform is engineered to protect the parent-child relationship while maximizing student autonomy.
                        </p>
                    </div>

                    {/* Points Grid (2 Rows) */}
                    <div className="grid md:grid-cols-2 gap-8 w-full text-left">
                        {visionPoints.slice(0, 4).map((point, idx) => (
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
