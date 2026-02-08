import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { canUsePremium, requireGroupEdit } from "@/lib/rbac";
import { groupExpensesRef, groupAuditRef, nowIso } from "@/lib/firestore";

const splitSchema = z.object({
  userId: z.string().min(1),
  shareAmount: z.number().int().nonnegative()
});

const schema = z.object({
  payerUserId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  date: z.string().datetime(),
  category: z.string().min(1).max(40),
  memo: z.string().max(200).optional(),
  splitType: z.enum(["equal", "select", "ratio", "subgroup"]),
  splits: z.array(splitSchema).min(1),
  splitMeta: z
    .object({
      ratios: z.record(z.number().nonnegative()).optional(),
      subgroup: z.array(z.string()).optional(),
      rounding: z
        .object({
          unit: z.enum(["none", "10", "100"]).optional(),
          mode: z.enum(["round", "ceil", "floor"]).optional(),
          target: z.enum(["payer", "owner"]).optional()
        })
        .optional()
    })
    .optional()
});

type ExpenseDoc = {
  id: string;
  groupId: string;
  locked: boolean;
  createdByUserId: string;
};

async function requireGroupExpense(expenseId: string): Promise<ExpenseDoc | null> {
  const query = await adminDb
    .collectionGroup("expenses")
    .where("id", "==", expenseId)
    .limit(1)
    .get();

  if (query.empty) {
    return null;
  }

  const doc = query.docs[0]!;
  const groupId = doc.ref.parent.parent?.id;
  if (!groupId) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    groupId,
    locked: Boolean(data.locked),
    createdByUserId: data.createdByUserId
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  const user = await requireAuth(request);

  const expenseSnap = await requireGroupExpense(params.expenseId);
  if (!expenseSnap) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await requireGroupEdit(user.id, expenseSnap.groupId);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const data = parsed.data;
  if (
    (data.splitType !== "equal" && data.splitType !== "select") ||
    data.splitMeta?.rounding ||
    data.splitMeta?.ratios ||
    data.splitMeta?.subgroup
  ) {
    const premium = await canUsePremium(user.id, expenseSnap.groupId);
    if (!premium) {
      return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
    }
  }
  const totalSplit = data.splits.reduce((sum, s) => sum + s.shareAmount, 0);
  if (totalSplit !== data.amount) {
    return NextResponse.json({ error: "SPLIT_MISMATCH" }, { status: 400 });
  }

  await groupExpensesRef(expenseSnap.groupId)
    .doc(expenseSnap.id)
    .update({
      payerUserId: data.payerUserId,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      category: data.category,
      memo: data.memo ?? null,
      splitType: data.splitType,
      splits: data.splits,
      splitMeta: data.splitMeta ?? null,
      updatedAt: nowIso()
    });

  await groupAuditRef(expenseSnap.groupId).add({
    actorUserId: user.id,
    action: "expense_update",
    payload: { expenseId: expenseSnap.id },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  const user = await requireAuth(request);
  const expenseSnap = await requireGroupExpense(params.expenseId);

  if (!expenseSnap) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const membership = await requireGroupEdit(user.id, expenseSnap.groupId);

  const isOwner = membership.role === "owner";
  const isCreator = expenseSnap.createdByUserId === user.id;

  if (!isOwner && !isCreator) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await groupExpensesRef(expenseSnap.groupId).doc(expenseSnap.id).delete();

  await groupAuditRef(expenseSnap.groupId).add({
    actorUserId: user.id,
    action: "expense_delete",
    payload: { expenseId: expenseSnap.id },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}
