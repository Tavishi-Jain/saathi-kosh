import { NextResponse } from "next/server";
import { z } from "zod";
import { ACTIVE_CALL_STATUSES, callMemberFromRequest, DEMO_GROUP_KEY } from "@/lib/calls";
import { prisma } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

const actionSchema = z.object({ action: z.enum(["accept", "decline", "hangup", "failed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const member = await callMemberFromRequest(request);
    if (!member) return NextResponse.json({ error: "Select a valid demo group member first." }, { status: 401 });
    const { id } = await params;
    const { action } = actionSchema.parse(await readJson(request));
    const call = await prisma.callInvitation.findFirst({
      where: { id, groupKey: DEMO_GROUP_KEY },
      select: { id: true, callerId: true, calleeId: true, status: true },
    });
    if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
    const isCaller = call.callerId === member.id;
    const isCallee = call.calleeId === member.id;
    if (!isCaller && !isCallee) return NextResponse.json({ error: "You are not a participant in this call." }, { status: 403 });

    if (action === "accept" || action === "decline") {
      if (!isCallee) return NextResponse.json({ error: "Only the invited member can accept or decline." }, { status: 403 });
      if (call.status !== "RINGING") return NextResponse.json({ error: "This invitation is no longer ringing." }, { status: 409 });
      const updated = await prisma.callInvitation.updateMany({
        where: { id, groupKey: DEMO_GROUP_KEY, status: "RINGING", calleeId: member.id },
        data: action === "accept"
          ? { status: "ACCEPTED", acceptedAt: new Date() }
          : { status: "DECLINED", endedAt: new Date() },
      });
      if (!updated.count) return NextResponse.json({ error: "This invitation was already handled." }, { status: 409 });
      console.info("[calls] invitation response", { callId: id, memberId: member.id, action });
      return NextResponse.json({ status: action === "accept" ? "ACCEPTED" : "DECLINED" });
    }

    if (!ACTIVE_CALL_STATUSES.includes(call.status as (typeof ACTIVE_CALL_STATUSES)[number])) {
      return NextResponse.json({ status: call.status });
    }
    const updated = await prisma.callInvitation.updateMany({
      where: {
        id, groupKey: DEMO_GROUP_KEY,
        status: { in: [...ACTIVE_CALL_STATUSES] },
        OR: [{ callerId: member.id }, { calleeId: member.id }],
      },
      data: { status: action === "failed" ? "FAILED" : "ENDED", endedAt: new Date() },
    });
    if (!updated.count) return NextResponse.json({ error: "Call already ended." }, { status: 409 });
    console.info("[calls] call finished", { callId: id, memberId: member.id, status: action === "failed" ? "FAILED" : "ENDED" });
    return NextResponse.json({ status: action === "failed" ? "FAILED" : "ENDED" });
  } catch (error) {
    console.error("[calls] invitation state update failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(error);
  }
}
