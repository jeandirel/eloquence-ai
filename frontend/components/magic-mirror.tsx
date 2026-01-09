"use client";

/**
 * Magic Mirror Component
 * Full-screen video display with overlay system for coaching feedback
 */

import { useEffect, useRef, useState } from "react";
import { VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import { getLiveKitService, FeedbackMessage } from "@/lib/livekit-service";
import SmartNudge from "./smart-nudge";
import ControlBar from "./control-bar";

interface MagicMirrorProps {
    onEndSession: () => void;
}

export default function MagicMirror({ onEndSession }: MagicMirrorProps) {
    const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
    const [communicationScore, setCommunicationScore] = useState(0.5);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    const livekit = getLiveKitService();
    const room = livekit.getRoom();

    useEffect(() => {
        // Listen for feedback from backend agent
        livekit.onFeedback((message) => {
            setFeedback(message);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setFeedback(null);
            }, 5000);
        });
    }, [livekit]);

    const toggleVideo = async () => {
        const newState = !isVideoEnabled;
        await livekit.toggleCamera(newState);
        setIsVideoEnabled(newState);
    };

    const toggleAudio = async () => {
        const newState = !isAudioEnabled;
        await livekit.toggleMicrophone(newState);
        setIsAudioEnabled(newState);
    };

    // Get local video track
    const localParticipant = room?.localParticipant;
    const videoTrack = Array.from(localParticipant?.trackPublications.values() || [])
        .find((pub) => pub.kind === Track.Source.Camera);

    return (
        <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            {/* Background ambient animation */}
            <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent animate-pulse opacity-50" />

            {/* Video Feed */}
            <div className="absolute inset-0 flex items-center justify-center">
                {videoTrack && (
                    <div className="relative w-full h-full">
                        <VideoTrack
                            trackRef={videoTrack}
                            className="w-full h-full object-cover mirror"
                            style={{ transform: "scaleX(-1)" }} // Mirror effect
                        />

                        {/* Glassmorphic overlay frame */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-8 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <div className="absolute top-8 left-8 bottom-8 w-1 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
                            <div className="absolute top-8 right-8 bottom-8 w-1 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
                        </div>
                    </div>
                )}
            </div>

            {/* Communication Score Display */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="glass-dark rounded-full px-6 py-3 flex items-center gap-3">
                    <div className="relative w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-300"
                            style={{ width: `${communicationScore * 100}%` }}
                        />
                    </div>
                    <span className="text-white font-medium text-sm">
                        {Math.round(communicationScore * 100)}%
                    </span>
                </div>
            </div>

            {/* Smart Nudge Overlay */}
            {feedback && (
                <SmartNudge
                    type={feedback.type}
                    message={feedback.message}
                    icon={feedback.icon}
                    position={feedback.position}
                    severity={feedback.severity}
                />
            )}

            {/* Control Bar */}
            <ControlBar
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                onToggleVideo={toggleVideo}
                onToggleAudio={toggleAudio}
                onEndSession={onEndSession}
            />

            {/* Session Timer */}
            <div className="absolute top-8 right-8 glass-dark rounded-lg px-4 py-2 text-white text-sm font-mono">
                <SessionTimer />
            </div>
        </div>
    );
}

function SessionTimer() {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
        <span>
            {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
    );
}
