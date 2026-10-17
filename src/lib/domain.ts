import { z } from "zod";

export const transactionTypes = [
  "DEPOSIT",
  "WITHDRAWAL",
  "LOAN_DISBURSEMENT",
  "LOAN_REPAYMENT",
  "ADJUSTMENT",
] as const;

export const transactionSchema = z.object({
  memberName: z.string().trim().min(1).max(80),
  type: z.enum(transactionTypes),
  amountPaise: z.number().int().positive().max(100_000_000),
  occurredAt: z.string().datetime().optional(),
  description: z.string().trim().min(1).max(240),
  adjustmentDirection: z.enum(["IN", "OUT"]).optional(),
  correctionOfId: z.string().optional(),
});

export const confirmTransactionsSchema = z.object({
  requestId: z.string().min(8).max(100),
  entries: z.array(transactionSchema).min(1).max(20),
});

export const loanProposalSchema = z.object({
  requestId: z.string().min(8).max(100),
  memberName: z.string().trim().min(1).max(80),
  amountPaise: z.number().int().positive().max(100_000_000),
  purpose: z.string().trim().min(2).max(240),
  emergency: z.boolean().default(false),
});

export const voteSchema = z.object({
  memberName: z.string().trim().min(1).max(80),
  choice: z.enum(["YES", "NO"]),
});

export function parseLoanVoteResponse(transcript: string): "YES" | "NO" | "AMBIGUOUS" | null {
  const tokens = transcript.toLocaleLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  const yesWords = new Set(["yes", "yeah", "yep", "approve", "approved", "haan", "han", "ha", "जी", "हाँ", "हां", "मंजूर", "मंज़ूर", "स्वीकृत"]);
  const noWords = new Set(["no", "nope", "decline", "reject", "rejected", "not", "nahi", "nahin", "nhi", "नहीं", "नही", "ना", "मत", "अस्वीकृत"]);
  if (/\b(?:not|never|don't|dont|do not)\s+(?:approve|approved|yes)\b/i.test(transcript)) return "NO";
  const hasYes = tokens.some((token) => yesWords.has(token));
  const hasNo = tokens.some((token) => noWords.has(token));
  if (hasYes && hasNo) return "AMBIGUOUS";
  if (hasYes) return "YES";
  if (hasNo) return "NO";
  return null;
}

export const settingsSchema = z.object({
  approvalLimitPaise: z.number().int().nonnegative().max(100_000_000),
  quorumCount: z.number().int().min(1).max(12),
  approvalPercent: z.number().int().min(1).max(100),
  emergencyVoting: z.boolean(),
  emergencyQuorumCount: z.number().int().min(1).max(12),
  expectedContributionPaise: z.number().int().nonnegative().max(100_000_000),
});

export function paiseFromRupees(value: string): number | null {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [rupees, fraction = ""] = normalized.split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}

export function cashEffect(
  entry: Pick<{ type: string; amountPaise: number; adjustmentDirection?: string | null }, "type" | "amountPaise" | "adjustmentDirection">,
): number {
  switch (entry.type) {
    case "DEPOSIT":
    case "LOAN_REPAYMENT":
      return entry.amountPaise;
    case "WITHDRAWAL":
    case "LOAN_DISBURSEMENT":
      return -entry.amountPaise;
    case "ADJUSTMENT":
      return entry.adjustmentDirection === "OUT" ? -entry.amountPaise : entry.amountPaise;
    default:
      return 0;
  }
}

export function calculateBalance(openingPaise: number, entries: Parameters<typeof cashEffect>[0][]): number {
  return entries.reduce((balance, entry) => balance + cashEffect(entry), openingPaise);
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

const units: Record<string, number> = {
  zero: 0, shoonya: 0, शून्य: 0, ek: 1, eka: 1, एक: 1, one: 1, do: 2, dono: 2, दो: 2, two: 2,
  teen: 3, तीन: 3, three: 3, char: 4, chaar: 4, चार: 4, four: 4, paanch: 5, panch: 5, पांच: 5, पाँच: 5, five: 5,
  chhe: 6, cheh: 6, chhah: 6, छह: 6, six: 6, saat: 7, sat: 7, सात: 7, seven: 7, aath: 8, आठ: 8,
  eight: 8, nau: 9, नौ: 9, nine: 9, das: 10, dus: 10, दस: 10, ten: 10, gyarah: 11, ग्यारह: 11,
  barah: 12, terah: 13, chaudah: 14, pandrah: 15, bees: 20, tis: 30,
  tees: 30, chalis: 40, pachas: 50, sau: 100, hundred: 100, hazaar: 1000,
  सौ: 100, hajar: 1000, हजार: 1000, हज़ार: 1000, thousand: 1000, lakh: 100000, लाख: 100000,
};

function normalizeDigits(text: string): string {
  return text.replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)));
}

function amountFromWords(segment: string): number | null {
  const normalized = normalizeDigits(segment).replace(
    /\b\d{1,3}(?:,\s?\d{2,3}|\s+\d{3})+\b/g,
    (groupedAmount) => groupedAmount.replace(/[,\s]/g, ""),
  );
  const explicit = normalized.match(/(?:₹|rs\.?|rupees?\s*)\s*(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (explicit?.[1]) {
    const paise = paiseFromRupees(explicit[1]);
    return paise !== null ? paise / 100 : null;
  }
  const numericAmounts = [...normalized.matchAll(/\d[\d,]*(?:\.\d{1,2})?/g)];
  if (numericAmounts.length === 1) {
    const rawNumber = numericAmounts[0]?.[0];
    const index = numericAmounts[0]?.index ?? 0;
    const suffix = normalized.slice(index + (rawNumber?.length ?? 0));
    if (/^\s*(?:rupees?|rs\.?|रुपये|रुपए|रुपया)(?:\s|$)/i.test(suffix)) {
      const paise = rawNumber ? paiseFromRupees(rawNumber) : null;
      return paise !== null ? paise / 100 : null;
    }
    const hasAmountAction = /deposit|jama|जमा|repay|kist|किस्त|withdraw|निकाल|loan|कर्ज|ऋण/.test(normalized.toLowerCase());
    if (hasAmountAction) {
      const paise = rawNumber ? paiseFromRupees(rawNumber) : null;
      return paise !== null ? paise / 100 : null;
    }
  }

  const tokens = segment.toLowerCase().replace(/[^a-z\u0900-\u097f\s]/g, " ").split(/\s+/);
  let total = 0;
  let chunk = 0;
  let found = false;
  for (const raw of tokens) {
    const token = raw.replace(/े$/, "");
    const value = units[token];
    if (value === undefined) continue;
    found = true;
    if (value === 100 || value === 1000 || value === 100000) {
      chunk = Math.max(1, chunk) * value;
      if (value >= 1000) {
        total += chunk;
        chunk = 0;
      }
    } else {
      chunk += value;
    }
  }
  return found ? total + chunk : null;
}

const hindiMemberNameAliases: Record<string, string[]> = {
  Sunita: ["सुनीता"],
  Rekha: ["रेखा"],
  Meena: ["मीना"],
  Kavita: ["कविता"],
  Pooja: ["पूजा"],
  Asha: ["आशा"],
  Nirmala: ["निर्मला"],
  Sarla: ["सरला"],
  Geeta: ["गीता"],
  Lata: ["लता"],
  Rani: ["रानी"],
  Shanti: ["शांति", "शान्ति"],
};

function findMemberMentions(transcript: string, memberNames: string[]) {
  const normalized = transcript.toLocaleLowerCase();
  return memberNames
    .map((name) => {
      const variants = [name, ...(hindiMemberNameAliases[name] ?? [])];
      const indexes = variants
        .map((variant) => normalized.indexOf(variant.toLocaleLowerCase()))
        .filter((index) => index >= 0);
      return { name, index: indexes.length ? Math.min(...indexes) : -1 };
    })
    .filter((candidate) => candidate.index >= 0)
    .sort((a, b) => a.index - b.index);
}

export type ParsedEntry = z.infer<typeof transactionSchema>;

export function parseLoanProposalTranscript(
  transcript: string,
  memberNames: string[],
): { memberName: string; amountPaise: number; purpose: string; emergency: boolean } | { unresolved: string } {
  const normalized = transcript.trim();
  if (!normalized) return { unresolved: "ऋण अनुरोध साफ़ नहीं सुनाई दिया। दोबारा बोलें या टाइप करें।" };
  if (!/(chahiye|chahie|need|request|maang|mang|चाहिए|चाहिये|मांग|माँग|लेना है|लोन लेना)/i.test(normalized)) {
    return { unresolved: "यह साफ़ नहीं है कि सदस्य ऋण माँग रहा है। अनुरोध को ‘ऋण चाहिए’ कहकर बताएं।" };
  }
  const candidates = findMemberMentions(normalized, memberNames);
  if (!candidates.length) return { unresolved: "समूह के सदस्य का नाम नहीं मिला।" };
  if (candidates.length > 1) return { unresolved: "एक समय में एक सदस्य का ऋण प्रस्ताव बताएं।" };
  const amount = amountFromWords(normalized);
  if (!amount || amount <= 0) return { unresolved: "ऋण की राशि स्पष्ट नहीं है। रुपये की राशि दोबारा बोलें या टाइप करें।" };
  const purpose = normalized.slice(0, 240);
  const emergency = /emergency|urgent|आपातकाल|आपात|तुरंत/i.test(normalized);
  return { memberName: candidates[0]!.name, amountPaise: Math.round(amount * 100), purpose, emergency };
}

export function parseTransactionTranscript(
  transcript: string,
  memberNames: string[],
  now = new Date(),
): { entries: ParsedEntry[]; unresolved: string[] } {
  const normalized = transcript.trim();
  if (!normalized) return { entries: [], unresolved: ["आवाज़ साफ़ सुनाई नहीं दी। कृपया फिर बोलें या टाइप करें।"] };

  const candidates = findMemberMentions(normalized, memberNames);
  if (!candidates.length) return { entries: [], unresolved: ["सदस्य का नाम नहीं मिला। किसी समूह सदस्य का नाम बोलें।"] };

  const entries: ParsedEntry[] = [];
  const unresolved: string[] = [];
  candidates.forEach((candidate, index) => {
    const start = candidate.index;
    const end = candidates[index + 1]?.index ?? normalized.length;
    const segment = normalized.slice(start, end);
    const amount = amountFromWords(segment);
    if (!amount || amount <= 0) {
      unresolved.push(`${candidate.name}: राशि स्पष्ट नहीं है। राशि दोबारा बोलें या टाइप करें।`);
      return;
    }
    const lower = segment.toLowerCase();
    if (/(chahiye|chahie|need|request|maang|mang|चाहिए|चाहिये|मांग|माँग|लेना है|लोन लेना)/i.test(lower) &&
      /loan|ऋण|कर्ज|लोन/i.test(lower)) {
      unresolved.push(`${candidate.name}: यह ऋण अनुरोध है, भुगतान नहीं। इसे ऋण और मतदान स्क्रीन पर प्रस्ताव के रूप में दर्ज करें।`);
      return;
    }
    const type = /repay|installment|installment|kist|किस्त|वापस|चुक/.test(lower)
      ? "LOAN_REPAYMENT"
      : /loan|ऋण|कर्ज|उधार/.test(lower)
        ? "LOAN_DISBURSEMENT"
        : /withdraw|निकाल|खर्च/.test(lower)
          ? "WITHDRAWAL"
          : /deposit|jama|जमा/.test(lower)
            ? "DEPOSIT"
            : null;
    if (!type) {
      unresolved.push(`${candidate.name}: लेन-देन का प्रकार स्पष्ट नहीं है। जमा, निकासी या ऋण बताएं।`);
      return;
    }
    entries.push({
      memberName: candidate.name,
      type,
      amountPaise: Math.round(amount * 100),
      occurredAt: now.toISOString(),
      description: segment.trim().slice(0, 240),
    });
  });
  return { entries, unresolved };
}

export function evaluateVote(
  votes: { choice: string }[],
  settings: { quorumCount: number; approvalPercent: number; emergencyVoting: boolean; emergencyQuorumCount: number },
  emergency = false,
) {
  const quorum = emergency && settings.emergencyVoting ? settings.emergencyQuorumCount : settings.quorumCount;
  const yes = votes.filter((vote) => vote.choice === "YES").length;
  const no = votes.filter((vote) => vote.choice === "NO").length;
  const cast = yes + no;
  const reachedQuorum = cast >= quorum;
  const passed = reachedQuorum && cast > 0 && yes / cast * 100 >= settings.approvalPercent;
  return { yes, no, cast, quorum, reachedQuorum, passed };
}

export type LedgerRow = {
  id: string;
  occurredAt: Date | string;
  type: string;
  amountPaise: number;
  adjustmentDirection?: string | null;
  bankReference?: string | null;
};

export type BankRow = {
  id: string;
  externalId?: string;
  occurredAt: Date | string;
  direction: string;
  amountPaise: number;
  description?: string;
  reference?: string | null;
};

function bankDateFor(record: BankRow) {
  return new Date(record.occurredAt).getTime();
}

export function reconcileEntries(ledger: LedgerRow[], bank: BankRow[]) {
  const usedLedger = new Set<string>();
  const usedBank = new Set<string>();
  const matches: { bank: BankRow; ledger: LedgerRow; reason: string }[] = [];
  const mismatches: { bank: BankRow; ledger: LedgerRow; reason: string }[] = [];
  const potentialDuplicates: { first: BankRow; duplicate: BankRow; reason: string }[] = [];
  for (let i = 0; i < bank.length; i += 1) {
    for (let j = i + 1; j < bank.length; j += 1) {
      const first = bank[i]!;
      const duplicate = bank[j]!;
      const daysApart = Math.abs(new Date(first.occurredAt).getTime() - new Date(duplicate.occurredAt).getTime()) / 86_400_000;
      const sameReference = Boolean(first.reference && first.reference === duplicate.reference);
      if (sameReference || (
        first.direction === duplicate.direction &&
        first.amountPaise === duplicate.amountPaise &&
        daysApart <= 1
      )) {
        potentialDuplicates.push({
          first,
          duplicate,
          reason: sameReference
            ? `Both bank rows use reference ${first.reference}.`
            : "Same direction and amount appeared within one day.",
        });
      }
    }
  }

  for (const record of bank) {
    const refMatch = record.reference
      ? ledger.find((entry) => !usedLedger.has(entry.id) && entry.bankReference === record.reference)
      : undefined;
    if (refMatch) {
      usedLedger.add(refMatch.id);
      usedBank.add(record.id);
      const daysApart = Math.abs(bankDateFor(record) - new Date(refMatch.occurredAt).getTime()) / 86_400_000;
      const ledgerDirection = refMatch.type === "DEPOSIT" || refMatch.type === "LOAN_REPAYMENT" ||
        (refMatch.type === "ADJUSTMENT" && refMatch.adjustmentDirection === "IN")
        ? "IN"
        : "OUT";
      if (refMatch.amountPaise === record.amountPaise && ledgerDirection === record.direction && daysApart <= 1) {
        matches.push({ bank: record, ledger: refMatch, reason: `Reference ${record.reference} and amount match.` });
      } else {
        const differences = [
          refMatch.amountPaise !== record.amountPaise ? "amount differs" : "",
          ledgerDirection !== record.direction ? "transaction direction differs" : "",
          daysApart > 1 ? "date is outside the 1-day tolerance" : "",
        ].filter(Boolean);
        mismatches.push({
          bank: record,
          ledger: refMatch,
          reason: `Reference ${record.reference} identifies the ledger entry, but ${differences.join(", ")}.`,
        });
      }
      continue;
    }
    const bankDate = bankDateFor(record);
    const candidate = ledger
      .filter((entry) => !usedLedger.has(entry.id))
      .map((entry) => {
        const differenceDays = Math.abs(bankDate - new Date(entry.occurredAt).getTime()) / 86_400_000;
        const isIn = entry.type === "DEPOSIT" || entry.type === "LOAN_REPAYMENT" ||
          (entry.type === "ADJUSTMENT" && entry.adjustmentDirection === "IN");
        return { entry, differenceDays, sameDirection: isIn === (record.direction === "IN") };
      })
      .filter((candidate) => candidate.sameDirection && candidate.differenceDays <= 1)
      .sort((a, b) => a.differenceDays - b.differenceDays ||
        Math.abs(a.entry.amountPaise - record.amountPaise) - Math.abs(b.entry.amountPaise - record.amountPaise))[0];
    if (candidate) {
      const amountDifference = Math.abs(candidate.entry.amountPaise - record.amountPaise);
      const plausibleAmountMismatch = amountDifference <= Math.max(100, candidate.entry.amountPaise * 0.15);
      if (candidate.entry.amountPaise === record.amountPaise) {
        usedLedger.add(candidate.entry.id);
        usedBank.add(record.id);
        matches.push({ bank: record, ledger: candidate.entry, reason: "Amount, direction and date (within 1 day) match." });
      } else if (plausibleAmountMismatch) {
        usedLedger.add(candidate.entry.id);
        usedBank.add(record.id);
        mismatches.push({
          bank: record,
          ledger: candidate.entry,
          reason: `Direction and date (within 1 day) match and amounts are close, but bank amount ${record.amountPaise} paise differs from ledger amount ${candidate.entry.amountPaise} paise.`,
        });
      }
    }
  }

  const unmatchedBank = bank.filter((record) => !usedBank.has(record.id)).map((record) => {
    const duplicate = potentialDuplicates.find((candidate) => candidate.duplicate.id === record.id);
    const nearby = ledger.find((entry) => {
      const isIn = entry.type === "DEPOSIT" || entry.type === "LOAN_REPAYMENT" ||
        (entry.type === "ADJUSTMENT" && entry.adjustmentDirection === "IN");
      return isIn === (record.direction === "IN") && Math.abs(new Date(record.occurredAt).getTime() - new Date(entry.occurredAt).getTime()) > 86_400_000 &&
        Math.abs(new Date(record.occurredAt).getTime() - new Date(entry.occurredAt).getTime()) <= 7 * 86_400_000 &&
        Math.abs(record.amountPaise - entry.amountPaise) <= Math.max(100, entry.amountPaise * 0.05);
    });
    return {
      bank: record,
      reason: duplicate
        ? `Potential duplicate of bank row ${duplicate.first.externalId ?? duplicate.first.id}: ${duplicate.reason}`
        : nearby
        ? `Similar amount to ledger entry ${nearby.id}, but the dates differ by more than one day.`
        : "No unlinked ledger entry has the same amount, direction and date.",
    };
  });
  const unmatchedLedger = ledger.filter((entry) => !usedLedger.has(entry.id)).map((entry) => ({
    ledger: entry,
    reason: "No bank record with matching reference, direction, amount and date (within 1 day).",
  }));
  return { matches, mismatches, unmatchedBank, unmatchedLedger, potentialDuplicates };
}
