import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ACTIVE_CALL_STATUSES, callMemberFromRequest, DEMO_GROUP_KEY, liveKitConfigured } from "@/lib/calls";
import { prisma } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

const activeCallWhere = {
  groupKey: DEMO_GROUP_KEY,
  status: { in: [...ACTIVE_CALL_STATUSES] },
};

export async function GET(request: Request) {
  const member = await callMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Select a valid demo group member first." }, { status: 401 });

  const ringingExpiry = new Date(Date.now() - 90_000);
  const joiningExpiry = new Date(Date.now() - 90_000);
  await prisma.callInvitation.updateMany({
    where: { ...activeCallWhere, status: "RINGING", createdAt: { lt: ringingExpiry } },
    data: { status: "FAILED", endedAt: new Date() },
  });
  await prisma.callInvitation.updateMany({
    where: {
      ...activeCallWhere,
      status: "ACCEPTED",
      OR: [
        { acceptedAt: { lt: joiningExpiry } },
        { acceptedAt: null, createdAt: { lt: joiningExpiry } },
      ],
    },
    data: { status: "FAILED", endedAt: new Date() },
  });
  await prisma.callInvitation.updateMany({
    where: { ...activeCallWhere, status: "CONNECTED", updatedAt: { lt: new Date(Date.now() - 45_000) } },
    data: { status: "ENDED", endedAt: new Date() },
  });

  const calls = await prisma.callInvitation.findMany({
    where: {
      groupKey: DEMO_GROUP_KEY,
      OR: [
        {
          status: { in: [...ACTIVE_CALL_STATUSES] },
          OR: [{ callerId: member.id }, { calleeId: member.id }],
        },
        {
          status: { in: ["DECLINED", "ENDED", "FAILED"] },
          updatedAt: { gte: new Date(Date.now() - 60_000) },
          OR: [{ callerId: member.id }, { calleeId: member.id }],
        },
      ],
    },
    include: {
      caller: { select: { id: true, name: true } },
      callee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json({ calls, configured: liveKitConfigured() });
}

export async function POST(request: Request) {
  try {
    const caller = await callMemberFromRequest(request);
    if (!caller) return NextResponse.json({ error: "Select a valid demo group member first." }, { status: 401 });
    if (!liveKitConfigured()) {
      return NextResponse.json({ error: "LiveKit is not configured on the server." }, { status: 503 });
    }
    const { calleeId } = z.object({ calleeId: z.string().cuid() }).parse(await readJson(request));
    if (caller.id === calleeId) return NextResponse.json({ error: "You cannot call yourself." }, { status: 400 });
    const callee = await prisma.member.findUnique({ where: { id: calleeId }, select: { id: true } });
    if (!callee) return NextResponse.json({ error: "That member is not in this Sakhi group." }, { status: 404 });

    const call = await prisma.$transaction(async (tx) => {
      const existing = await tx.callInvitation.findFirst({
        where: {
          ...activeCallWhere,
          OR: [
            { callerId: caller.id }, { calleeId: caller.id },
            { callerId: callee.id }, { calleeId: callee.id },
          ],
        },
        select: { id: true },
      });
      if (existing) return null;
      return tx.callInvitation.create({
        data: {
          groupKey: DEMO_GROUP_KEY,
          roomName: `sakhi-call-${randomUUID()}`,
          callerId: caller.id,
          calleeId: callee.id,
          status: "RINGING",
        },
        include: {
          caller: { select: { id: true, name: true } },
          callee: { select: { id: true, name: true } },
        },
      });
    });
    if (!call) return NextResponse.json({ error: "You or that member already have an active call." }, { status: 409 });
    console.info("[calls] invitation created", { callId: call.id, callerId: caller.id, calleeId: callee.id });
    return NextResponse.json({ call }, { status: 201 });
  } catch (error) {
    console.error("[calls] invitation creation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(error);
  }
}
