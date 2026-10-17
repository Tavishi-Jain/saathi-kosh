import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseLoanProposalTranscript } from "@/lib/domain";
import { errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { transcript } = z.object({ transcript: z.string().trim().min(1).max(8000) }).parse(await readJson(request));
    const members = await prisma.member.findMany({ select: { name: true } });
    const result = parseLoanProposalTranscript(transcript, members.map((member) => member.name));
    if ("unresolved" in result) {
      return NextResponse.json({ parsed: false, clarification: result.unresolved });
    }
    return NextResponse.json({ parsed: true, proposal: result });
  } catch (error) {
    return errorResponse(error);
  }
}
