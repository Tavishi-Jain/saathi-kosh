import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBalance, evaluateVote, reconcileEntries } from "@/lib/domain";
import { getMaxAudioSeconds, getVoiceStatus } from "@/lib/voice";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [settings, members, transactions, bank, loans] = await Promise.all([
      prisma.groupSettings.findUniqueOrThrow({ where: { id: "group" } }),
      prisma.member.findMany({ orderBy: { name: "asc" } }),
      prisma.transactionEntry.findMany({ include: { member: true }, orderBy: { occurredAt: "desc" } }),
      prisma.bankRecord.findMany(),
      prisma.loanProposal.findMany({ include: { member: true, votes: true }, orderBy: { createdAt: "desc" } }),
    ]);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = transactions.filter((entry) => entry.occurredAt >= weekStart);
    const thisMonth = transactions.filter((entry) => entry.occurredAt >= monthStart);
    const total = calculateBalance(settings.openingBalancePaise, transactions);
    const weekly = {
      depositsPaise: thisWeek.filter((entry) => entry.type === "DEPOSIT").reduce((sum, entry) => sum + entry.amountPaise, 0),
      repaymentsPaise: thisWeek.filter((entry) => entry.type === "LOAN_REPAYMENT").reduce((sum, entry) => sum + entry.amountPaise, 0),
      outflowsPaise: thisWeek.filter((entry) => entry.type === "WITHDRAWAL" || entry.type === "LOAN_DISBURSEMENT").reduce((sum, entry) => sum + entry.amountPaise, 0),
      openingPaise: calculateBalance(settings.openingBalancePaise, transactions.filter((entry) => entry.occurredAt < weekStart)),
      closingPaise: total,
    };
    const loanBalances = new Map<string, number>();
    transactions.forEach((entry) => {
      const balance = loanBalances.get(entry.memberId) ?? 0;
      if (entry.type === "LOAN_DISBURSEMENT") loanBalances.set(entry.memberId, balance + entry.amountPaise);
      if (entry.type === "LOAN_REPAYMENT") loanBalances.set(entry.memberId, balance - entry.amountPaise);
    });
    const pendingInstallments = members.flatMap((member) => {
      const outstandingPaise = Math.max(0, loanBalances.get(member.id) ?? 0);
      return outstandingPaise > 0 && member.nextInstallmentPaise && member.nextInstallmentAt
        ? [{ memberName: member.name, amountPaise: member.nextInstallmentPaise, dueAt: member.nextInstallmentAt, outstandingPaise }]
        : [];
    });
    const openLoansPaise = [...loanBalances.values()].reduce((balance, amount) => balance + Math.max(0, amount), 0);
    const reconciliation = reconcileEntries(transactions, bank);
    const pendingLoans = loans
      .filter((loan) => loan.status === "PENDING")
      .map((loan) => ({
        id: loan.id,
        memberName: loan.member.name,
        amountPaise: loan.amountPaise,
        purpose: loan.purpose,
        status: loan.status,
        emergency: loan.emergency,
        votes: loan.votes,
        decision: evaluateVote(loan.votes, settings, loan.emergency),
      }));
    const expectedContributions = members.map((member) => ({
      memberName: member.name,
      paidPaise: thisWeek.filter((entry) => entry.memberId === member.id && entry.type === "DEPOSIT").reduce((sum, entry) => sum + entry.amountPaise, 0),
      expectedPaise: settings.expectedContributionPaise,
    })).filter((member) => member.paidPaise < member.expectedPaise);
    return NextResponse.json({
      group: { name: "Sakhi Self-Help Group", memberCount: members.length },
      settings,
      members: members.map(({ id, name, role, authorized }) => ({ id, name, role, authorized })),
      balancePaise: total,
      depositsThisMonthPaise: thisMonth.filter((entry) => entry.type === "DEPOSIT").reduce((sum, entry) => sum + entry.amountPaise, 0),
      outstandingLoansPaise: Math.max(0, openLoansPaise),
      pendingLoanCount: pendingLoans.length,
      unmatchedBankCount: reconciliation.unmatchedBank.length + reconciliation.mismatches.length,
      latestTransactions: transactions.slice(0, 6),
      weekly,
      expectedContributions,
      pendingInstallments,
      reconciliation,
      pendingLoans,
      voiceStatus: getVoiceStatus(),
      maxAudioSeconds: getMaxAudioSeconds(),
      currentDateLabel: new Intl.DateTimeFormat("hi-IN", { weekday: "long", day: "numeric", month: "long" }).format(now),
      currentDateIso: now.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
