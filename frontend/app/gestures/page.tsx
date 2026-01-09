"use client"

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Hand } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Landmark {
    x: number;
    y: number;
    z: number;
}

export default function GestureLab() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [gesture, setGesture] = useState("Scanning...");
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "SESSION_REPORT") {
                // Save report and redirect
                localStorage.setItem('last_session_report', JSON.stringify(data.report));
                router.push('/report');
            }

            if (data.type === "UI_COMMAND" && data.source === "GESTURE") {
                setGesture(data.gesture || data.command);

                // Draw landmarks on overlay canvas
                if (overlayCanvasRef.current && videoRef.current) {
                    const canvas = overlayCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Clear previous frame
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Draw hand landmarks
                        if (data.hand_landmarks && data.hand_connections) {
                            data.hand_landmarks.forEach((handLandmarks: Landmark[]) => {
                                drawLandmarks(
                                    ctx,
                                    handLandmarks,
                                    data.hand_connections,
                                    canvas.width,
                                    canvas.height,
                                    'hand'
                                );
                            });
                        }

                        // Draw face landmarks
                        if (data.face_landmarks && data.face_connections) {
                            data.face_landmarks.forEach((faceLandmarks: Landmark[]) => {
                                drawLandmarks(
                                    ctx,
                                    faceLandmarks,
                                    data.face_connections,
                                    canvas.width,
                                    canvas.height,
                                    'face'
                                );
                            });
                        }
                    }
                }
            }
        };

        startVideo();

        return () => {
            ws.close();
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const drawLandmarks = (
        ctx: CanvasRenderingContext2D,
        landmarks: Landmark[],
        connections: number[][],
        canvasWidth: number,
        canvasHeight: number,
        type: 'hand' | 'face'
    ) => {
        // Color schemes
        const colors = {
            hand: {
                connection: 'rgba(245, 66, 230, 0.6)',
                pointOuter: 'rgb(245, 66, 230)',
                pointInner: 'rgb(245, 117, 66)'
            },
            face: {
                connection: 'rgba(66, 245, 189, 0.4)',
                pointOuter: 'rgba(66, 245, 189, 0.8)',
                pointInner: 'rgba(100, 255, 218, 0.9)'
            }
        };

        const colorScheme = colors[type];

        // Draw connections (lines)
        ctx.strokeStyle = colorScheme.connection;
        ctx.lineWidth = type === 'hand' ? 2 : 1;
        ctx.beginPath();

        connections.forEach(([start, end]) => {
            const startLandmark = landmarks[start];
            const endLandmark = landmarks[end];

            if (startLandmark && endLandmark) {
                const startX = startLandmark.x * canvasWidth;
                const startY = startLandmark.y * canvasHeight;
                const endX = endLandmark.x * canvasWidth;
                const endY = endLandmark.y * canvasHeight;

                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
            }
        });
        ctx.stroke();

        // Draw points (landmarks)
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * canvasWidth;
            const y = landmark.y * canvasHeight;

            // Create gradient for each point
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, type === 'hand' ? 4 : 2);
            gradient.addColorStop(0, colorScheme.pointInner);
            gradient.addColorStop(1, colorScheme.pointOuter);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, type === 'hand' ? 4 : 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    };

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
                setTimeout(() => requestAnimationFrame(processLoop), 50); // Faster response: 50ms instead of 100ms
            };
            processLoop();
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const allGestures = ["FIST", "OPEN_PALM", "POINTING", "PEACE", "THUMBS_UP", "OK", "TCHAO"];

    // Gesture emoji mapping for better visual feedback
    const gestureEmojis: Record<string, string> = {
        "FIST": "✊",
        "OPEN_PALM": "✋",
        "POINTING": "☝️",
        "PEACE": "✌️",
        "THUMBS_UP": "👍",
        "OK": "👌",
        "TCHAO": "👋"
    };

    const startSession = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: "SESSION_CONTROL",
                action: "START"
            });
            // Send as Blob with prefix 2 (Control)
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
            // Send as Blob with prefix 2 (Control)
            const blob = new Blob([new Uint8Array([2]), message], { type: 'application/json' });
            wsRef.current.send(blob);
            setIsRecording(false);
        }
    };

    return (
        <div className="min-h-screen bg-omni-bg text-white font-sans p-8">
            <header className="flex items-center gap-4 mb-12">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Gesture Lab</h1>

                <div className="ml-auto flex items-center gap-4">
                    {!isRecording ? (
                        <button
                            onClick={startSession}
                            className="flex items-center gap-2 px-6 py-2 bg-green-500 text-black rounded-lg font-bold hover:bg-green-400 transition shadow-lg shadow-green-500/20"
                        >
                            <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                            Start Session
                        </button>
                    ) : (
                        <button
                            onClick={stopSession}
                            className="flex items-center gap-2 px-6 py-2 bg-red-500 text-black rounded-lg font-bold hover:bg-red-400 transition shadow-lg shadow-red-500/20"
                        >
                            <div className="w-3 h-3 bg-black rounded-sm" />
                            Stop Session
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

                {/* Main Feed */}
                <div className={`lg:col-span-2 relative aspect-video bg-black rounded-3xl overflow-hidden border transition-colors duration-300 group ${isRecording ? 'border-red-500/50 shadow-2xl shadow-red-900/20' : 'border-white/10'}`}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />

                    {/* Overlay Canvas for Landmarks */}
                    <canvas
                        ref={overlayCanvasRef}
                        width="640"
                        height="480"
                        className="absolute top-0 left-0 w-full h-full transform scale-x-[-1] pointer-events-none"
                    />

                    <canvas ref={canvasRef} width="640" height="480" className="hidden" />

                    {/* Gesture Overlay on Video - Large and Visible */}
                    {gesture && gesture !== "Scanning..." && gesture !== "UNKNOWN" && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-6 right-6 bg-omni-primary/90 backdrop-blur-xl px-8 py-4 rounded-2xl border-4 border-white/30 shadow-2xl"
                        >
                            <div className="text-black font-bold text-6xl">
                                {gestureEmojis[gesture] || "👋"}
                            </div>
                        </motion.div>
                    )}

                    {/* Tracking Status */}
                    <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur px-4 py-2 rounded-lg border border-white/10 font-mono text-xs text-omni-primary">
                        TRACKING ACTIVE
                    </div>
                </div>

                {/* Metrics Sidebar */}
                <div className="space-y-6">
                    {/* Gesture Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Hand className="w-24 h-24" />
                        </div>
                        <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-4">Current Gesture</h3>

                        {/* Large Gesture Display with Emoji */}
                        <div className="flex items-center gap-4 mb-6">
                            <motion.div
                                key={gesture}
                                initial={{ scale: 0.5, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="text-7xl"
                            >
                                {gestureEmojis[gesture] || "🤔"}
                            </motion.div>
                            <div className="text-3xl font-bold text-white">{gesture}</div>
                        </div>

                        {/* Gesture Badges */}
                        <div className="grid grid-cols-2 gap-2">
                            {allGestures.map(g => (
                                <motion.div
                                    key={g}
                                    animate={gesture === g ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                                    transition={{ repeat: gesture === g ? Infinity : 0, duration: 0.8 }}
                                    className={`text-xs px-3 py-2 rounded-lg border text-center transition-all duration-200 ${gesture === g
                                        ? 'bg-omni-primary text-black border-omni-primary font-bold shadow-lg shadow-omni-primary/50'
                                        : 'border-white/20 text-white/40 hover:border-white/40'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-base">{gestureEmojis[g]}</span>
                                        <span className="text-[9px]">{g}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
