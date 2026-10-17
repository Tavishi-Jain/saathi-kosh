import { prisma } from "../src/lib/db";
import { appendAudit } from "../src/lib/audit";

async function main() {
  await prisma.vote.deleteMany();
  await prisma.loanApproval.deleteMany();
  await prisma.callInvitation.deleteMany();
  await prisma.loanProposal.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.transactionEntry.deleteMany();
  await prisma.bankRecord.deleteMany();
  await prisma.member.deleteMany();
  await prisma.groupSettings.upsert({
    where: { id: "group" },
    update: {
      openingBalancePaise: 4_500_000,
      approvalLimitPaise: 500_000,
      quorumCount: 7,
      approvalPercent: 60,
      emergencyVoting: false,
      emergencyQuorumCount: 4,
      expectedContributionPaise: 50_000,
    },
    create: {
      id: "group",
      openingBalancePaise: 4_500_000,
      approvalLimitPaise: 500_000,
      quorumCount: 7,
      approvalPercent: 60,
      emergencyVoting: false,
      emergencyQuorumCount: 4,
      expectedContributionPaise: 50_000,
    },
  });
  const memberNames = [
    "Sunita", "Rekha", "Meena", "Kavita", "Pooja", "Asha",
    "Nirmala", "Sarla", "Geeta", "Lata", "Rani", "Shanti",
  ];
  const now = new Date();
  const day = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);
  const members = await Promise.all(memberNames.map((name, index) =>
    prisma.member.create({
      data: {
        name,
        role: index === 0 ? "Treasurer" : index === 1 ? "Co-signer" : "सदस्य",
        authorized: index < 2,
        nextInstallmentPaise: name === "Rekha" ? 50_000 : null,
        nextInstallmentAt: name === "Rekha" ? day(-5) : null,
      },
    }),
  ));
  const byName = new Map(members.map((member) => [member.name, member]));
  const ledgerRows = [
    { name: "Rekha", type: "LOAN_DISBURSEMENT" as const, amountPaise: 1_000_000, daysAgo: 20, description: "कार्यशील पूँजी ऋण दिया", bankReference: null },
    { name: "Sunita", type: "DEPOSIT" as const, amountPaise: 50_000, daysAgo: 2, description: "साप्ताहिक बचत जमा", bankReference: "BANK-1001" },
    { name: "Rekha", type: "LOAN_REPAYMENT" as const, amountPaise: 100_000, daysAgo: 1, description: "ऋण की साप्ताहिक किस्त", bankReference: "BANK-1002" },
    { name: "Meena", type: "DEPOSIT" as const, amountPaise: 30_000, daysAgo: 0, description: "साप्ताहिक बचत जमा", bankReference: null },
  ];
  for (const [index, row] of ledgerRows.entries()) {
    const transaction = await prisma.transactionEntry.create({
      data: {
        idempotencyKey: `seed-ledger-${index + 1}`,
        memberId: byName.get(row.name)!.id,
        type: row.type,
        amountPaise: row.amountPaise,
        occurredAt: day(row.daysAgo),
        description: row.description,
        source: "manual",
        actor: "Treasurer",
        bankReference: row.bankReference,
      },
    });
    await appendAudit(prisma, {
      actor: "Treasurer",
      eventType: "DEMO_TRANSACTION_SEEDED",
      entityRef: transaction.id,
      payload: { member: row.name, type: row.type, amountPaise: row.amountPaise },
    });
  }
  await prisma.bankRecord.createMany({
    data: [
      { externalId: "BANK-1001", occurredAt: day(2), direction: "IN", amountPaise: 50_000, description: "Sakhi SHG deposit", reference: "BANK-1001" },
      { externalId: "BANK-1002", occurredAt: day(1), direction: "IN", amountPaise: 100_000, description: "Loan instalment", reference: "BANK-1002" },
      { externalId: "BANK-1003", occurredAt: day(0), direction: "IN", amountPaise: 50_000, description: "Unrecorded bank credit", reference: "BANK-1003" },
      { externalId: "BANK-1004", occurredAt: day(8), direction: "IN", amountPaise: 50_000, description: "Similar amount, different date", reference: "BANK-1004" },
      { externalId: "BANK-1001-COPY", occurredAt: day(2), direction: "IN", amountPaise: 50_000, description: "Possible duplicate credit", reference: "BANK-1001" },
    ],
  });
  const proposal = await prisma.loanProposal.create({
    data: {
      idempotencyKey: "seed-loan-15000",
      memberId: byName.get("Meena")!.id,
      amountPaise: 1_500_000,
      purpose: "छोटी दुकान के लिए सामान",
      status: "PENDING",
    },
  });
  await appendAudit(prisma, {
    actor: "Treasurer",
    eventType: "LOAN_PROPOSAL_CREATED",
    entityRef: proposal.id,
    payload: { member: "Meena", amountPaise: proposal.amountPaise, status: proposal.status },
  });
  console.log(`Seeded Sakhi Self-Help Group with ${members.length} members and demo records.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
