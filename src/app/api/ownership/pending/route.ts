import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  let query = adminDb.collectionGroup("ownershipTransfers").where("toUserId", "==", user.id);
  if (groupId) {
    query = query.where("groupId", "==", groupId);
  }

  const transferSnap = await query.where("status", "==", "pending").get();
  const transfers = await Promise.all(
    transferSnap.docs.map(async (doc) => {
      const data = doc.data();
      const fromUserId = data.fromUserId as string;
      const fromUserSnap = await adminDb.collection("users").doc(fromUserId).get();
      const fromUser = fromUserSnap.data();
      return {
        id: doc.id,
        groupId: data.groupId,
        fromUserName: fromUser?.name ?? fromUser?.email ?? "Owner"
      };
    })
  );

  return NextResponse.json({ transfers });
}
