import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { requireGroupMember } from "@/lib/rbac";
import { groupSettlementsRef } from "@/lib/firestore";

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupMember(user.id, params.groupId);

  const latestSnap = await groupSettlementsRef(params.groupId)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  if (latestSnap.empty) {
    return NextResponse.json({ settlement: null });
  }

  const latestDoc = latestSnap.docs[0]!;
  return NextResponse.json({ settlement: { id: latestDoc.id, ...latestDoc.data() } });
}
