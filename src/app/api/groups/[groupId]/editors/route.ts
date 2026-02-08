import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { getUserPlan, requireGroupOwner, isOwnerPaid } from "@/lib/rbac";
import { groupEditorsRef, groupMembersRef, groupAuditRef, nowIso } from "@/lib/firestore";
import { addUserGroup } from "@/lib/user-groups";

const addSchema = z.object({
  email: z.string().email()
});

const removeSchema = z.object({
  userId: z.string().min(1)
});

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const editorsSnap = await groupEditorsRef(params.groupId).get();
  const editorIds = editorsSnap.docs.map((doc) => doc.id);

  if (!editorIds.length) {
    return NextResponse.json({ editors: [] });
  }

  const users = await Promise.all(
    editorIds.map((id) => adminDb.collection("users").doc(id).get())
  );
  const members = await Promise.all(
    editorIds.map((id) => groupMembersRef(params.groupId).doc(id).get())
  );

  const editors = editorIds.map((id, index) => {
    const userSnap = users[index];
    const memberSnap = members[index];
    const userData = userSnap.data();
    const memberData = memberSnap.data();
    return {
      userId: id,
      name: memberData?.name ?? userData?.name ?? userData?.email ?? "—",
      email: userData?.email ?? null
    };
  });

  return NextResponse.json({ editors });
}

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const ownerPaid = await isOwnerPaid(params.groupId);
  if (!ownerPaid) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const userQuery = await adminDb
    .collection("users")
    .where("email", "==", parsed.data.email)
    .limit(1)
    .get();

  if (userQuery.empty) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const targetUser = userQuery.docs[0]!;
  const targetId = targetUser.id;

  const ownerPlan = await getUserPlan(user.id);
  if (ownerPlan === "pro") {
    const editorsSnap = await groupEditorsRef(params.groupId).get();
    const currentEditors = editorsSnap.size;
    if (currentEditors >= 2) {
      return NextResponse.json({ error: "EDITOR_LIMIT" }, { status: 403 });
    }
  }

  await groupEditorsRef(params.groupId).doc(targetId).set({
    userId: targetId,
    addedBy: user.id,
    createdAt: nowIso()
  });

  const memberRef = groupMembersRef(params.groupId).doc(targetId);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    await memberRef.set({
      userId: targetId,
      role: "member",
      name: targetUser.data()?.name ?? null,
      joinedAt: nowIso(),
      invitedBy: user.id
    });
    await addUserGroup(targetId, params.groupId);
  }

  await groupAuditRef(params.groupId).add({
    actorUserId: user.id,
    action: "editor_add",
    payload: { targetUserId: targetId },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true, userId: targetId });
}

export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const ownerPaid = await isOwnerPaid(params.groupId);
  if (!ownerPaid) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await groupEditorsRef(params.groupId).doc(parsed.data.userId).delete();

  await groupAuditRef(params.groupId).add({
    actorUserId: user.id,
    action: "editor_remove",
    payload: { targetUserId: parsed.data.userId },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}
