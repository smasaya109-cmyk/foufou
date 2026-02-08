import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { groupEditorsRef, groupMembersRef, groupTransfersRef, groupAuditRef, nowIso } from "@/lib/firestore";

const schema = z.object({
  transferId: z.string().min(1)
});

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const transferQuery = await adminDb
    .collectionGroup("ownershipTransfers")
    .where("id", "==", parsed.data.transferId)
    .limit(1)
    .get();

  if (transferQuery.empty) {
    return NextResponse.json({ error: "INVALID_TRANSFER" }, { status: 404 });
  }

  const transferDoc = transferQuery.docs[0]!;
  const transfer = transferDoc.data();
  const groupId = transferDoc.ref.parent.parent?.id;

  if (!groupId) {
    return NextResponse.json({ error: "INVALID_TRANSFER" }, { status: 404 });
  }

  if (transfer.status !== "pending") {
    return NextResponse.json({ error: "INVALID_TRANSFER" }, { status: 404 });
  }

  if (transfer.toUserId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await adminDb.collection("groups").doc(groupId).update({ ownerUserId: user.id });

  await groupEditorsRef(groupId).doc(transfer.fromUserId).set({
    userId: transfer.fromUserId,
    addedBy: user.id,
    createdAt: nowIso()
  });
  await groupEditorsRef(groupId).doc(transfer.toUserId).delete();

  await transferDoc.ref.update({ status: "accepted", acceptedAt: nowIso() });

  await groupAuditRef(groupId).add({
    actorUserId: user.id,
    action: "ownership_transfer",
    payload: { transferId: transfer.id },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}
