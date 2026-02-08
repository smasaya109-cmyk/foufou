import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const user = await requireAuth(request);
  const body = await request.json();
  const plan = String(body?.plan ?? "free");
  const userRef = adminDb.collection("users").doc(user.id);

  if (plan === "free") {
    await userRef.set(
      {
        proStatus: "inactive",
        proPlan: null,
        proExpiresAt: null
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  if (plan === "pro" || plan === "premium") {
    await userRef.set(
      {
        proStatus: "active",
        proPlan: plan,
        proExpiresAt: "2099-12-31T00:00:00.000Z"
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
}
