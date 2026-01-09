/**
 * LiveKit Client Utilities
 * Handles connection to LiveKit server and room management
 */

import { Room, RoomEvent, Track } from "livekit-client";

export interface FeedbackMessage {
    type: "GAZE_ALERT" | "PACE_ALERT" | "DISSONANCE_ALERT";
    severity: "info" | "warning" | "error";
    message: string;
    icon: string;
    position: string;
}

export class LiveKitService {
    private room: Room | null = null;
    private onFeedbackCallback: ((feedback: FeedbackMessage) => void) | null = null;

    /**
     * Connect to a LiveKit room
     */
    async connect(roomName: string, participantName: string): Promise<Room> {
        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

        // In production, you'd get a token from your backend
        // For dev, we'll use the dev API key
        const token = await this.getToken(roomName, participantName);

        this.room = new Room({
            adaptiveStream: true,
            dynacast: true,
        });

        // Set up event listeners
        this.setupEventListeners();

        // Connect to room
        await this.room.connect(url, token);

        return this.room;
    }

    /**
     * Generate a client token from API route
     */
    private async getToken(roomName: string, participantName: string): Promise<string> {
        // Call our Next.js API route to generate a proper JWT token
        const response = await fetch(
            `/api/token?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`
        );

        if (!response.ok) {
            throw new Error("Failed to get access token");
        }

        const data = await response.json();
        return data.token;
    }

    /**
     * Set up room event listeners
     */
    private setupEventListeners() {
        if (!this.room) return;

        // Listen for data messages from the Python agent
        this.room.on(RoomEvent.DataReceived, (payload, participant) => {
            try {
                const decoder = new TextDecoder();
                const message = JSON.parse(decoder.decode(payload)) as FeedbackMessage;

                if (this.onFeedbackCallback) {
                    this.onFeedbackCallback(message);
                }
            } catch (error) {
                console.error("Error parsing feedback message:", error);
            }
        });

        // Handle connection quality
        this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
            console.log(`Connection quality: ${quality} for ${participant?.identity}`);
        });

        // Handle disconnection
        this.room.on(RoomEvent.Disconnected, () => {
            console.log("Disconnected from room");
        });
    }

    /**
     * Set callback for feedback messages
     */
    onFeedback(callback: (feedback: FeedbackMessage) => void) {
        this.onFeedbackCallback = callback;
    }

    /**
     * Disconnect from room
     */
    async disconnect() {
        if (this.room) {
            await this.room.disconnect();
            this.room = null;
        }
    }

    /**
     * Get current room instance
     */
    getRoom(): Room | null {
        return this.room;
    }

    /**
     * Enable/disable camera
     */
    async toggleCamera(enabled: boolean) {
        if (!this.room) return;

        await this.room.localParticipant.setCameraEnabled(enabled);
    }

    /**
     * Enable/disable microphone
     */
    async toggleMicrophone(enabled: boolean) {
        if (!this.room) return;

        await this.room.localParticipant.setMicrophoneEnabled(enabled);
    }
}

// Singleton instance
let livekitService: LiveKitService | null = null;

export function getLiveKitService(): LiveKitService {
    if (!livekitService) {
        livekitService = new LiveKitService();
    }
    return livekitService;
}
