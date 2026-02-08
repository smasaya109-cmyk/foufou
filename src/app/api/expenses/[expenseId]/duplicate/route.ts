import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { canUsePremium, requireGroupEdit } from "@/lib/rbac";
import { groupExpensesRef, groupAuditRef, nowIso } from "@/lib/firestore";

type ExpenseDoc = {
  id: string;
  groupId: string;
};

async function requireExpense(expenseId: string): Promise<ExpenseDoc | null> {
  const query = await adminDb
    .collectionGroup("expenses")
    .where("id", "==", expenseId)
    .limit(1)
    .get();

  if (query.empty) return null;
  const doc = query.docs[0]!;
  const groupId = doc.ref.parent.parent?.id;
  if (!groupId) return null;
  return { id: doc.id, groupId };
}

export async function POST(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  const user = await requireAuth(request);
  const exp = await requireExpense(params.expenseId);
  if (!exp) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  await requireGroupEdit(user.id, exp.groupId);

  const premium = await canUsePremium(user.id, exp.groupId);
  if (!premium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const original = await groupExpensesRef(exp.groupId).doc(exp.id).get();
  if (!original.exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const data = original.data() as any;
  const now = nowIso();
  const newRef = groupExpensesRef(exp.groupId).doc();
  await newRef.set({
    ...data,
    id: newRef.id,
    createdAt: now,
    updatedAt: now,
    createdByUserId: user.id
  });

  await groupAuditRef(exp.groupId).add({
    actorUserId: user.id,
    action: "expense_duplicate",
    payload: { expenseId: exp.id, newExpenseId: newRef.id },
    createdAt: now
  });

  return NextResponse.json({ id: newRef.id });
}
