import { NextResponse } from "next/server";
import { voteSchema } from "@/lib/domain";
import { castVote } from "@/lib/loan";
import { errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vote = voteSchema.parse(await readJson(request));
    const result = await castVote(id, vote.memberName, vote.choice);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
