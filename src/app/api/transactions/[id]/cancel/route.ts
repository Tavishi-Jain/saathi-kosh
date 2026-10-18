import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { appendAudit } from "@/lib/audit";
import { cancelTransactionSchema } from "@/lib/domain";
import { errorResponse, actorFrom, readJson } from "@/lib/http";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { reason } = cancelTransactionSchema.parse(await readJson(request));
    const actor = actorFrom(request);
    const transaction = await prisma.$transaction(async (tx) => {
      const existing = await tx.transactionEntry.findUnique({
        where: { id },
        include: { member: true },
      });
      if (!existing) throw new Error("Transaction not found.");
      if (existing.cancelledAt) throw new Error("Transaction is already cancelled.");
      const cancelled = await tx.transactionEntry.update({
        where: { id },
        data: {
          cancelledAt: new Date(),
          cancelledBy: actor,
          cancellationReason: reason,
        },
        include: { member: true },
      });
      await appendAudit(tx, {
        actor,
        eventType: "TRANSACTION_CANCELLED",
        entityRef: cancelled.id,
        payload: {
          member: cancelled.member.name,
          amountPaise: cancelled.amountPaise,
          reason,
          originalActor: cancelled.actor,
        },
      });
      return cancelled;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ transaction });
  } catch (error) {
    return errorResponse(error);
  }
}
