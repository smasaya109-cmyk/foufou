import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { canUsePremium, requireGroupMember } from "@/lib/rbac";
import { groupExpensesRef, groupMembersRef } from "@/lib/firestore";
import { computeNet, computeTransfers } from "@/lib/settlement";

function csvEscape(value: unknown) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);

  const premium = await canUsePremium(user.id, params.groupId);
  if (!premium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const [expensesSnap, membersSnap] = await Promise.all([
    groupExpensesRef(params.groupId).orderBy("date", "desc").get(),
    groupMembersRef(params.groupId).get()
  ]);

  const memberMap = new Map<string, string>();
  membersSnap.docs.forEach((doc) => {
    const data = doc.data();
    memberMap.set(data.userId, data.name ?? data.userId);
  });

  const header = [
    "expense_id",
    "date",
    "category",
    "memo",
    "payer",
    "amount",
    "currency",
    "split_user",
    "split_amount"
  ];

  const lines = [header.join(",")];
  const expensesForSettlement: any[] = [];
  expensesSnap.docs.forEach((doc) => {
    const exp = doc.data() as any;
    expensesForSettlement.push({
      payerUserId: exp.payerUserId,
      amount: exp.amount ?? 0,
      splits: exp.splits ?? []
    });
    const payer = memberMap.get(exp.payerUserId) ?? exp.payerUserId;
    const base = [
      exp.id ?? doc.id,
      exp.date ?? "",
      exp.category ?? "",
      exp.memo ?? "",
      payer ?? "",
      exp.amount ?? 0,
      exp.currency ?? "JPY"
    ];
    const splits = Array.isArray(exp.splits) ? exp.splits : [];
    if (!splits.length) {
      lines.push([...base, "", ""].map(csvEscape).join(","));
      return;
    }
    splits.forEach((split: any) => {
      const name = memberMap.get(split.userId) ?? split.userId;
      const row = [...base, name ?? "", split.shareAmount ?? 0];
      lines.push(row.map(csvEscape).join(","));
    });
  });

  const settlementBalances = computeNet(expensesForSettlement);
  const settlementTransfers = computeTransfers(settlementBalances);
  lines.push("");
  lines.push("Settlement");
  lines.push("from,to,amount");
  settlementTransfers.forEach((transfer) => {
    const from = memberMap.get(transfer.fromUserId) ?? transfer.fromUserId;
    const to = memberMap.get(transfer.toUserId) ?? transfer.toUserId;
    lines.push([from, to, transfer.amount].map(csvEscape).join(","));
  });

  const body = lines.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="foufou-expenses-${params.groupId}.csv"`
    }
  });
}
