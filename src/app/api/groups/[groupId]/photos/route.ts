import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { getUserPlan, requireGroupMember } from "@/lib/rbac";
import { nowIso } from "@/lib/firestore";

const schema = z.object({
  url: z.string().url(),
  name: z.string().max(200).optional()
});

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);
  const plan = await getUserPlan(user.id);
  if (plan !== "premium") {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const snap = await adminDb
    .collection("groups")
    .doc(params.groupId)
    .collection("photos")
    .orderBy("createdAt", "desc")
    .get();
  const photos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ photos });
}

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);
  const plan = await getUserPlan(user.id);
  if (plan !== "premium") {
    return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const ref = adminDb.collection("groups").doc(params.groupId).collection("photos").doc();
  await ref.set({
    id: ref.id,
    url: parsed.data.url,
    name: parsed.data.name ?? null,
    createdAt: nowIso(),
    uploadedBy: user.id
  });

  return NextResponse.json({ id: ref.id });
}
