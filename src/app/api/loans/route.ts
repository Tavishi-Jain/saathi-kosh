import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { loanProposalSchema, evaluateVote } from "@/lib/domain";
import { actorFrom, errorResponse, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [settings, loans] = await Promise.all([
      prisma.groupSettings.findUniqueOrThrow({ where: { id: "group" } }),
      prisma.loanProposal.findMany({
        include: {
          member: true,
          votes: { include: { member: true } },
          approvals: { include: { member: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({
      loans: loans.map((loan) => ({
        ...loan,
        memberName: loan.member.name,
        decision: evaluateVote(loan.votes, settings, loan.emergency),
      })),
      settings,
      members: await prisma.member.findMany({ select: { id: true, name: true } }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = loanProposalSchema.parse(await readJson(request));
    const proposal = await prisma.$transaction(async (tx) => {
      const settings = await tx.groupSettings.findUniqueOrThrow({ where: { id: "group" } });
      const existing = await tx.loanProposal.findUnique({ where: { idempotencyKey: input.requestId } });
      if (existing) {
        const rules = existing.amountPaise > settings.approvalLimitPaise
          ? "Group vote required."
          : "Treasurer and authorized co-signer approval required.";
        return { ...existing, rules };
      }
      const member = await tx.member.findUnique({ where: { name: input.memberName } });
      if (!member) throw new Error(`Unknown group member: ${input.memberName}`);
      const created = await tx.loanProposal.create({
        data: {
          idempotencyKey: input.requestId,
          memberId: member.id,
          amountPaise: input.amountPaise,
          purpose: input.purpose,
          emergency: input.emergency,
        },
      });
      await appendAudit(tx, {
        actor: actorFrom(request),
        eventType: "LOAN_PROPOSAL_CREATED",
        entityRef: created.id,
        payload: { member: member.name, amountPaise: created.amountPaise, purpose: created.purpose },
      });
      return { ...created, rules: created.amountPaise > settings.approvalLimitPaise ? "Group vote required." : "Treasurer and authorized co-signer approval required." };
    });
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
