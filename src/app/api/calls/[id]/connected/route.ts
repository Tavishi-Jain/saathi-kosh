import { NextResponse } from "next/server";
import { callMemberFromRequest, DEMO_GROUP_KEY } from "@/lib/calls";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await callMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Select a valid demo group member first." }, { status: 401 });
  const { id } = await params;
  const call = await prisma.callInvitation.findFirst({
    where: {
      id,
      groupKey: DEMO_GROUP_KEY,
      status: { in: ["ACCEPTED", "CONNECTED"] },
      OR: [{ callerId: member.id }, { calleeId: member.id }],
    },
  });
  if (!call) return NextResponse.json({ error: "You are not a participant in an accepted call." }, { status: 403 });
  const now = new Date();
  await prisma.callInvitation.update({
    where: { id: call.id },
    data: call.callerId === member.id ? { callerConnectedAt: now } : { calleeConnectedAt: now },
  });
  const updated = await prisma.callInvitation.findUniqueOrThrow({ where: { id: call.id } });
  if (updated.callerAudioReadyAt && updated.calleeAudioReadyAt && updated.status !== "CONNECTED") {
    await prisma.callInvitation.updateMany({
      where: { id: updated.id, groupKey: DEMO_GROUP_KEY, status: "ACCEPTED" },
      data: { status: "CONNECTED" },
    });
  }
  console.debug("[calls] participant heartbeat", { callId: id, memberId: member.id });
  return NextResponse.json({ status: updated.status });
}
