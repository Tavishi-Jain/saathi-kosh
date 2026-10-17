import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBalance, formatINR } from "@/lib/domain";
import { reconcileEntries } from "@/lib/domain";
import { errorResponse, readJson } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { query, language = "hi" } = z.object({
      query: z.string().trim().min(1).max(500),
      language: z.enum(["hi", "en"]).optional(),
    }).parse(await readJson(request));
    const english = language === "en";
    const text = query.toLowerCase();
    const [settings, transactions, bank, members, loans] = await Promise.all([
      prisma.groupSettings.findUniqueOrThrow({ where: { id: "group" } }),
      prisma.transactionEntry.findMany({ include: { member: true } }),
      prisma.bankRecord.findMany(),
      prisma.member.findMany(),
      prisma.loanProposal.findMany({ include: { member: true, votes: true }, orderBy: { createdAt: "desc" } }),
    ]);
    let answer: string;
    const asksForDeposits = /deposit|jama|जमा|बचत/.test(text);
    if (asksForDeposits && /last week|previous week|pichhle hafte|pichhle saptah|पिछले हफ़्ते|पिछले सप्ताह|last month|pichhle mahine|पिछले महीने|this month|इस महीने/.test(text)) {
      return NextResponse.json({
        answer: english
          ? "I can currently report this week's savings only. Did you mean this week's deposits?"
          : "अभी मैं सिर्फ इस हफ्ते की बचत बता सकती हूँ। क्या आप इस हफ्ते की जमा पूछ रहे हैं?",
        needsClarification: true,
      });
    } else if (/loan|कर्ज|ऋण/.test(text) && /baaki|remaining|outstanding|बाकी/.test(text)) {
      const member = members.find((candidate) => text.includes(candidate.name.toLowerCase()));
      if (!member) return NextResponse.json({
        answer: english ? "Which member's loan would you like to check? Please give their name." : "किस सदस्य के ऋण की जानकारी चाहिए? नाम बताएं।",
        needsClarification: true,
      });
      const outstanding = transactions.filter((entry) => entry.memberId === member.id).reduce((sum, entry) => {
        if (entry.type === "LOAN_DISBURSEMENT") return sum + entry.amountPaise;
        if (entry.type === "LOAN_REPAYMENT") return sum - entry.amountPaise;
        return sum;
      }, 0);
      answer = english
        ? `${member.name}'s recorded outstanding loan balance is ${formatINR(Math.max(0, outstanding))}.`
        : `${member.name} के दर्ज ऋण की बाकी राशि ${formatINR(Math.max(0, outstanding))} है।`;
    } else if (asksForDeposits && /is hafte|this week|हफ्ते|इस सप्ताह/.test(text)) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const total = transactions.filter((entry) => entry.type === "DEPOSIT" && entry.occurredAt >= weekStart)
        .reduce((sum, entry) => sum + entry.amountPaise, 0);
      answer = english
        ? `${formatINR(total)} in savings was deposited this week.`
        : `इस हफ्ते ${formatINR(total)} की बचत जमा हुई है।`;
    } else if (/bank|match|unmatched|मिल|बैंक/.test(text)) {
      const result = reconcileEntries(transactions, bank);
      const flagged = [
        ...result.unmatchedBank.map((item) => `${item.bank.description} ${formatINR(item.bank.amountPaise)}`),
        ...result.mismatches.map((item) => `बैंक ${formatINR(item.bank.amountPaise)} और बही ${formatINR(item.ledger.amountPaise)} की राशि/जानकारी जाँचें`),
      ];
      answer = flagged.length
        ? english
          ? `${flagged.length} bank feed entries need review: ${flagged.slice(0, 3).join("; ")}${flagged.length > 3 ? " and others." : "."}`
          : `बैंक फ़ीड में ${flagged.length} प्रविष्टियाँ मेल नहीं खातीं: ${flagged.slice(0, 3).join("; ")}${flagged.length > 3 ? " और अन्य।" : "।"}`
        : english ? "All bank entries match the ledger." : "सभी बैंक प्रविष्टियाँ बही से मिल गई हैं।";
    } else if (/proposal|vote|result|प्रस्ताव|मतदान|नतीजा/.test(text)) {
      const proposal = loans[0];
      answer = proposal
        ? english
          ? `${proposal.member.name}'s latest loan proposal for ${formatINR(proposal.amountPaise)} is ${proposal.status === "PENDING" ? "pending" : proposal.status === "APPROVED" ? "approved" : "rejected"}. ${proposal.votes.filter((vote) => vote.choice === "YES").length} yes and ${proposal.votes.filter((vote) => vote.choice === "NO").length} no votes are recorded.`
          : `${proposal.member.name} का ${formatINR(proposal.amountPaise)} का नवीनतम ऋण प्रस्ताव ${proposal.status === "PENDING" ? "अभी लंबित है" : proposal.status === "APPROVED" ? "स्वीकृत हुआ" : "अस्वीकृत हुआ"}। ${proposal.votes.filter((vote) => vote.choice === "YES").length} हाँ और ${proposal.votes.filter((vote) => vote.choice === "NO").length} ना वोट दर्ज हैं।`
        : english ? "There are no loan proposals yet." : "अभी कोई ऋण प्रस्ताव नहीं है।";
    } else if (/kitna|balance|paisa|बैलेंस|पैसा/.test(text)) {
      answer = english
        ? `The calculated group balance is ${formatINR(calculateBalance(settings.openingBalancePaise, transactions))}.`
        : `समूह का गणना किया हुआ बैलेंस ${formatINR(calculateBalance(settings.openingBalancePaise, transactions))} है।`;
    } else {
      answer = english
        ? "I can answer questions about the balance, this week's deposits, a member's loan, bank matches, or loan proposals."
        : "मैं बैलेंस, इस हफ्ते की जमा, सदस्य का ऋण, बैंक मिलान या ऋण प्रस्ताव के बारे में बता सकती हूँ।";
      return NextResponse.json({ answer, needsClarification: true });
    }
    return NextResponse.json({ answer, needsClarification: false });
  } catch (error) {
    return errorResponse(error);
  }
}
