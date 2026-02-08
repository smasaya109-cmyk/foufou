import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await requireAuth(request);
  const snap = await adminDb
    .collection("users")
    .doc(user.id)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(30)
    .get();

  const notifications = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ notifications });
}
