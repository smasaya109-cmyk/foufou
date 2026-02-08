import { NextResponse } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { canUsePremium, requireGroupOwner } from "@/lib/rbac";
import { nowIso } from "@/lib/firestore";

const schema = z.object({
  title: z.string().min(1).max(80).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
  icon: z.string().max(10).optional(),
  status: z.enum(["active", "archived"]).optional()
});

export async function PATCH(
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

  const data = parsed.data;
  const updatePayload: Record<string, unknown> = { updatedAt: nowIso() };

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
  if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
  if (data.memo !== undefined) updatePayload.memo = data.memo;
  if (data.icon !== undefined) updatePayload.icon = data.icon;
  if (data.status !== undefined) {
    if (data.status === "archived" || data.status === "active") {
      const premium = await canUsePremium(user.id, params.groupId);
      if (!premium) {
        return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
      }
    }
    updatePayload.status = data.status;
  }

  await adminDb.collection("groups").doc(params.groupId).update(updatePayload);

  return NextResponse.json({ ok: true });
}
