"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Hash, Zap, Hexagon, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmotionAI() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const startSession = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: "SESSION_CONTROL",
                action: "START"
            });
            const blob = new Blob([new Uint8Array([2]), message], { type: 'application/json' });
            wsRef.current.send(blob);
            setIsRecording(true);
        }
    };

    const stopSession = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: "SESSION_CONTROL",
                action: "STOP"
            });
            const blob = new Blob([new Uint8Array([2]), message], { type: 'application/json' });
            wsRef.current.send(blob);
            setIsRecording(false);
        }
    };

    // Live Data
    const [currentEmotion, setCurrentEmotion] = useState("Neutral");
    const [confidence, setConfidence] = useState(0);
    const [emotionScores, setEmotionScores] = useState<Record<string, number>>({});

    // Stats
    const [detectionCount, setDetectionCount] = useState(0);
    const [totalConfidence, setTotalConfidence] = useState(0);

    // --- WebSocket Setup ---
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "SESSION_REPORT") {
                localStorage.setItem('last_session_report', JSON.stringify(data.report));
                router.push('/report');
            }

            if (data.type === "UI_ADAPTATION") {
                setCurrentEmotion(data.emotion);

                const conf = data.confidence || 0;
                setConfidence(conf);

                if (data.all_emotions) {
                    setEmotionScores(data.all_emotions);
                }

                setDetectionCount(prev => prev + 1);
                setTotalConfidence(prev => prev + conf);
            }
        };

        startVideo();

        return () => {
            ws.close();
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const processLoop = () => {
                if (!videoRef.current || !canvasRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
                    requestAnimationFrame(processLoop);
                    return;
                }

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                    canvasRef.current.toBlob((blob) => {
                        if (blob) {
                            const newBlob = new Blob([new Uint8Array([0]), blob], { type: 'image/jpeg' });
                            wsRef.current?.send(newBlob);
                        }
                    }, 'image/jpeg', 0.8);
                }
                setTimeout(() => requestAnimationFrame(processLoop), 200);
            };
            processLoop();

        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    // --- Helpers ---
    const getEmoji = (emotion: string) => {
        const map: Record<string, string> = {
            happy: "😊", sad: "😔", angry: "😠", fear: "😨", surprise: "😲", neutral: "😐", disgust: "🤢"
        };
        return map[emotion.toLowerCase()] || "😐";
    };

    const getColor = (emotion: string) => {
        const map: Record<string, string> = {
            happy: "text-green-400 border-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]",
            sad: "text-blue-400 border-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]",
            angry: "text-red-500 border-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]",
            fear: "text-purple-400 border-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]",
            surprise: "text-yellow-400 border-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]",
            neutral: "text-white/80 border-white/20",
            disgust: "text-emerald-500 border-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        };
        return map[emotion.toLowerCase()] || "text-white/60 border-white/20";
    };

    const avgConfidence = detectionCount > 0 ? (totalConfidence / detectionCount) * 100 : 0;

    // --- Radar Chart Logic ---
    const emotionsOrder = ['Neutral', 'Happy', 'Surprise', 'Fear', 'Angry', 'Disgust', 'Sad'];

    // Calculate polygonal points
    const points = useMemo(() => {
        const total = emotionsOrder.length;
        const radius = 100; // SVG coordinate space radius
        const center = { x: 150, y: 150 }; // SVG center

        return emotionsOrder.map((emotion, i) => {
            const angle = (Math.PI * 2 * i) / total - Math.PI / 2; // Start at top
            const value = (emotionScores[emotion.toLowerCase()] || 0) / 100; // 0 to 1
            const r = value * radius;

            return {
                x: center.x + r * Math.cos(angle),
                y: center.y + r * Math.sin(angle),
                rawAngle: angle,
                label: emotion
            };
        }).map(p => `${p.x},${p.y}`).join(" ");
    }, [emotionScores]);

    // Background Grid (Concentric Hexagons/Septagons depending on axis count)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const gridPoints = (level: number) => {
        const total = emotionsOrder.length;
        const radius = 100 * level;
        const center = { x: 150, y: 150 };
        return emotionsOrder.map((_, i) => {
            const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
            return `${center.x + radius * Math.cos(angle)},${center.y + radius * Math.sin(angle)}`;
        }).join(" ");
    };

    return (
        <div className="min-h-screen bg-[#050510] text-white font-sans p-6 overflow-hidden flex flex-col selection:bg-omni-primary/30">
            {/* Ambient Background Glow (Reactive) */}
            <div className={`absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out bg-gradient-radial from-transparent to-[#050510]`}
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${getColor(currentEmotion).includes('red') ? '#ef4444' : getColor(currentEmotion).includes('green') ? '#4ade80' : getColor(currentEmotion).includes('blue') ? '#60a5fa' : '#ffffff'} 0%, transparent 60%)`
                }}
            />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 flex justify-between items-center mb-4 px-4 border-b border-white/5 pb-4">
                <div onClick={() => router.push('/')} className="cursor-pointer hover:text-omni-primary transition-colors flex items-center gap-2 text-white/40 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest">Hub</span>
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black tracking-[0.2em] text-center font-mono">EMOTION<span className="text-omni-primary">ENGINE</span></h1>
                    <span className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Biometric Analysis V2.4</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-white/30">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        SYSTEM ONLINE
                    </div>
                    {/* Session Controls */}
                    {!isRecording ? (
                        <button
                            onClick={startSession}
                            className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                        >
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="tracking-wider text-[10px] font-bold">REC</span>
                        </button>
                    ) : (
                        <button
                            onClick={stopSession}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        >
                            <div className="w-2 h-2 bg-red-400 rounded-sm" />
                            <span className="tracking-wider text-[10px] font-bold">STOP</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-[80vh] items-center">

                {/* Left: Main Feed & Stats */}
                <div className="col-span-1 lg:col-span-7 flex flex-col gap-6 h-full justify-center">
                    {/* Video Container with Tech Borders */}
                    <div className="relative aspect-video bg-black/80 rounded-sm border border-white/10 shadow-2xl overflow-hidden group">
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-omni-primary/50" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-omni-primary/50" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-omni-primary/50" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-omni-primary/50" />

                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80 mix-blend-screen" />
                        <canvas ref={canvasRef} width="640" height="480" className="hidden" />

                        {/* Scanner Line Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-omni-primary/5 to-transparent h-[10%] w-full animate-scan pointer-events-none opacity-50"
                            style={{ animationDuration: '3s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />

                        {/* HUD Data */}
                        <div className="absolute top-6 left-6 z-20">
                            <motion.h2
                                key={currentEmotion}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-7xl font-black uppercase tracking-tighter ${getColor(currentEmotion).split(" ")[0]} drop-shadow-2xl`}
                            >
                                {currentEmotion}
                            </motion.h2>
                            <div className="mt-2 flex items-center gap-3">
                                <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-omni-primary text-sm font-mono tracking-wider">
                                    {(confidence * 100).toFixed(1)}% CONFIDENCE
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Emoji */}
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={currentEmotion}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                className="absolute bottom-6 right-6 text-8xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {getEmoji(currentEmotion)}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Horizontal Stats Ticker */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-sm backdrop-blur-sm">
                            <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">Session Detections</div>
                            <div className="text-2xl font-bold font-mono">{detectionCount}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-sm backdrop-blur-sm">
                            <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">System Latency</div>
                            <div className="text-2xl font-bold font-mono text-omni-primary">~24ms</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-sm backdrop-blur-sm">
                            <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">Avg Reliability</div>
                            <div className="text-2xl font-bold font-mono">{avgConfidence.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                {/* Right: Sci-Fi Radar Chart */}
                <div className="col-span-1 lg:col-span-5 flex flex-col justify-center h-full relative">
                    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 backdrop-blur-2xl relative overflow-hidden h-[500px] flex items-center justify-center">

                        {/* Decorative HUD Elements */}
                        <div className="absolute top-4 left-4 text-[10px] font-mono text-white/30">TARGET ANALYSIS</div>
                        <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/30">RADAR_VIEW_01</div>
                        <Hexagon className="absolute top-4 right-4 w-4 h-4 text-white/10" />

                        {/* Radar Chart SVG */}
                        <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
                            {/* Glow Filter */}
                            <defs>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Background Grid */}
                            {gridLevels.map((level, i) => (
                                <polygon
                                    key={i}
                                    points={gridPoints(level)}
                                    fill="none"
                                    stroke="white"
                                    strokeOpacity={0.05 + (i * 0.05)}
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Axes Lines */}
                            {emotionsOrder.map((_, i) => {
                                const angle = (Math.PI * 2 * i) / emotionsOrder.length - Math.PI / 2;
                                const x = 150 + 100 * Math.cos(angle);
                                const y = 150 + 100 * Math.sin(angle);
                                return (
                                    <line
                                        key={i}
                                        x1="150" y1="150" x2={x} y2={y}
                                        stroke="white" strokeOpacity="0.1" strokeDasharray="4 4"
                                    />
                                );
                            })}

                            {/* Data Blob (The "Radar") */}
                            <motion.polygon
                                points={points}
                                fill="rgba(6, 182, 212, 0.2)"
                                stroke="#06b6d4"
                                strokeWidth="2"
                                filter="url(#glow)"
                                initial={{ opacity: 0 }}
                                animate={{ points: points, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            />

                            {/* Labels */}
                            {emotionsOrder.map((emotion, i) => {
                                const angle = (Math.PI * 2 * i) / emotionsOrder.length - Math.PI / 2;
                                const radius = 125; // Push labels out slightly
                                const x = 150 + radius * Math.cos(angle);
                                const y = 150 + radius * Math.sin(angle);
                                const isActive = currentEmotion.toLowerCase() === emotion.toLowerCase();

                                return (
                                    <g key={i}>
                                        <text
                                            x={x}
                                            y={y}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className={`text-[10px] font-mono tracking-wider uppercase transition-colors duration-300 ${isActive ? 'fill-omni-primary font-bold' : 'fill-white/40'}`}
                                            fill="currentColor"
                                        >
                                            {emotion}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Central Value */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-t from-white/10 to-white/30 mix-blend-overlay">
                                {currentEmotion.substring(0, 3).toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-white/30 max-w-sm mx-auto leading-relaxed">
                            Real-time emotional spectrum analysis based on facial micro-expressions.
                            Data provided by DeepFace v0.0.75.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}
