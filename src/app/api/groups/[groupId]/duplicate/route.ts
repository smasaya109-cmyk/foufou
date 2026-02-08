import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { canUsePremium, requireGroupOwner } from "@/lib/rbac";
import { generateToken } from "@/lib/tokens";
import { groupMembersRef, nowIso } from "@/lib/firestore";
import { addUserGroup } from "@/lib/user-groups";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);
  const premium = await canUsePremium(user.id, params.groupId);
  if (!premium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const groupSnap = await adminDb.collection("groups").doc(params.groupId).get();
  if (!groupSnap.exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const data = groupSnap.data() as any;
  const now = nowIso();
  const newGroupRef = adminDb.collection("groups").doc();
  const title = data.title ? `${data.title} (copy)` : "Untitled (copy)";

  await newGroupRef.set({
    ownerUserId: user.id,
    title,
    startDate: null,
    endDate: null,
    memo: data.memo ?? null,
    icon: data.icon ?? "🧳",
    currency: data.currency ?? "JPY",
    status: "active",
    shareToken: generateToken(24),
    createdAt: now,
    updatedAt: now
  });

  await groupMembersRef(newGroupRef.id).doc(user.id).set({
    userId: user.id,
    name: data?.ownerName ?? null,
    joinedAt: now,
    role: "owner"
  });

  await addUserGroup(user.id, newGroupRef.id);

  return NextResponse.json({ id: newGroupRef.id });
}
