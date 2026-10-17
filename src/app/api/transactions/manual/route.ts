import { NextResponse } from "next/server";
import { transactionSchema } from "@/lib/domain";
import { createManualTransaction } from "@/lib/ledger";
import { actorFrom, errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const entry = transactionSchema.parse(await readJson(request));
    const transaction = await createManualTransaction(entry, actorFrom(request));
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
