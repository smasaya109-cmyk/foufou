import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { nowIso } from "@/lib/firestore";

const schema = z.object({
  plan: z.enum(["pro", "premium", "other"]),
  usagePeriod: z.string().min(1),
  reason: z.string().optional()
});

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await adminDb.collection("cancelFeedback").add({
    userId: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    plan: parsed.data.plan,
    usagePeriod: parsed.data.usagePeriod,
    reason: parsed.data.reason ?? null,
    createdAt: nowIso()
  });

  return NextResponse.json({ ok: true });
}
