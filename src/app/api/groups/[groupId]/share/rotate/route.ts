import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { requireGroupOwner } from "@/lib/rbac";
import { generateToken } from "@/lib/tokens";
import { nowIso } from "@/lib/firestore";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const newToken = generateToken(24);
  await adminDb.collection("groups").doc(params.groupId).update({
    shareToken: newToken,
    updatedAt: nowIso()
  });

  return NextResponse.json({ shareToken: newToken });
}
