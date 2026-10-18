import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { actorFrom, errorResponse, readJson } from "@/lib/http";
import { confirmTransactionsSchema } from "@/lib/domain";
import { createConfirmedTransactions } from "@/lib/ledger";
import { calculateBalance } from "@/lib/domain";

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
    const balancePaise = calculateBalance(settings.openingBalancePaise, all);
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
