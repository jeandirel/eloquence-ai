"use client";

/**
 * Control Bar Component
 * Floating dock with media controls
 */

import { Video, VideoOff, Mic, MicOff, X } from "lucide-react";

interface ControlBarProps {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    onToggleVideo: () => void;
    onToggleAudio: () => void;
    onEndSession: () => void;
}

export default function ControlBar({
    isVideoEnabled,
    isAudioEnabled,
    onToggleVideo,
    onToggleAudio,
    onEndSession,
}: ControlBarProps) {
    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
            <div className="glass-dark rounded-full px-4 py-3 shadow-glass flex items-center gap-4">
                {/* Video Toggle */}
                <button
                    onClick={onToggleVideo}
                    className={`
            w-14 h-14 rounded-full transition-all duration-300
            flex items-center justify-center
            ${isVideoEnabled
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-secondary hover:bg-secondary/80"
                        }
          `}
                    aria-label={isVideoEnabled ? "Disable camera" : "Enable camera"}
                >
                    {isVideoEnabled ? (
                        <Video className="w-5 h-5 text-white" />
                    ) : (
                        <VideoOff className="w-5 h-5 text-white" />
                    )}
                </button>

                {/* Audio Toggle */}
                <button
                    onClick={onToggleAudio}
                    className={`
            w-14 h-14 rounded-full transition-all duration-300
            flex items-center justify-center
            ${isAudioEnabled
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-secondary hover:bg-secondary/80"
                        }
          `}
                    aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                    {isAudioEnabled ? (
                        <Mic className="w-5 h-5 text-white" />
                    ) : (
                        <MicOff className="w-5 h-5 text-white" />
                    )}
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-white/20" />

                {/* End Session */}
                <button
                    onClick={onEndSession}
                    className="
            w-14 h-14 rounded-full transition-all duration-300
            bg-red-500/80 hover:bg-red-500
            flex items-center justify-center
            group
          "
                    aria-label="End session"
                >
                    <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        </div>
    );
}
