import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { requireGroupOwner } from "@/lib/rbac";
import { groupMembersRef, nowIso } from "@/lib/firestore";

const schema = z.object({
  name: z.string().min(1).max(40)
});

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const user = await requireAuth(request);
  await requireGroupOwner(user.id, params.groupId);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const localId = `local_${Date.now().toString(36)}`;
  await groupMembersRef(params.groupId).doc(localId).set({
    userId: localId,
    role: "local",
    name: parsed.data.name,
    joinedAt: nowIso(),
    invitedBy: user.id,
    local: true
  });

  return NextResponse.json({ id: localId });
}
