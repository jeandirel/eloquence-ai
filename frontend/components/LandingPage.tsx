"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Video, Hand, Eye, ArrowRight, Activity, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    const services = [
        {
            id: 'speech',
            title: 'Speech Studio',
            description: 'Real-time transcription & intent analysis with Wav2Vec2.',
            icon: <Mic className="w-10 h-10" />,
            color: 'from-blue-500 to-indigo-600',
            path: '/speech'
        },
        {
            id: 'emotion',
            title: 'Emotion AI',
            description: 'DeepFace facial expression analysis & sentiment tracking.',
            icon: <Activity className="w-10 h-10" />,
            color: 'from-pink-500 to-rose-600',
            path: '/emotion'
        },
        {
            id: 'gestures',
            title: 'Gesture Lab',
            description: 'Hand tracking & control via MediaPipe Hands.',
            icon: <Hand className="w-10 h-10" />,
            color: 'from-amber-400 to-orange-600',
            path: '/gestures'
        },
        {
            id: 'gaze',
            title: 'Gaze Tracker',
            description: 'Eye tracking heatmap & attention monitoring.',
            icon: <Eye className="w-10 h-10" />,
            color: 'from-cyan-400 to-blue-600',
            path: '/gaze'
        }
    ];

    return (
        <div className="min-h-screen bg-omni-bg text-omni-text font-sans overflow-hidden selection:bg-omni-primary selection:text-black">

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-omni-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-omni-secondary/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            {/* Header */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-omni-primary to-omni-secondary flex items-center justify-center shadow-lg shadow-omni-primary/20">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        OmniSense
                    </span>
                </div>
                <div className="flex gap-6 text-sm font-medium text-white/60">
                    <span className="hover:text-white transition-colors cursor-pointer">Documentation</span>
                    <span className="hover:text-white transition-colors cursor-pointer">API Reference</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Settings</span>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-24 max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wide uppercase text-white/80">Systems Online</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-tight">
                        Multimodal <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-omni-primary via-white to-omni-secondary animate-gradient-x">
                            Intelligence
                        </span>
                    </h1>

                    <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                        Advanced real-time perception system fusing Speech, Computer Vision, and Affective Computing into a seamless interface.
                    </p>
                </motion.div>

                {/* Service Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (index * 0.1), duration: 0.6 }}
                            onHoverStart={() => setHoveredCard(service.id)}
                            onHoverEnd={() => setHoveredCard(null)}
                            onClick={() => router.push(service.path)}
                            className="relative group cursor-pointer"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${service.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

                            <div className="relative h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                                    {service.icon}
                                </div>

                                <div className="flex flex-col h-full justify-between relative z-10">
                                    <div>
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg`}>
                                            {React.cloneElement(service.icon as React.ReactElement, { className: "w-7 h-7 text-white" })}
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">
                                            {service.title}
                                        </h3>
                                        <p className="text-white/50 leading-relaxed text-sm">
                                            {service.description}
                                        </p>
                                    </div>

                                    <div className="mt-8 flex items-center text-sm font-semibold tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white/80">
                                        Launch Module <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Footer Status Bar */}
            <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-black/60 backdrop-blur-xl px-8 py-4 flex justify-between items-center text-xs text-white/40">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-omni-primary/50" />
                        MediaPipe Service
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-omni-secondary/50" />
                        DeepFace Service
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                        Audio Service
                    </div>
                </div>
                <div>
                    OMNISENSE v2.0 • PRO EDITION
                </div>
            </footer>
        </div>
    );
}
