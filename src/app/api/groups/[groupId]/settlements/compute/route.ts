import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { requireGroupMember } from "@/lib/rbac";
import { groupExpensesRef, groupSettlementsRef, nowIso } from "@/lib/firestore";
import { computeNet, computeTransfers } from "@/lib/settlement";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);

  const expensesSnap = await groupExpensesRef(params.groupId).get();
  const expenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const balancesMap = computeNet(
    expenses.map((expense: any) => ({
      ...expense,
      splits: expense.splits ?? []
    }))
  );

  const transfers = computeTransfers(balancesMap);
  const balances = Array.from(balancesMap.values());

  const lastSnap = await groupSettlementsRef(params.groupId)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const lastVersion = lastSnap.empty ? 0 : (lastSnap.docs[0]!.data().version ?? 0);
  const settlementRef = groupSettlementsRef(params.groupId).doc();

  await settlementRef.set({
    id: settlementRef.id,
    groupId: params.groupId,
    version: lastVersion + 1,
    payloadJson: { balances, transfers },
    status: "draft",
    computedAt: nowIso()
  });

  return NextResponse.json({ id: settlementRef.id, balances, transfers });
}
