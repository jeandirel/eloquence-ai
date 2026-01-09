/**
 * API Route to generate LiveKit access tokens
 */

import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const roomName = searchParams.get("roomName");
    const participantName = searchParams.get("participantName");

    if (!roomName || !participantName) {
        return NextResponse.json(
            { error: "Missing roomName or participantName" },
            { status: 400 }
        );
    }

    const apiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY || "";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "";

    if (!apiKey || !apiSecret) {
        return NextResponse.json(
            { error: "Server misconfigured: missing API keys" },
            { status: 500 }
        );
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
    });

    // Grant permissions
    token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
    });

    return NextResponse.json({
        token: await token.toJwt(),
    });
}
