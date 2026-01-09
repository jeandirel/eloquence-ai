"use client"

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Target, ScanEye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GazeTracker() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [calibrationProgress, setCalibrationProgress] = useState(0);
    const [gazePoint, setGazePoint] = useState({ x: 50, y: 50 }); // Percentage
    const [isCalibrated, setIsCalibrated] = useState(false);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "GAZE_DATA") {
                // Assuming backend sends raw gaze vector, we map it to screen coordinates (simulation)
                // In a real app, this needs complex calibration mapping
                const vector = data.vector || [0, 0];
                setGazePoint(prev => ({
                    x: 50 + (vector[0] * 500),
                    y: 50 + (vector[1] * 500)
                }));
            }
            if (data.type === "GAZE_ALERT") {
                // Visual feedback for alert
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
                requestAnimationFrame(processLoop);
            };
            processLoop();
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-omni-bg text-white font-sans overflow-hidden cursor-none">
            {/* Hidden Camera processing */}
            <div className="fixed top-4 right-4 w-32 opacity-50 hover:opacity-100 transition-opacity z-50">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg border border-white/20" />
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            </div>

            {/* HUD UI */}
            <div className="absolute top-8 left-8 z-50">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:text-omni-primary transition-colors">
                    <ArrowLeft />
                    <span className="font-mono text-xs">EXIT TRACKING</span>
                </button>
            </div>

            {/* Calibration / Status */}
            <div className="absolute bottom-12 left-0 right-0 text-center">
                <h1 className="text-2xl font-bold tracking-widest text-white/20 uppercase">OmniSense Gaze Core</h1>
                <p className="text-white/10 text-sm mt-2 font-mono">X: {gazePoint.x.toFixed(1)} | Y: {gazePoint.y.toFixed(1)}</p>
            </div>

            {/* Gaze Cursor (Follows eyes) */}
            <motion.div
                animate={{
                    left: `${gazePoint.x}%`,
                    top: `${gazePoint.y}%`
                }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="fixed w-12 h-12 -ml-6 -mt-6 pointer-events-none z-40"
            >
                <div className="relative w-full h-full">
                    <ScanEye className="w-full h-full text-omni-primary opacity-80" />
                    <div className="absolute inset-0 bg-omni-primary blur-md opacity-40 animate-pulse" />
                </div>
            </motion.div>

            {/* Interactive Targets Grid */}
            <div className="w-full h-screen flex items-center justify-center">
                <div className="grid grid-cols-3 gap-32 opacity-40">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.2, opacity: 1, color: "#00F3FF" }}
                            className="w-24 h-24 border border-white/20 rounded-full flex items-center justify-center group transition-colors"
                        >
                            <Target className="w-8 h-8 text-white/20 group-hover:text-omni-primary" />
                        </motion.div>
                    ))}
                </div>
            </div>

        </div>
    );
}
