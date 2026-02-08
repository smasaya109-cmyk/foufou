import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { groupMembersRef, groupSettlementsRef } from "@/lib/firestore";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const groupQuery = await adminDb
    .collection("groups")
    .where("shareToken", "==", params.token)
    .limit(1)
    .get();

  if (groupQuery.empty) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const groupDoc = groupQuery.docs[0]!;
  const group = groupDoc.data();

  const membersSnap = await groupMembersRef(groupDoc.id).get();
  const members = membersSnap.docs.map((doc) => ({
    userId: doc.id,
    name: doc.data().name ?? null
  }));

  const settlementSnap = await groupSettlementsRef(groupDoc.id)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const settlement = settlementSnap.empty ? null : settlementSnap.docs[0]!.data();
  const payload = settlement?.payloadJson as
    | { transfers?: Array<{ fromUserId: string; toUserId: string; amount: number }> }
    | undefined;

  const nameMap = new Map(members.map((member) => [member.userId, member.name ?? "Member"]));
  const transfers = (payload?.transfers ?? []).map((transfer) => ({
    fromName: nameMap.get(transfer.fromUserId) ?? "Member",
    toName: nameMap.get(transfer.toUserId) ?? "Member",
    amount: transfer.amount
  }));

  return NextResponse.json({
    group: {
      title: group.title ?? "",
      currency: group.currency ?? "JPY"
    },
    members,
    transfers
  });
}
