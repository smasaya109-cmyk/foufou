import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const userSnap = await adminDb.collection("users").doc(user.id).get();
  let stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined;

  if (!stripeCustomerId) {
    const email = user.email ?? undefined;
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: user.id }
    });
    stripeCustomerId = customer.id;
    await adminDb.collection("users").doc(user.id).set(
      { stripeCustomerId },
      { merge: true }
    );
  }

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/app/billing`
  });

  return NextResponse.json({ url: session.url });
}
