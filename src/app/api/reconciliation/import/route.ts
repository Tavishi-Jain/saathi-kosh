import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { actorFrom, errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const csv = await readFile(path.join(process.cwd(), "data", "sample-bank.csv"), "utf8");
    const lines = csv.trim().split(/\r?\n/).slice(1);
    const now = new Date();
    const rows = lines.map((line) => {
      const [externalId, daysAgo, direction, amountPaise, description, reference] = line.split(",");
      if (!externalId || !/^\d+$/.test(daysAgo ?? "") || !/^\d+$/.test(amountPaise ?? "") ||
        !["IN", "OUT"].includes(direction ?? "")) throw new Error("Bundled sample bank CSV is invalid.");
      return { externalId, daysAgo: Number(daysAgo), direction: direction as "IN" | "OUT", amountPaise: Number(amountPaise), description, reference };
    });
    const added = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const row of rows) {
        const existing = await tx.bankRecord.findUnique({ where: { externalId: row.externalId } });
        if (existing) continue;
        await tx.bankRecord.create({
          data: {
            externalId: row.externalId,
            occurredAt: new Date(now.getTime() - row.daysAgo * 86_400_000),
            amountPaise: row.amountPaise,
            direction: row.direction,
            description: row.description,
            reference: row.reference,
          },
        });
        count += 1;
      }
      return count;
    });
    await prisma.$transaction((tx) => appendAudit(tx, {
      actor: actorFrom(request),
      eventType: "SIMULATED_BANK_DATA_IMPORTED",
      entityRef: "sakhi-demo-bank-feed",
      payload: { source: "bundled sample-bank.csv", addedRecords: added },
    }));
    return NextResponse.json({ imported: added });
  } catch (error) {
    return errorResponse(error);
  }
}
