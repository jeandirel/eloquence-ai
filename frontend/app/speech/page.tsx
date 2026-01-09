"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ArrowLeft, Activity, Terminal, AlertCircle, CheckCircle, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SystemState = 'IDLE' | 'REQUESTING_PERMISSION' | 'LISTENING' | 'PROCESSING' | 'ERROR';
type TranscriptEntry = {
    id: number;
    text: string;
    intent: string | null;
    entity: string | null;
    timestamp: Date;
};

export default function SpeechStudio() {
    const router = useRouter();

    // State management
    const [systemState, setSystemState] = useState<SystemState>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    const [volume, setVolume] = useState(0);
    const [currentCommand, setCurrentCommand] = useState<string>('');

    // Sync ref with state for use in callbacks
    useEffect(() => {
        systemStateRef.current = systemState;
    }, [systemState]);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>();
    const transcriptIdRef = useRef(0);
    const systemStateRef = useRef<SystemState>('IDLE');

    // WebSocket initialization
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket connected");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "UI_COMMAND" && data.source === "VOICE") {
                setSystemState('PROCESSING');

                const entry: TranscriptEntry = {
                    id: transcriptIdRef.current++,
                    text: data.transcript || '',
                    intent: data.command || null,
                    entity: data.entity || null,
                    timestamp: new Date()
                };

                setTranscripts(prev => [entry, ...prev].slice(0, 10));
                setCurrentCommand(data.command || '');

                // Execute interaction command
                setTimeout(() => {
                    executeInteractionCommand(data.command, data.entity);
                    setSystemState('LISTENING');
                }, 500);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            setErrorMessage("Connection to server failed");
            setSystemState('ERROR');
        };

        ws.onclose = () => {
            console.log("🔌 WebSocket disconnected");
        };

        return () => {
            ws.close();
        };
    }, []);

    // Interaction command execution (HCI-focused, not business logic)
    const executeInteractionCommand = (intent: string, entity: string) => {
        if (!intent) return;

        // Visual feedback
        playFeedbackSound();

        switch (intent) {
            case 'ACTIVATE_MODULE':
                if (entity === 'EMOTION_AI') {
                    showNotification('Emotion Analysis Activated', 'success');
                    setTimeout(() => router.push('/emotion'), 1000);
                } else if (entity === 'GESTURE_CONTROL') {
                    showNotification('Gesture Control Activated', 'success');
                    setTimeout(() => router.push('/gestures'), 1000);
                } else if (entity === 'GAZE_TRACKER') {
                    showNotification('Gaze Tracking Activated', 'success');
                    setTimeout(() => router.push('/gaze'), 1000);
                }
                break;

            case 'DEACTIVATE_MODULE':
                showNotification(`${entity} Deactivated`, 'info');
                break;

            case 'CONFIRM':
                showNotification('Action Confirmed', 'success');
                break;

            case 'CANCEL':
                showNotification('Action Cancelled', 'info');
                break;

            case 'SWITCH_TO':
                showNotification(`Switching to ${entity}`, 'info');
                break;
        }
    };

    const showNotification = (message: string, type: 'success' | 'info' | 'error') => {
        // Toast notification (simplified - could use a toast library)
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    };

    const playFeedbackSound = () => {
        // Audio feedback for recognized command
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
        oscillator.stop(audioCtx.currentTime + 0.1);
    };

    // Audio capture with proper error handling
    const startListening = async () => {
        try {
            setSystemState('REQUESTING_PERMISSION');
            setErrorMessage('');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            streamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });

            const source = audioContextRef.current.createMediaStreamSource(stream);

            // Analyzer for visualization
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;
            source.connect(analyzerRef.current);

            // ScriptProcessor for PCM extraction
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            processorRef.current.onaudioprocess = (e) => {
                // Use ref to avoid closure bug
                if (systemStateRef.current !== 'LISTENING' && systemStateRef.current !== 'PROCESSING') return;

                const inputData = e.inputBuffer.getChannelData(0);

                // Convert to Int16 PCM
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Send to backend
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const packet = new Uint8Array(1 + pcmData.byteLength);
                    packet[0] = 1; // Audio type
                    packet.set(new Uint8Array(pcmData.buffer), 1);
                    wsRef.current.send(packet.buffer);
                }
            };

            // Start visualizer
            visualize();
            setSystemState('LISTENING');

        } catch (err: any) {
            console.error("Microphone error:", err);

            if (err.name === 'NotAllowedError') {
                setErrorMessage('Microphone permission denied. Please allow access.');
            } else if (err.name === 'NotFoundError') {
                setErrorMessage('No microphone found. Please connect a microphone.');
            } else {
                setErrorMessage(`Audio error: ${err.message}`);
            }

            setSystemState('ERROR');
        }
    };

    const stopListening = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
        }

        if (analyzerRef.current) {
            analyzerRef.current.disconnect();
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        setSystemState('IDLE');
        setVolume(0);
    };

    const visualize = () => {
        if (!analyzerRef.current) return;

        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);

        const draw = () => {
            if (systemState === 'IDLE' || systemState === 'ERROR') return;

            analyzerRef.current!.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            setVolume(sum / dataArray.length);

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        draw();
    };

    const getStateIndicator = () => {
        switch (systemState) {
            case 'IDLE':
                return { icon: MicOff, color: 'text-white/20', bg: 'bg-white/5', text: 'Click to start' };
            case 'REQUESTING_PERMISSION':
                return { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', text: 'Requesting permission...' };
            case 'LISTENING':
                return { icon: Radio, color: 'text-green-400 animate-pulse', bg: 'bg-green-500/20', text: 'Listening...' };
            case 'PROCESSING':
                return { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/20', text: 'Processing...' };
            case 'ERROR':
                return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20', text: 'Error' };
        }
    };

    const stateIndicator = getStateIndicator();
    const StateIcon = stateIndicator.icon;

    return (
        <div className="min-h-screen bg-omni-bg text-white font-sans p-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 cursor-pointer hover:text-omni-primary transition-colors text-white/50"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium tracking-wide">BACK TO HUB</span>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold">Speech Studio</h1>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Interaction Layer • Wav2Vec2</p>
                </div>
            </header>

            {/* State Bar */}
            <div className={`max-w-5xl mx-auto mb-8 p-4 rounded-2xl border ${stateIndicator.bg} border-white/10 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <StateIcon className={`w-6 h-6 ${stateIndicator.color}`} />
                    <div>
                        <p className="text-sm font-semibold">{stateIndicator.text}</p>
                        {errorMessage && (
                            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
                        )}
                    </div>
                </div>

                {systemState === 'LISTENING' && (
                    <div className="text-xs text-white/40 font-mono hidden md:block">
                        Commands: "Enable emotion", "Enable gesture", "Cancel", "Confirm"
                    </div>
                )}
            </div>

            <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Visualizer Panel */}
                <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6">
                        <div className={`w-3 h-3 rounded-full ${systemState === 'LISTENING' ? 'bg-green-500 animate-pulse' : 'bg-white/10'}`} />
                    </div>

                    <div className="h-[400px] flex items-center justify-center relative">
                        {/* Waveform */}
                        <div className="flex items-center gap-1 h-32">
                            {[...Array(24)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: systemState === 'LISTENING' || systemState === 'PROCESSING'
                                            ? `${Math.max(10, (Math.sin(Date.now() / 80 + i) + 1) * volume * 2)}%`
                                            : '10%',
                                        opacity: systemState === 'LISTENING' || systemState === 'PROCESSING' ? 1 : 0.3
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="w-2 bg-gradient-to-t from-omni-primary to-blue-600 rounded-full"
                                />
                            ))}
                        </div>

                        {/* Control Overlay */}
                        {(systemState === 'IDLE' || systemState === 'ERROR') && (
                            <button
                                onClick={startListening}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/40 transition-colors backdrop-blur-sm group"
                            >
                                <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center hover:scale-110 hover:border-omni-primary transition-all">
                                    <Mic className="w-10 h-10 text-white group-hover:text-omni-primary" />
                                </div>
                            </button>
                        )}

                        {systemState === 'LISTENING' && (
                            <button
                                onClick={stopListening}
                                className="absolute bottom-4 right-4 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                <span className="text-sm">Stop</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between items-end text-white/40 text-sm font-mono">
                        <div>
                            <p>SAMPLE_RATE: 16kHz</p>
                            <p>CHANNELS: MONO</p>
                            <p>BUFFER: 4096 samples</p>
                        </div>
                        <Activity className="w-5 h-5" />
                    </div>
                </div>

                {/* Transcription Log */}
                <div className="flex flex-col gap-6">
                    <div className="bg-black border border-white/10 rounded-3xl p-6 h-full font-mono text-sm">
                        <div className="flex items-center gap-2 text-white/40 mb-6 border-b border-white/5 pb-4">
                            <Terminal className="w-4 h-4" />
                            <span>INTERACTION_LOG</span>
                            <span className="ml-auto text-xs">{transcripts.length} entries</span>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {transcripts.map((entry) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-4 bg-white/5 border-l-2 border-omni-primary rounded-r-lg hover:bg-white/10 transition-colors"
                                    >
                                        <p className="text-white/90 mb-2">"{entry.text}"</p>
                                        <div className="flex items-center gap-3 text-xs">
                                            {entry.intent ? (
                                                <span className="px-2 py-1 bg-omni-primary/20 text-omni-primary rounded">
                                                    {entry.intent}
                                                </span>
                                            ) : null}
                                            {entry.entity ? (
                                                <span className="text-white/40">→ {entry.entity}</span>
                                            ) : null}
                                            <span className="ml-auto text-white/20">
                                                {entry.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                                {transcripts.length === 0 && (
                                    <div className="text-white/20 italic text-center py-8">
                                        {systemState === 'LISTENING'
                                            ? "Listening... Speak clearly into your microphone."
                                            : "No transcriptions yet. Click the microphone to start."}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            </main>

            {/* Help Panel */}
            <div className="max-w-5xl mx-auto mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="text-sm font-semibold mb-3 text-white/60">Available Interaction Commands:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="text-white/40">"Enable emotion analysis"</div>
                    <div className="text-white/40">"Enable gesture control"</div>
                    <div className="text-white/40">"Enable gaze tracker"</div>
                    <div className="text-white/40">"Disable gesture control"</div>
                    <div className="text-white/40">"Confirm"</div>
                    <div className="text-white/40">"Cancel"</div>
                </div>
            </div>
        </div>
    );
}
