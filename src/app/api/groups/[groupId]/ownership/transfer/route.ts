import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { requireGroupOwner } from "@/lib/rbac";
import { groupEditorsRef, groupTransfersRef, nowIso } from "@/lib/firestore";

const schema = z.object({
  toUserId: z.string().min(1)
});

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const targetSnap = await groupEditorsRef(params.groupId).doc(parsed.data.toUserId).get();
  if (!targetSnap.exists) {
    return NextResponse.json({ error: "TARGET_NOT_EDITOR" }, { status: 400 });
  }

  const transfersSnap = await groupTransfersRef(params.groupId)
    .where("status", "==", "pending")
    .get();

  await Promise.all(transfersSnap.docs.map((doc) => doc.ref.update({ status: "canceled" })));

  const transferRef = groupTransfersRef(params.groupId).doc();
  await transferRef.set({
    id: transferRef.id,
    groupId: params.groupId,
    fromUserId: user.id,
    toUserId: parsed.data.toUserId,
    status: "pending",
    createdAt: nowIso(),
    acceptedAt: null
  });

  return NextResponse.json({ id: transferRef.id });
}
