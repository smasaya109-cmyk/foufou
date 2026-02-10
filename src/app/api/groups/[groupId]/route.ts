import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { canUsePremium, getUserPlan, requireGroupMember, requireGroupOwner } from "@/lib/rbac";
import { groupMembersRef } from "@/lib/firestore";
import { removeUserGroup } from "@/lib/user-groups";

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);
  const searchParams = new URL(request.url).searchParams;
  const include = searchParams.get("include") ?? "";

  const groupSnap = await adminDb.collection("groups").doc(params.groupId).get();
  if (!groupSnap.exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const membersSnap = await groupMembersRef(params.groupId).get();
  const members = membersSnap.docs.map((doc) => doc.data());
  const expenses =
    include.split(",").includes("expenses")
      ? await adminDb
          .collection("groups")
          .doc(params.groupId)
          .collection("expenses")
          .orderBy("date", "desc")
          .get()
          .then((snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      : undefined;
  const [userPlan, premiumAccess] = await Promise.all([
    getUserPlan(user.id),
    canUsePremium(user.id, params.groupId)
  ]);
  const entitlements = {
    plan: userPlan,
    canUsePremium: premiumAccess,
    canUsePhotos: userPlan === "premium",
    label: userPlan === "premium" ? "Premium" : premiumAccess ? "Pro" : "Free"
  };

  return NextResponse.json({
    group: { id: groupSnap.id, ...groupSnap.data(), members },
    entitlements,
    expenses
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const groupRef = adminDb.collection("groups").doc(params.groupId);
  const groupSnap = await groupRef.get();
  if (!groupSnap.exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const membersSnap = await groupMembersRef(params.groupId).get();
  const memberIds = membersSnap.docs.map((doc) => doc.data()?.userId).filter(Boolean) as string[];
  await Promise.all(memberIds.map((memberId) => removeUserGroup(memberId, params.groupId)));

  await adminDb.recursiveDelete(groupRef);

  return NextResponse.json({ ok: true });
}
