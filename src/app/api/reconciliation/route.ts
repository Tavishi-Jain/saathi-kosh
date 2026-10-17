import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reconcileEntries } from "@/lib/domain";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [ledger, bank] = await Promise.all([
      prisma.transactionEntry.findMany({ include: { member: true }, orderBy: { occurredAt: "desc" } }),
      prisma.bankRecord.findMany({ orderBy: { occurredAt: "desc" } }),
    ]);
    return NextResponse.json({
      ...reconcileEntries(ledger, bank),
      ledger: ledger.map((entry) => ({ ...entry, memberName: entry.member.name })),
      bank,
      simulated: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
