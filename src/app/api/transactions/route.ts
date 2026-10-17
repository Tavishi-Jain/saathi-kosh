import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { actorFrom, errorResponse, readJson } from "@/lib/http";
import { confirmTransactionsSchema } from "@/lib/domain";
import { createConfirmedTransactions } from "@/lib/ledger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const member = url.searchParams.get("member");
    const type = url.searchParams.get("type");
    const transactions = await prisma.transactionEntry.findMany({
      where: {
        ...(member ? { member: { name: member } } : {}),
        ...(type && ["DEPOSIT", "WITHDRAWAL", "LOAN_DISBURSEMENT", "LOAN_REPAYMENT", "ADJUSTMENT"].includes(type)
          ? { type: type as "DEPOSIT" | "WITHDRAWAL" | "LOAN_DISBURSEMENT" | "LOAN_REPAYMENT" | "ADJUSTMENT" }
          : {}),
      },
      include: { member: true },
      orderBy: { occurredAt: "desc" },
      take: 250,
    });
    const settings = await prisma.groupSettings.findUniqueOrThrow({ where: { id: "group" } });
    const all = await prisma.transactionEntry.findMany();
    const balancePaise = settings.openingBalancePaise + all.reduce((sum, entry) => {
      const cashIn = entry.type === "DEPOSIT" || entry.type === "LOAN_REPAYMENT" ||
        (entry.type === "ADJUSTMENT" && entry.adjustmentDirection === "IN");
      return sum + (cashIn ? entry.amountPaise : -entry.amountPaise);
    }, 0);
    return NextResponse.json({ transactions, balancePaise, openingBalancePaise: settings.openingBalancePaise });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = confirmTransactionsSchema.parse(body);
    const transactions = await createConfirmedTransactions(parsed.requestId, parsed.entries, actorFrom(request));
    return NextResponse.json({ transactions }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
