import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"]).default("monthly")
});

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const priceId =
    parsed.data.plan === "yearly"
      ? process.env.STRIPE_PRICE_PRO_YEARLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (!priceId) {
    return NextResponse.json({ error: "PRICE_NOT_CONFIGURED" }, { status: 500 });
  }

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const userSnap = await adminDb.collection("users").doc(user.id).get();
  const stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/billing?success=1`,
    cancel_url: `${baseUrl}/app/subscription?canceled=1`,
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : user.email ?? undefined,
    metadata: {
      user_id: user.id,
      sku_type: parsed.data.plan === "yearly" ? "pro_yearly" : "pro_monthly",
      plan_tier: "pro"
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        sku_type: parsed.data.plan === "yearly" ? "pro_yearly" : "pro_monthly",
        plan_tier: "pro"
      }
    }
  });

  return NextResponse.json({ url: session.url });
}
