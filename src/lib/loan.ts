import { prisma } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { evaluateVote } from "@/lib/domain";

export async function castVote(proposalId: string, memberName: string, choice: "YES" | "NO") {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.loanProposal.findUnique({
      where: { id: proposalId },
      include: { votes: true, member: true },
    });
    if (!proposal) throw new Error("Loan proposal not found.");
    const member = await tx.member.findUnique({ where: { name: memberName } });
    if (!member) throw new Error("Select a group member before voting.");
    const existing = await tx.vote.findUnique({
      where: { proposalId_memberId: { proposalId, memberId: member.id } },
    });
    if (existing) return { proposal, duplicate: true, status: proposal.status };
    if (proposal.status !== "PENDING") throw new Error("Voting is closed for this proposal.");
    const vote = await tx.vote.create({ data: { proposalId, memberId: member.id, choice } });
    await appendAudit(tx, {
      actor: member.name,
      eventType: "LOAN_VOTE_CAST",
      entityRef: proposalId,
      payload: { member: member.name, choice },
    });
    const votes = [...proposal.votes, vote];
    const settings = await tx.groupSettings.findUniqueOrThrow({ where: { id: "group" } });
    const result = evaluateVote(votes, settings, proposal.emergency);
    const status = result.reachedQuorum
      ? result.passed ? "APPROVED" : "REJECTED"
      : proposal.status;
    if (result.reachedQuorum) {
      await tx.loanProposal.update({ where: { id: proposalId }, data: { status } });
      await appendAudit(tx, {
        actor: "Saathi Kosh",
        eventType: "LOAN_VOTE_RESULT",
        entityRef: proposalId,
        payload: { status, ...result },
      });
    }
    return { proposal: { ...proposal, votes, status }, duplicate: false, status, decision: result };
  });
}
