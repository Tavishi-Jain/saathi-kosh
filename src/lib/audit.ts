import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashEvent(event: {
  sequence: number;
  occurredAt: string;
  actor: string;
  eventType: string;
  entityRef: string;
  payload: string;
  previousHash: string;
}): string {
  return createHash("sha256").update(stableStringify(event)).digest("hex");
}

export async function appendAudit(
  database: Pick<Prisma.TransactionClient, "auditEvent">,
  event: { actor: string; eventType: string; entityRef: string; payload: unknown },
) {
  const previous = await database.auditEvent.findFirst({ orderBy: { sequence: "desc" } });
  const occurredAt = new Date();
  const data = {
    sequence: (previous?.sequence ?? 0) + 1,
    occurredAt,
    actor: event.actor,
    eventType: event.eventType,
    entityRef: event.entityRef,
    payload: stableStringify(event.payload),
    previousHash: previous?.eventHash ?? "GENESIS",
  };
  const eventHash = hashEvent({ ...data, occurredAt: occurredAt.toISOString() });
  return database.auditEvent.create({ data: { ...data, eventHash } });
}

export async function verifyAuditChain(database: Pick<Prisma.TransactionClient, "auditEvent">) {
  const events = await database.auditEvent.findMany({ orderBy: { sequence: "asc" } });
  let expectedPrevious = "GENESIS";
  for (const event of events) {
    const computed = hashEvent({
      sequence: event.sequence,
      occurredAt: event.occurredAt.toISOString(),
      actor: event.actor,
      eventType: event.eventType,
      entityRef: event.entityRef,
      payload: event.payload,
      previousHash: event.previousHash,
    });
    if (event.previousHash !== expectedPrevious || event.eventHash !== computed) {
      return { valid: false, checked: event.sequence - 1, firstInvalidSequence: event.sequence };
    }
    expectedPrevious = event.eventHash;
  }
  return { valid: true, checked: events.length, firstInvalidSequence: null };
}
