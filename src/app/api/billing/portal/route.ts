import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const userSnap = await adminDb.collection("users").doc(user.id).get();
  const stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined;

  if (!stripeCustomerId) {
    return NextResponse.json({ error: "NO_CUSTOMER" }, { status: 400 });
  }

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/app/billing`
  });

  return NextResponse.json({ url: session.url });
}
