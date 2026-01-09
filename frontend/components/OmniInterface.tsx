"use client";

import { useEffect, useRef, useState } from "react";

export default function OmniInterface() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [status, setStatus] = useState("DISCONNECTED");
    const [uiMode, setUiMode] = useState<"STANDARD" | "SIMPLIFIED" | "DYNAMIC" | "CALM">("STANDARD");
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [emotion, setEmotion] = useState("neutral");
    const [gazeAlert, setGazeAlert] = useState(false);
    const [gesture, setGesture] = useState<string | null>(null);

    // Initialize Connection & Media
    useEffect(() => {
        // 1. Connect WebSocket
        const ws = new WebSocket("ws://localhost:8000/ws");

        ws.onopen = () => setStatus("CONNECTED");
        ws.onclose = () => setStatus("DISCONNECTED");
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        };
        wsRef.current = ws;

        // 2. Setup Webcam
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // Start processing loops
                    startVideoLoop();
                    startAudioLoop(stream);
                }
            })
            .catch(err => console.error("Camera Error:", err));

        return () => {
            ws.close();
        };
    }, []);

    const handleServerMessage = (data: any) => {
        if (data.type === "UI_ADAPTATION") {
            setUiMode(data.mode);
            setEmotion(data.emotion);
        } else if (data.type === "UI_COMMAND") {
            setLastCommand(`${data.source}: ${data.command}`);
            if (data.source === "GESTURE") setGesture(data.command);

            setTimeout(() => setLastCommand(null), 3000);
            setTimeout(() => setGesture(null), 2000);
        } else if (data.type === "GAZE_ALERT") {
            setGazeAlert(true);
            setTimeout(() => setGazeAlert(false), 2000);
        }
    };

    const startVideoLoop = () => {
        setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    // Draw video to canvas (resized to 640x480 for speed)
                    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

                    // Get JPEG blobs
                    canvasRef.current.toBlob((blob) => {
                        if (blob) {
                            // Prefix 0 for Video
                            blob.arrayBuffer().then(buffer => {
                                const payload = new Uint8Array(buffer.byteLength + 1);
                                payload[0] = 0;
                                payload.set(new Uint8Array(buffer), 1);
                                wsRef.current?.send(payload);
                            });
                        }
                    }, 'image/jpeg', 0.7);
                }
            }
        }, 100); // 10 FPS
    };

    const startAudioLoop = (stream: MediaStream) => {
        // Basic AudioProcessor using Web Audio API
        // Note: Creating AudioWorklet is better for perf, but ScriptProcessor is easier for single-file demo.
        const audioCtx = new AudioContext({ sampleRate: 16000 }); // Match backend
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);

                // Convert float32 to int16 PCM
                const pcmBuffer = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Prefix 1 for Audio
                const payload = new Uint8Array(pcmBuffer.byteLength + 1);
                payload[0] = 1;
                payload.set(new Uint8Array(pcmBuffer.buffer), 1);
                wsRef.current?.send(payload);
            }
        };
    };

    const getThemeColors = () => {
        switch (uiMode) {
            case "SIMPLIFIED": return "bg-gray-100/10 border-white/20 text-white";
            case "CALM": return "bg-teal-900/20 border-teal-500/30 text-teal-100";
            case "DYNAMIC": return "bg-purple-900/30 border-purple-400/50 text-purple-100 shadow-[0_0_30px_rgba(168,85,247,0.4)]";
            default: return "bg-slate-900/40 border-[#00f3ff]/30 text-cyan-50";
        }
    };

    const themeClass = getThemeColors();

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative">
            {/* Hidden Canvas for processing */}
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />

            {/* Ambient Background */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${uiMode === 'DYNAMIC' ? 'opacity-30 bg-gradient-to-tr from-purple-900 via-transparent to-blue-900' : 'opacity-0'}`} />

            {/* Header HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
                <div className={`backdrop-blur-md border rounded-xl p-4 transition-all duration-500 ${themeClass}`}>
                    <h1 className="text-2xl font-bold tracking-tighter">OMNI_SENSE</h1>
                    <div className="text-xs uppercase opacity-70 mt-1 flex gap-2">
                        <span>STATUS: {status}</span>
                        {status === 'CONNECTED' && <span className="animate-pulse text-green-400">● LIVE</span>}
                    </div>
                </div>

                <div className={`backdrop-blur-md border rounded-full px-6 py-2 transition-all duration-500 ${themeClass}`}>
                    <span className="uppercase text-sm font-semibold tracking-widest">{emotion}</span>
                </div>
            </div>

            {/* Central Feedback */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
                {gazeAlert && (
                    <div className="bg-red-500/80 text-white px-6 py-3 rounded-lg font-bold animate-bounce shadow-[0_0_20px_red]">
                        ⚠️ EYE CONTACT LOST
                    </div>
                )}

                {gesture && (
                    <div className="text-6xl animate-ping opacity-75">
                        {gesture === "SELECT_ITEM" && "👊"}
                        {gesture === "PAUSE_SESSION" && "✋"}
                        {gesture === "HIGHLIGHT_MODE" && "👆"}
                    </div>
                )}
            </div>

            {/* Main Dashboard */}
            <div className="absolute bottom-10 left-10 right-10 flex gap-6 z-10">
                <div className={`flex-1 backdrop-blur-md border rounded-2xl p-6 h-48 transition-all duration-500 ${themeClass}`}>
                    <h2 className="text-sm uppercase tracking-widest opacity-60 mb-4">System Log</h2>
                    <div className="space-y-2 font-mono text-sm">
                        <p className="opacity-50">WebSocket initialized...</p>
                        {lastCommand && (
                            <p className="text-[#00f3ff] animate-pulse">
                                {">"} {lastCommand}
                            </p>
                        )}
                    </div>
                </div>

                {/* User Video Mirror */}
                <div className="w-1/3 aspect-video rounded-2xl border-2 border-[#00f3ff]/20 bg-black/50 overflow-hidden relative">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>
            </div>
        </div>
    );
}
