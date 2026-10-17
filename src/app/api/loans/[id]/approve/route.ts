import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { actorFrom, errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = actorFrom(request);
    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.loanProposal.findUnique({
        where: { id },
        include: { approvals: { include: { member: true } } },
      });
      if (!proposal) throw new Error("Loan proposal not found.");
      const settings = await tx.groupSettings.findUniqueOrThrow({ where: { id: "group" } });
      if (proposal.amountPaise > settings.approvalLimitPaise) {
        throw new Error("इस राशि के लिए समूह मतदान आवश्यक है।");
      }
      if (proposal.status !== "PENDING") throw new Error("यह प्रस्ताव अब लंबित नहीं है।");
      const member = await tx.member.findUnique({ where: { name: actor } });
      if (!member?.authorized) throw new Error("केवल अधिकृत कोषाध्यक्ष या सह-हस्ताक्षरकर्ता अनुमोदित कर सकते हैं।");
      const alreadyApproved = proposal.approvals.some((approval) => approval.memberId === member.id);
      if (alreadyApproved) return { duplicate: true, approvals: proposal.approvals, status: proposal.status };
      await tx.loanApproval.create({ data: { proposalId: proposal.id, memberId: member.id } });
      await appendAudit(tx, {
        actor: member.name,
        eventType: "LOAN_AUTHORIZED_APPROVAL",
        entityRef: proposal.id,
        payload: { member: member.name, role: member.role },
      });
      const approvals = [...proposal.approvals, { member }];
      const hasTreasurer = approvals.some((approval) => approval.member.role === "Treasurer");
      const hasCoSigner = approvals.some((approval) => approval.member.role === "Co-signer");
      const status = hasTreasurer && hasCoSigner ? "APPROVED" : proposal.status;
      if (status === "APPROVED") {
        await tx.loanProposal.update({ where: { id }, data: { status } });
        await appendAudit(tx, {
          actor: "Saathi Kosh",
          eventType: "LOAN_APPROVED_BY_SIGNERS",
          entityRef: proposal.id,
          payload: { status, approvals: approvals.map((approval) => approval.member.name) },
        });
      }
      return { duplicate: false, approvals, status };
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
