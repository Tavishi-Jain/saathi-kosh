import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuditChain } from "@/lib/audit";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [events, verification] = await Promise.all([
      prisma.auditEvent.findMany({ orderBy: { sequence: "desc" }, take: 100 }),
      verifyAuditChain(prisma),
    ]);
    return NextResponse.json({ events, verification });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    return NextResponse.json({ verification: await verifyAuditChain(prisma) });
  } catch (error) {
    return errorResponse(error);
  }
}
