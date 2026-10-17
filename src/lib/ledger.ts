import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import type { ParsedEntry } from "@/lib/domain";

export async function createConfirmedTransactions(
  requestId: string,
  entries: ParsedEntry[],
  actor: string,
  source = "voice",
) {
  return prisma.$transaction(async (tx) => {
    const created = [];
    for (const [index, entry] of entries.entries()) {
      const idempotencyKey = `${requestId}:${index}`;
      const existing = await tx.transactionEntry.findUnique({ where: { idempotencyKey } });
      if (existing) {
        created.push(existing);
        continue;
      }
      const member = await tx.member.findUnique({ where: { name: entry.memberName } });
      if (!member) throw new Error(`Unknown group member: ${entry.memberName}`);
      if (entry.correctionOfId) {
        const original = await tx.transactionEntry.findUnique({ where: { id: entry.correctionOfId } });
        if (!original) throw new Error("Correction reference not found.");
        if (entry.type !== "ADJUSTMENT") throw new Error("A correction must use the adjustment transaction type.");
      }
      const transaction = await tx.transactionEntry.create({
        data: {
          idempotencyKey,
          memberId: member.id,
          type: entry.type,
          amountPaise: entry.amountPaise,
          occurredAt: entry.occurredAt ? new Date(entry.occurredAt) : new Date(),
          description: entry.description,
          adjustmentDirection: entry.type === "ADJUSTMENT" ? entry.adjustmentDirection ?? "IN" : null,
          correctionOfId: entry.correctionOfId,
          source,
          actor,
        },
        include: { member: true },
      });
      await appendAudit(tx, {
        actor,
        eventType: "TRANSACTION_CONFIRMED",
        entityRef: transaction.id,
        payload: {
          member: member.name,
          type: transaction.type,
          amountPaise: transaction.amountPaise,
          occurredAt: transaction.occurredAt.toISOString(),
          source: transaction.source,
          requestId,
          correctionOfId: transaction.correctionOfId,
        },
      });
      created.push(transaction);
    }
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createManualTransaction(
  entry: ParsedEntry,
  actor: string,
) {
  return createConfirmedTransactions(randomUUID(), [entry], actor, "manual").then((rows) => rows[0]);
}
