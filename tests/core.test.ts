import { afterAll, describe, expect, it } from "vitest";
import { GET as getAudit } from "../src/app/api/audit/route";
import { GET as getTransactions, POST as confirmEntries } from "../src/app/api/transactions/route";
import { POST as cancelTransaction } from "../src/app/api/transactions/[id]/cancel/route";
import { POST as transcribe } from "../src/app/api/voice/transcribe/route";
import { GET as getReconciliation } from "../src/app/api/reconciliation/route";
import { POST as castVote } from "../src/app/api/loans/[id]/vote/route";
import { GET as getDashboard } from "../src/app/api/dashboard/route";
import { POST as importBankData } from "../src/app/api/reconciliation/import/route";
import { POST as parseLoan } from "../src/app/api/loans/parse/route";
import { POST as queryGroup } from "../src/app/api/voice/query/route";
import { POST as createCall, GET as listCalls } from "../src/app/api/calls/route";
import { PATCH as updateCall } from "../src/app/api/calls/[id]/route";
import { POST as getCallToken } from "../src/app/api/calls/[id]/token/route";
import { POST as markCallConnected } from "../src/app/api/calls/[id]/connected/route";
import { POST as markRemoteAudioReady } from "../src/app/api/calls/[id]/media-ready/route";
import { readJson } from "../src/lib/http";
import { prisma } from "../src/lib/db";
import {
  calculateBalance,
  evaluateVote,
  parseLoanVoteResponse,
  parseTransactionTranscript,
  reconcileEntries,
} from "../src/lib/domain";

describe("Saathi Kosh deterministic business rules", () => {
  it("recognizes spoken loan approval and decline responses in English and Hindi", () => {
    expect(parseLoanVoteResponse("Yes, I approve")).toBe("YES");
    expect(parseLoanVoteResponse("हाँ")).toBe("YES");
    expect(parseLoanVoteResponse("haan")).toBe("YES");
    expect(parseLoanVoteResponse("No, I decline")).toBe("NO");
    expect(parseLoanVoteResponse("नहीं")).toBe("NO");
    expect(parseLoanVoteResponse("nhi")).toBe("NO");
    expect(parseLoanVoteResponse("I do not approve")).toBe("NO");
    expect(parseLoanVoteResponse("yes, no")).toBe("AMBIGUOUS");
    expect(parseLoanVoteResponse("please repeat the question")).toBeNull();
  });

  it("parses three Hindi/Hinglish entries without saving them", async () => {
    const before = await prisma.transactionEntry.count();
    const form = new FormData();
    form.set("text", "Aaj Sunita ne paanch sau jama kiye, Rekha ne apne loan ki ek hazaar ki kist di, aur Meena ne teen sau jama kiye.");
    const response = await transcribe(new Request("http://localhost/api/voice/transcribe", { method: "POST", body: form }));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.entries.map((entry: { memberName: string; type: string; amountPaise: number }) =>
      [entry.memberName, entry.type, entry.amountPaise])).toEqual([
      ["Sunita", "DEPOSIT", 50_000],
      ["Rekha", "LOAN_REPAYMENT", 100_000],
      ["Meena", "DEPOSIT", 30_000],
    ]);
    expect(await prisma.transactionEntry.count()).toBe(before);
  });

  it("parses Devanagari amounts and leaves a missing amount unresolved", () => {
    const supported = parseTransactionTranscript("Sunita ने पाँच सौ जमा किए", ["Sunita"]);
    expect(supported.entries[0]?.amountPaise).toBe(50_000);
    const devanagariName = parseTransactionTranscript("सुनीता ने पाँच सौ रुपये जमा किए", ["Sunita"]);
    expect(devanagariName.entries[0]).toMatchObject({ memberName: "Sunita", type: "DEPOSIT", amountPaise: 50_000 });
    const demoPhrase = parseTransactionTranscript("Aaj Sunita ne paanch sau rupaye jama kiye", ["Sunita"]);
    expect(demoPhrase.entries[0]).toMatchObject({ memberName: "Sunita", type: "DEPOSIT", amountPaise: 50_000 });
    const unclear = parseTransactionTranscript("Sunita ने जमा किए", ["Sunita"]);
    expect(unclear.entries).toHaveLength(0);
    expect(unclear.unresolved[0]).toContain("राशि स्पष्ट नहीं");
    const ambiguous = parseTransactionTranscript("Sunita ने 2026 तारीख़ पर 500 जमा किए", ["Sunita"]);
    expect(ambiguous.entries).toHaveLength(0);
    expect(ambiguous.unresolved[0]).toContain("राशि स्पष्ट नहीं");
  });

  it("keeps a spoken loan request from becoming a confirmed loan disbursement", async () => {
    const before = await prisma.transactionEntry.count();
    const note = "Meena ko pandrah hazaar ka loan chahiye, dukaan ke liye.";
    const parsedEntry = parseTransactionTranscript(note, ["Meena"]);
    expect(parsedEntry.entries).toHaveLength(0);
    expect(parsedEntry.unresolved[0]).toContain("ऋण अनुरोध है");

    const request = new Request("http://localhost/api/loans/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: note }),
    });
    const response = await parseLoan(request);
    const result = await response.json();
    expect(result).toMatchObject({
      parsed: true,
      proposal: { memberName: "Meena", amountPaise: 1_500_000, emergency: false },
    });
    const emergency = await parseLoan(new Request("http://localhost/api/loans/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "Sunita needs an emergency loan of 20000 rupees for medical treatment." }),
    }));
    expect((await emergency.json()).proposal).toMatchObject({
      memberName: "Sunita",
      amountPaise: 2_000_000,
      emergency: true,
    });
    const speechGroupedAmount = await parseLoan(new Request("http://localhost/api/loans/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "Sunita needs a medical emergency loan of rupees 20 000 for treatment." }),
    }));
    expect((await speechGroupedAmount.json()).proposal).toMatchObject({
      memberName: "Sunita",
      amountPaise: 2_000_000,
      emergency: true,
    });
    const hindiEmergency = await parseLoan(new Request("http://localhost/api/loans/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "सुनीता को इलाज के लिए आपातकालीन ऋण 20,000 रुपये चाहिए।" }),
    }));
    expect((await hindiEmergency.json()).proposal).toMatchObject({
      memberName: "Sunita",
      amountPaise: 2_000_000,
      emergency: true,
    });
    expect(await prisma.transactionEntry.count()).toBe(before);
  });

  it("calculates cash separately from loan balances using integer paise", () => {
    expect(calculateBalance(4_500_000, [
      { type: "DEPOSIT", amountPaise: 50_000 },
      { type: "LOAN_REPAYMENT", amountPaise: 100_000 },
      { type: "WITHDRAWAL", amountPaise: 20_000 },
      { type: "LOAN_DISBURSEMENT", amountPaise: 60_000 },
      { type: "DEPOSIT", amountPaise: 5_000, cancelledAt: new Date() },
    ])).toBe(4_570_000);
  });

  it("matches by reference and reports an unmatched similar bank credit", () => {
    const result = reconcileEntries(
      [{ id: "ledger-1", occurredAt: "2026-10-14T00:00:00.000Z", type: "DEPOSIT", amountPaise: 50_000, bankReference: "REF-1" }],
      [
        { id: "bank-1", occurredAt: "2026-10-14T00:00:00.000Z", direction: "IN", amountPaise: 50_000, reference: "REF-1" },
        { id: "bank-2", occurredAt: "2026-10-08T00:00:00.000Z", direction: "IN", amountPaise: 50_000, reference: "REF-2" },
      ],
    );
    expect(result.matches).toHaveLength(1);
    expect(result.unmatchedBank).toHaveLength(1);
    expect(result.unmatchedBank[0]?.reason).toContain("dates differ");
  });

  it("flags close-date amount differences instead of silently treating them as no match", () => {
    const result = reconcileEntries(
      [{ id: "ledger-amount", occurredAt: "2026-10-14T00:00:00.000Z", type: "DEPOSIT", amountPaise: 50_000 }],
      [{ id: "bank-amount", occurredAt: "2026-10-14T03:00:00.000Z", direction: "IN", amountPaise: 45_000 }],
    );
    expect(result.mismatches).toHaveLength(1);
    expect(result.unmatchedLedger).toHaveLength(0);
    expect(result.mismatches[0]?.reason).toContain("differs");
  });

  it("requires matching direction, amount and date even when a bank reference is present", () => {
    const result = reconcileEntries(
      [{ id: "ledger-ref", occurredAt: "2026-10-01T00:00:00.000Z", type: "DEPOSIT", amountPaise: 50_000, bankReference: "SAME-REF" }],
      [{ id: "bank-ref", occurredAt: "2026-10-14T00:00:00.000Z", direction: "OUT", amountPaise: 55_000, reference: "SAME-REF" }],
    );
    expect(result.matches).toHaveLength(0);
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.reason).toContain("direction differs");
    expect(result.mismatches[0]?.reason).toContain("date is outside");
    expect(result.mismatches[0]?.reason).toContain("amount differs");
  });

  it("rejects JSON bodies above the configured size even without a content-length header", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(100) }),
    });
    await expect(readJson(request, 32)).rejects.toThrow("अनुरोध बहुत बड़ा है");
  });

  it("explains seeded matches, missing credits, unmatched ledger rows and duplicate bank rows", async () => {
    const response = await getReconciliation();
    const result = await response.json();
    expect(result.matches.length).toBeGreaterThanOrEqual(2);
    expect(result.unmatchedBank.some((item: { bank: { externalId: string } }) => item.bank.externalId === "BANK-1003")).toBe(true);
    expect(result.unmatchedLedger.length).toBeGreaterThanOrEqual(1);
    expect(result.potentialDuplicates.some((item: { first: { externalId: string }; duplicate: { externalId: string } }) =>
      item.first.externalId === "BANK-1001-COPY" || item.duplicate.externalId === "BANK-1001-COPY")).toBe(true);
  });

  it("calculates the seeded cash, loan balance and installment schedule on the backend", async () => {
    const response = await getDashboard();
    const result = await response.json();
    expect(result.balancePaise).toBe(3_680_000);
    expect(result.outstandingLoansPaise).toBe(900_000);
    expect(result.pendingInstallments[0]).toMatchObject({ memberName: "Rekha", amountPaise: 50_000, outstandingPaise: 900_000 });
  });

  it("routes supported voice-query intents to deterministic ledger answers and clarifies unsupported periods", async () => {
    const ask = (query: string) => queryGroup(new Request("http://localhost/api/voice/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }));
    const weekly = await (await ask("Is hafte kitna jama hua?")).json();
    expect(weekly.answer).toContain(new Date().getDay() === 0 ? "₹300" : "₹800");
    expect(weekly.answer).not.toContain("₹36,800");

    const memberLoan = await (await ask("Meena ka kitna loan baaki hai?")).json();
    expect(memberLoan.needsClarification).toBe(false);
    expect(memberLoan.answer).toContain("₹0");

    const unsupportedPeriod = await (await ask("Pichhle hafte kitna jama hua?")).json();
    expect(unsupportedPeriod.needsClarification).toBe(true);

    const english = await queryGroup(new Request("http://localhost/api/voice/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "How much is the group balance?", language: "en" }),
    }));
    const englishAnswer = await english.json();
    expect(englishAnswer.answer).toContain("calculated group balance");
    expect(englishAnswer.answer).toContain("₹36,800");
  });

  it("authorizes call invitations and issues room-restricted short-lived tokens only to accepted participants", async () => {
    const previous = {
      url: process.env.LIVEKIT_URL,
      key: process.env.LIVEKIT_API_KEY,
      secret: process.env.LIVEKIT_API_SECRET,
    };
    process.env.LIVEKIT_URL = "wss://demo.livekit.cloud";
    process.env.LIVEKIT_API_KEY = "test-api-key";
    process.env.LIVEKIT_API_SECRET = "test-secret-never-used-outside-tests";
    const member = async (name: string) => prisma.member.findUniqueOrThrow({ where: { name }, select: { id: true } });
    const request = (url: string, actor: string, method = "POST", body?: unknown) => new Request(url, {
      method,
      headers: { "x-demo-actor": actor, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    try {
      const unauthorized = await createCall(request("http://localhost/api/calls", "Not a member", "POST", { calleeId: (await member("Meena")).id }));
      expect(unauthorized.status).toBe(401);
      const nonmemberTarget = await createCall(request("http://localhost/api/calls", "Sunita", "POST", { calleeId: `c${"a".repeat(24)}` }));
      expect(nonmemberTarget.status).toBe(404);

      const calleeId = (await member("Meena")).id;
      const created = await createCall(request("http://localhost/api/calls", "Sunita", "POST", { calleeId }));
      expect(created.status).toBe(201);
      const { call } = await created.json();
      expect(call.status).toBe("RINGING");
      expect(call.roomName).not.toContain("Sunita");
      expect(call.roomName).not.toContain("Meena");
      const recipientInbox = await listCalls(request("http://localhost/api/calls", "Meena", "GET"));
      expect((await recipientInbox.json()).calls[0]).toMatchObject({ id: call.id, status: "RINGING" });

      const callerCannotAccept = await updateCall(request(`http://localhost/api/calls/${call.id}`, "Sunita", "PATCH", { action: "accept" }), { params: Promise.resolve({ id: call.id }) });
      expect(callerCannotAccept.status).toBe(403);
      const unauthorizedToken = await getCallToken(request(`http://localhost/api/calls/${call.id}/token`, "Kavita"), { params: Promise.resolve({ id: call.id }) });
      expect(unauthorizedToken.status).toBe(403);
      const callerCannotJoinBeforeAcceptance = await getCallToken(request(`http://localhost/api/calls/${call.id}/token`, "Sunita"), { params: Promise.resolve({ id: call.id }) });
      expect(callerCannotJoinBeforeAcceptance.status).toBe(403);

      const duplicate = await createCall(request("http://localhost/api/calls", "Sunita", "POST", { calleeId: (await member("Rekha")).id }));
      expect(duplicate.status).toBe(409);
      const busyCallee = await createCall(request("http://localhost/api/calls", "Kavita", "POST", { calleeId }));
      expect(busyCallee.status).toBe(409);
      const accepted = await updateCall(request(`http://localhost/api/calls/${call.id}`, "Meena", "PATCH", { action: "accept" }), { params: Promise.resolve({ id: call.id }) });
      expect(accepted.status).toBe(200);
      const callerToken = await getCallToken(request(`http://localhost/api/calls/${call.id}/token`, "Sunita"), { params: Promise.resolve({ id: call.id }) });
      const calleeToken = await getCallToken(request(`http://localhost/api/calls/${call.id}/token`, "Meena"), { params: Promise.resolve({ id: call.id }) });
      const outsiderToken = await getCallToken(request(`http://localhost/api/calls/${call.id}/token`, "Kavita"), { params: Promise.resolve({ id: call.id }) });
      expect(callerToken.status).toBe(200);
      expect(calleeToken.status).toBe(200);
      expect(outsiderToken.status).toBe(403);
      const tokenResult = await callerToken.json();
      const calleeTokenResult = await calleeToken.json();
      const claims = JSON.parse(Buffer.from(tokenResult.token.split(".")[1], "base64url").toString("utf8"));
      const calleeClaims = JSON.parse(Buffer.from(calleeTokenResult.token.split(".")[1], "base64url").toString("utf8"));
      expect(claims.video).toMatchObject({ roomJoin: true, room: call.roomName, canPublish: true, canSubscribe: true });
      expect(calleeClaims.video.room).toBe(claims.video.room);
      expect(claims.sub).toBe((await member("Sunita")).id);
      expect(calleeClaims.sub).toBe((await member("Meena")).id);
      expect(claims.exp - claims.nbf).toBeLessThanOrEqual(300);
      expect(tokenResult.url).toBe("wss://demo.livekit.cloud");
      expect(JSON.stringify(tokenResult)).not.toContain("test-secret-never-used-outside-tests");

      const outsider = await updateCall(request(`http://localhost/api/calls/${call.id}`, "Kavita", "PATCH", { action: "hangup" }), { params: Promise.resolve({ id: call.id }) });
      expect(outsider.status).toBe(403);
      await markCallConnected(request(`http://localhost/api/calls/${call.id}/connected`, "Sunita"), { params: Promise.resolve({ id: call.id }) });
      await markCallConnected(request(`http://localhost/api/calls/${call.id}/connected`, "Meena"), { params: Promise.resolve({ id: call.id }) });
      expect((await prisma.callInvitation.findUniqueOrThrow({ where: { id: call.id } })).status).toBe("ACCEPTED");
      const outsiderAudioReady = await markRemoteAudioReady(request(`http://localhost/api/calls/${call.id}/media-ready`, "Kavita"), { params: Promise.resolve({ id: call.id }) });
      expect(outsiderAudioReady.status).toBe(403);
      const callerAudioReady = await markRemoteAudioReady(request(`http://localhost/api/calls/${call.id}/media-ready`, "Sunita"), { params: Promise.resolve({ id: call.id }) });
      expect((await callerAudioReady.json()).status).toBe("ACCEPTED");
      const calleeAudioReady = await markRemoteAudioReady(request(`http://localhost/api/calls/${call.id}/media-ready`, "Meena"), { params: Promise.resolve({ id: call.id }) });
      expect((await calleeAudioReady.json()).status).toBe("CONNECTED");
      expect((await prisma.callInvitation.findUniqueOrThrow({ where: { id: call.id } })).status).toBe("CONNECTED");

      const hungUp = await updateCall(request(`http://localhost/api/calls/${call.id}`, "Meena", "PATCH", { action: "hangup" }), { params: Promise.resolve({ id: call.id }) });
      expect(hungUp.status).toBe(200);
      const callerCalls = await listCalls(request("http://localhost/api/calls", "Sunita", "GET"));
      expect((await callerCalls.json()).calls[0].status).toBe("ENDED");

      const abandoned = await createCall(request("http://localhost/api/calls", "Sunita", "POST", { calleeId: (await member("Rekha")).id }));
      const { call: abandonedCall } = await abandoned.json();
      await updateCall(request(`http://localhost/api/calls/${abandonedCall.id}`, "Rekha", "PATCH", { action: "accept" }), { params: Promise.resolve({ id: abandonedCall.id }) });
      await prisma.callInvitation.update({
        where: { id: abandonedCall.id },
        data: {
          acceptedAt: new Date(Date.now() - 120_000),
        },
      });
      await markCallConnected(request(`http://localhost/api/calls/${abandonedCall.id}/connected`, "Sunita"), { params: Promise.resolve({ id: abandonedCall.id }) });
      const expiredCallList = await listCalls(request("http://localhost/api/calls", "Sunita", "GET"));
      expect((await expiredCallList.json()).calls[0]).toMatchObject({ id: abandonedCall.id, status: "FAILED" });
    } finally {
      if (previous.url === undefined) delete process.env.LIVEKIT_URL;
      else process.env.LIVEKIT_URL = previous.url;
      if (previous.key === undefined) delete process.env.LIVEKIT_API_KEY;
      else process.env.LIVEKIT_API_KEY = previous.key;
      if (previous.secret === undefined) delete process.env.LIVEKIT_API_SECRET;
      else process.env.LIVEKIT_API_SECRET = previous.secret;
    }
  });

  it("keeps call setup disabled when only safe example credentials are configured", async () => {
    const previous = [process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET];
    process.env.LIVEKIT_URL = "wss://your-project.livekit.cloud";
    process.env.LIVEKIT_API_KEY = "your-livekit-api-key";
    process.env.LIVEKIT_API_SECRET = "your-livekit-api-secret";
    try {
      const response = await createCall(new Request("http://localhost/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-actor": "Sunita" },
        body: JSON.stringify({ calleeId: (await prisma.member.findUniqueOrThrow({ where: { name: "Meena" } })).id }),
      }));
      expect(response.status).toBe(503);
      expect((await response.json()).error).toContain("not configured");
    } finally {
      const names = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"] as const;
      names.forEach((name, index) => {
        const value = previous[index];
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      });
    }
  });

  it("imports the bundled simulated statement without duplicate rows", async () => {
    const before = await prisma.bankRecord.count();
    const response = await importBankData(new Request("http://localhost/api/reconciliation/import", { method: "POST" }));
    expect(response.status).toBe(200);
    expect((await response.json()).imported).toBe(0);
    expect(await prisma.bankRecord.count()).toBe(before);
  });

  it("requires quorum and approval threshold for a passing vote", () => {
    const rules = { quorumCount: 7, approvalPercent: 60, emergencyVoting: true, emergencyQuorumCount: 4 };
    expect(evaluateVote([{ choice: "YES" }, { choice: "YES" }], rules).reachedQuorum).toBe(false);
    expect(evaluateVote([
      { choice: "YES" }, { choice: "YES" }, { choice: "YES" }, { choice: "YES" },
      { choice: "YES" }, { choice: "NO" }, { choice: "NO" },
    ], rules).passed).toBe(true);
    expect(evaluateVote([
      { choice: "YES" }, { choice: "NO" }, { choice: "NO" }, { choice: "NO" },
    ], rules, true).passed).toBe(false);
  });

  it("makes transaction confirmation idempotent and verifies then detects audit tampering", async () => {
    const initialCount = await prisma.transactionEntry.count();
    const input = {
      requestId: "test-confirmation-idempotent-01",
      entries: [{
        memberName: "Sunita",
        type: "DEPOSIT",
        amountPaise: 12_345,
        occurredAt: new Date().toISOString(),
        description: "Integration test deposit",
      }],
    };
    const makeRequest = () => new Request("http://localhost/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-actor": "Sunita" },
      body: JSON.stringify(input),
    });
    const first = await confirmEntries(makeRequest());
    const second = await confirmEntries(makeRequest());
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await prisma.transactionEntry.count()).toBe(initialCount + 1);
    const afterConfirm = await getTransactions(new Request("http://localhost/api/transactions"));
    expect((await afterConfirm.json()).balancePaise).toBe(3_692_345);
    const createdEntry = await prisma.transactionEntry.findUniqueOrThrow({ where: { idempotencyKey: "test-confirmation-idempotent-01:0" } });
    const cancelRequest = (reason: string) => new Request(`http://localhost/api/transactions/${createdEntry.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-actor": "Sunita" },
      body: JSON.stringify({ reason }),
    });
    expect((await cancelTransaction(cancelRequest("  " ), { params: Promise.resolve({ id: createdEntry.id }) })).status).toBe(400);
    const cancelled = await cancelTransaction(cancelRequest("Duplicate entry"), { params: Promise.resolve({ id: createdEntry.id }) });
    expect(cancelled.status).toBe(200);
    expect((await cancelled.json()).transaction).toMatchObject({
      id: createdEntry.id,
      cancelledBy: "Sunita",
      cancellationReason: "Duplicate entry",
    });
    const retained = await prisma.transactionEntry.findUnique({ where: { id: createdEntry.id } });
    expect(retained).toMatchObject({ id: createdEntry.id, amountPaise: 12_345 });
    expect(retained?.cancelledAt).toBeInstanceOf(Date);
    const afterCancel = await getTransactions(new Request("http://localhost/api/transactions"));
    expect((await afterCancel.json()).balancePaise).toBe(3_680_000);
    const repeatedCancellation = await cancelTransaction(cancelRequest("Duplicate entry"), { params: Promise.resolve({ id: createdEntry.id }) });
    expect(repeatedCancellation.status).toBe(400);

    const proposal = await prisma.loanProposal.findFirstOrThrow();
    expect(proposal.amountPaise).toBe(1_500_000);
    const voteRequest = () => new Request(`http://localhost/api/loans/${proposal.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberName: "Sunita", choice: "YES" }),
    });
    const firstVote = await castVote(voteRequest(), { params: Promise.resolve({ id: proposal.id }) });
    const repeatedVote = await castVote(voteRequest(), { params: Promise.resolve({ id: proposal.id }) });
    expect(firstVote.status).toBe(201);
    expect((await repeatedVote.json()).duplicate).toBe(true);
    expect(await prisma.vote.count({ where: { proposalId: proposal.id, member: { name: "Sunita" } } })).toBe(1);
    expect((await prisma.loanProposal.findUniqueOrThrow({ where: { id: proposal.id } })).status).toBe("PENDING");
    let finalVoteResponse: Response | undefined;
    for (const memberName of ["Rekha", "Meena", "Kavita", "Pooja", "Asha", "Nirmala"]) {
      finalVoteResponse = await castVote(new Request(`http://localhost/api/loans/${proposal.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName, choice: "YES" }),
      }), { params: Promise.resolve({ id: proposal.id }) });
    }
    if (!finalVoteResponse) throw new Error("Expected the call sequence to cast member votes.");
    expect((await finalVoteResponse.json()).status).toBe("APPROVED");
    expect((await prisma.loanProposal.findUniqueOrThrow({ where: { id: proposal.id } })).status).toBe("APPROVED");
    const repeatedAfterClose = await castVote(voteRequest(), { params: Promise.resolve({ id: proposal.id }) });
    expect((await repeatedAfterClose.json()).duplicate).toBe(true);

    const requester = await prisma.member.findUniqueOrThrow({ where: { name: "Sunita" } });
    const rejectedProposal = await prisma.loanProposal.create({
      data: {
        idempotencyKey: "test-rejected-loan-vote-result",
        memberId: requester.id,
        amountPaise: 2_000_000,
        purpose: "Integration test emergency request",
        emergency: false,
      },
    });
    let finalRejection: Response | undefined;
    for (const [index, memberName] of ["Sunita", "Rekha", "Meena", "Kavita", "Pooja", "Asha", "Nirmala"].entries()) {
      finalRejection = await castVote(new Request(`http://localhost/api/loans/${rejectedProposal.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName, choice: index === 0 ? "YES" : "NO" }),
      }), { params: Promise.resolve({ id: rejectedProposal.id }) });
    }
    if (!finalRejection) throw new Error("Expected the call sequence to cast member votes.");
    expect((await finalRejection.json()).status).toBe("REJECTED");
    expect((await prisma.loanProposal.findUniqueOrThrow({ where: { id: rejectedProposal.id } })).status).toBe("REJECTED");

    const beforeTamper = await getAudit();
    expect((await beforeTamper.json()).verification.valid).toBe(true);
    const firstEvent = await prisma.auditEvent.findFirst({ orderBy: { sequence: "asc" } });
    if (!firstEvent) throw new Error("Seed audit record is missing.");
    await prisma.auditEvent.update({ where: { id: firstEvent.id }, data: { payload: `${firstEvent.payload} ` } });
    const afterTamper = await getAudit();
    const verification = (await afterTamper.json()).verification;
    expect(verification.valid).toBe(false);
    expect(verification.firstInvalidSequence).toBe(firstEvent.sequence);
  });
});

afterAll(async () => prisma.$disconnect());
