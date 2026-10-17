import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { callMemberFromRequest, DEMO_GROUP_KEY, liveKitConfigured } from "@/lib/calls";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await callMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Select a valid demo group member first." }, { status: 401 });
  if (!liveKitConfigured()) return NextResponse.json({ error: "LiveKit is not configured on the server." }, { status: 503 });
  const { id } = await params;
  const call = await prisma.callInvitation.findFirst({
    where: {
      id,
      groupKey: DEMO_GROUP_KEY,
      status: { in: ["ACCEPTED", "CONNECTED"] },
      OR: [{ callerId: member.id }, { calleeId: member.id }],
    },
    include: { caller: { select: { id: true } }, callee: { select: { id: true } } },
  });
  if (!call) return NextResponse.json({ error: "You are not authorized to join this accepted call." }, { status: 403 });

  try {
    const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
      identity: member.id,
      ttl: "5m",
    });
    token.addGrant({
      roomJoin: true,
      room: call.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });
    const jwt = await token.toJwt();
    console.info("[calls] participant token created", { callId: id, memberId: member.id });
    return NextResponse.json({ token: jwt, url: process.env.LIVEKIT_URL });
  } catch (error) {
    console.error("[calls] participant token creation failed", {
      callId: id,
      memberId: member.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "Could not create a LiveKit token." }, { status: 502 });
  }
}
