import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { canUsePremium, requireGroupEdit, requireGroupMember } from "@/lib/rbac";
import { groupExpensesRef, groupAuditRef, groupMembersRef, nowIso } from "@/lib/firestore";

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

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupEdit(user.id, params.groupId);

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
    const premium = await canUsePremium(user.id, params.groupId);
    if (!premium) {
      return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
    }
  }
  const totalSplit = data.splits.reduce((sum, s) => sum + s.shareAmount, 0);
  if (totalSplit !== data.amount) {
    return NextResponse.json({ error: "SPLIT_MISMATCH" }, { status: 400 });
  }

  const expenseRef = groupExpensesRef(params.groupId).doc();
  const now = nowIso();

  await expenseRef.set({
    id: expenseRef.id,
    groupId: params.groupId,
    payerUserId: data.payerUserId,
    amount: data.amount,
    currency: data.currency,
    date: data.date,
    category: data.category,
    memo: data.memo ?? null,
    splitType: data.splitType,
    splits: data.splits,
    splitMeta: data.splitMeta ?? null,
    createdByUserId: user.id,
    createdAt: now,
    updatedAt: now,
    locked: false
  });

  await groupAuditRef(params.groupId).add({
    actorUserId: user.id,
    action: "expense_create",
    payload: { expenseId: expenseRef.id },
    createdAt: now
  });

  if (await canUsePremium(user.id, params.groupId)) {
    const membersSnap = await groupMembersRef(params.groupId).get();
    const notiWrites: Promise<any>[] = [];
    membersSnap.docs.forEach((doc) => {
      const member = doc.data();
      const targetId = member.userId;
      if (!targetId || targetId === user.id) return;
      if (String(targetId).startsWith("local_")) return;
      notiWrites.push(
        adminDb
          .collection("users")
          .doc(targetId)
          .collection("notifications")
          .add({
            type: "expense_created",
            groupId: params.groupId,
            expenseId: expenseRef.id,
            title: data.memo ?? "Expense added",
            createdAt: now,
            read: false
          })
      );
    });
    await Promise.all(notiWrites);
  }

  return NextResponse.json({ id: expenseRef.id });
}

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);

  const expensesSnap = await groupExpensesRef(params.groupId).orderBy("date", "desc").get();
  const expenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ expenses });
}
