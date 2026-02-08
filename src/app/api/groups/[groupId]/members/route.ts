import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { requireGroupMember, requireGroupOwner } from "@/lib/rbac";
import { groupMembersRef, groupAuditRef, nowIso } from "@/lib/firestore";
import { removeUserGroup } from "@/lib/user-groups";

const updateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(40).optional()
});

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);

  const membersSnap = await groupMembersRef(params.groupId).get();
  const members = membersSnap.docs.map((doc) => doc.data());

  return NextResponse.json({ members });
}

export async function PATCH(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const memberRef = groupMembersRef(params.groupId).doc(parsed.data.userId);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) {
    updatePayload.name = parsed.data.name;
  }

  if (!Object.keys(updatePayload).length) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await memberRef.update(updatePayload);

  await groupAuditRef(params.groupId).add({
    actorUserId: user.id,
    action: "member_rename",
    payload: { targetUserId: parsed.data.userId, name: parsed.data.name },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const body = await request.json().catch(() => null);
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const memberRef = groupMembersRef(params.groupId).doc(parsed.data.userId);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const groupSnap = await adminDb.collection("groups").doc(params.groupId).get();
  if (groupSnap.exists && groupSnap.data()?.ownerUserId === parsed.data.userId) {
    return NextResponse.json({ error: "CANNOT_REMOVE_OWNER" }, { status: 400 });
  }

  await memberRef.delete();

  if (!String(parsed.data.userId).startsWith("local_")) {
    await removeUserGroup(parsed.data.userId, params.groupId);
  }

  await groupAuditRef(params.groupId).add({
    actorUserId: user.id,
    action: "member_remove",
    payload: { targetUserId: parsed.data.userId },
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}
