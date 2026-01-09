"use client"

import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart2, Clock, Activity, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface SessionReport {
    duration_seconds: number;
    emotion_stats: Record<string, number>;
    gesture_stats: Record<string, number>;
    timeline: Array<{
        time: number;
        type: string;
        value: string;
    }>;
}

export default function ReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<SessionReport | null>(null);

    useEffect(() => {
        // Retrieve report from localStorage
        const storedReport = localStorage.getItem('last_session_report');
        if (storedReport) {
            setReport(JSON.parse(storedReport));
        }
    }, []);

    if (!report) {
        return (
            <div className="min-h-screen bg-omni-bg text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No Report Available</h2>
                    <p className="text-white/60 mb-8">Complete a session in Gesture Lab first.</p>
                    <button
                        onClick={() => router.push('/gestures')}
                        className="px-6 py-3 bg-omni-primary text-black rounded-xl font-bold hover:bg-omni-primary/90"
                    >
                        Go to Gesture Lab
                    </button>
                </div>
            </div>
        );
    }

    const totalEmotions = Object.values(report.emotion_stats).reduce((a, b) => a + b, 0);
    const sortedEmotions = Object.entries(report.emotion_stats)
        .sort(([, a], [, b]) => b - a);

    return (
        <div className="min-h-screen bg-omni-bg text-white font-sans p-8">
            <header className="flex items-center justify-between mb-12 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/gestures')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Session Report</h1>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                        <Share2 className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Key Metrics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-3 mb-2 text-white/60">
                        <Clock className="w-5 h-5 text-omni-primary" />
                        <span className="text-sm font-semibold uppercase">Duration</span>
                    </div>
                    <div className="text-4xl font-bold">{report.duration_seconds}s</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-3 mb-2 text-white/60">
                        <Activity className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-semibold uppercase">Gestures</span>
                    </div>
                    <div className="text-4xl font-bold">{Object.values(report.gesture_stats).reduce((a, b) => a + b, 0)}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-3 mb-2 text-white/60">
                        <BarChart2 className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-semibold uppercase">Dominant Emotion</span>
                    </div>
                    <div className="text-4xl font-bold capitalize">
                        {sortedEmotions.length > 0 ? sortedEmotions[0][0] : "None"}
                    </div>
                </motion.div>

                {/* Emotion Breakdown */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl"
                >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-2xl">😊</span> Emotion Analysis
                    </h3>

                    <div className="space-y-4">
                        {sortedEmotions.map(([emotion, count]) => {
                            const percentage = Math.round((count / totalEmotions) * 100) || 0;
                            return (
                                <div key={emotion} className="relative">
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span className="capitalize font-medium">{emotion}</span>
                                        <span className="text-white/60">{percentage}%</span>
                                    </div>
                                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className="h-full bg-gradient-to-r from-omni-primary to-purple-500"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {sortedEmotions.length === 0 && (
                            <div className="text-white/40 italic">No emotions detected in this session.</div>
                        )}
                    </div>
                </motion.div>

                {/* Gesture Timeline */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden"
                >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-2xl">🖐️</span> Activity Log
                    </h3>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {report.timeline.map((event, i) => (
                            <div key={i} className="flex items-center gap-4 text-sm border-l-2 border-white/20 pl-4 py-1 relative">
                                <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-omni-primary"></div>
                                <span className="text-white/40 font-mono w-12">{event.time}s</span>
                                <span className="font-bold">{event.value}</span>
                            </div>
                        ))}
                        {report.timeline.length === 0 && (
                            <div className="text-white/40 italic">No gestures recorded.</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
