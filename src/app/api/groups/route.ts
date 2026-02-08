import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { generateToken } from "@/lib/tokens";
import { groupMembersRef, nowIso } from "@/lib/firestore";
import { getUserPlan } from "@/lib/rbac";
import { addUserGroup } from "@/lib/user-groups";

const createSchema = z.object({
  title: z.string().min(1).max(80),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  memo: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  currency: z.string().min(3).max(3).optional(),
  myName: z.string().min(1).max(40).optional(),
  participants: z.array(z.string().min(1).max(40)).optional()
});

export async function GET(request: Request) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (err: any) {
    const message = err?.message ?? "UNAUTHORIZED";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  try {
    const memberSnaps = await adminDb
      .collectionGroup("members")
      .where("userId", "==", user.id)
      .get();

    const groupIds = memberSnaps.docs
      .map((doc) => doc.ref.parent.parent?.id)
      .filter(Boolean) as string[];

    if (!groupIds.length) {
      const plan = await getUserPlan(user.id);
      return NextResponse.json({ groups: [], plan });
    }

    const roleByGroupId = new Map(
      memberSnaps.docs.map((doc) => [doc.ref.parent.parent?.id, doc.data()?.role])
    );

    const groupDocs = await Promise.all(
      groupIds.map((id) => adminDb.collection("groups").doc(id).get())
    );
    const memberCounts = await Promise.all(
      groupIds.map((id) => groupMembersRef(id).get().then((snap) => snap.size))
    );
    const plan = await getUserPlan(user.id);

    const groups = groupDocs
      .map((snap, index) =>
        snap.exists
          ? {
              id: snap.id,
              ...snap.data(),
              membersCount: memberCounts[index],
              role: roleByGroupId.get(snap.id) ?? null
            }
          : null
      )
      .filter(Boolean);

    return NextResponse.json({ groups, plan });
  } catch (err: any) {
    if (String(err?.message ?? "").includes("FAILED_PRECONDITION")) {
      const userSnap = await adminDb.collection("users").doc(user.id).get();
      const groupIds = (userSnap.data()?.groupIds ?? []) as string[];
      if (!groupIds.length) {
        const plan = await getUserPlan(user.id);
        return NextResponse.json({ groups: [], plan });
      }
      const roleSnaps = await Promise.all(
        groupIds.map((id) => groupMembersRef(id).doc(user.id).get())
      );
      const roleByGroupId = new Map(
        roleSnaps.map((snap, index) => [groupIds[index], snap.data()?.role])
      );
      const groupDocs = await Promise.all(
        groupIds.map((id) => adminDb.collection("groups").doc(id).get())
      );
      const memberCounts = await Promise.all(
        groupIds.map((id) => groupMembersRef(id).get().then((snap) => snap.size))
      );
      const plan = await getUserPlan(user.id);
      const groups = groupDocs
        .map((snap, index) =>
          snap.exists
            ? {
                id: snap.id,
                ...snap.data(),
                membersCount: memberCounts[index],
                role: roleByGroupId.get(snap.id) ?? null
              }
            : null
        )
        .filter(Boolean);
      return NextResponse.json({ groups, plan });
    }
    console.error("GET /api/groups failed", err);
    return NextResponse.json({ error: err?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (err: any) {
    const message = err?.message ?? "UNAUTHORIZED";
    return NextResponse.json({ error: message }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const activeCountSnap = await adminDb
    .collection("groups")
    .where("ownerUserId", "==", user.id)
    .where("status", "==", "active")
    .get();

  if (activeCountSnap.size >= 2) {
    return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
  }

  const { title, startDate, endDate, memo, icon, currency, participants, myName } = parsed.data;
  const groupRef = adminDb.collection("groups").doc();
  const now = nowIso();

  await groupRef.set({
    ownerUserId: user.id,
    title,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    memo: memo ?? null,
    icon: icon ?? "🧳",
    currency: currency ?? "JPY",
    status: "active",
    shareToken: generateToken(24),
    createdAt: now,
    updatedAt: now
  });

  await groupMembersRef(groupRef.id).doc(user.id).set({
    userId: user.id,
    role: "owner",
    joinedAt: now,
    invitedBy: null,
    name: myName?.trim() || null
  });

  if (participants && participants.length) {
    await Promise.all(
      participants.map((name) => {
        const localId = `local_${Math.random().toString(36).slice(2, 9)}`;
        return groupMembersRef(groupRef.id).doc(localId).set({
          userId: localId,
          role: "local",
          name,
          joinedAt: now,
          invitedBy: user.id,
          local: true
        });
      })
    );
  }

  await addUserGroup(user.id, groupRef.id);

  return NextResponse.json({ id: groupRef.id });
}
