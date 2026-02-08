import { NextResponse } from "next/server";
import Stripe from "stripe";

import { adminDb } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";
import { groupPassesRef, nowIso } from "@/lib/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function calcGroupPassExpiry() {
  return "9999-12-31T00:00:00.000Z";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};
      const skuType = metadata.sku_type ?? "";

      if (skuType.startsWith("group_pass")) {
        const groupId = metadata.group_id;
        if (groupId) {
          const passCollection = groupPassesRef(groupId);
          const existing = await passCollection
            .where("stripeCheckoutSessionId", "==", session.id)
            .limit(1)
            .get();

          if (existing.empty) {
            await passCollection.add({
              groupId,
              type: "lifetime",
              active: true,
              startedAt: nowIso(),
              expiresAt: calcGroupPassExpiry(),
              purchaseProvider: "stripe",
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: session.payment_intent?.toString() ?? null
            });
          }
        }
      }

      if (session.mode === "subscription") {
        const userId = metadata.user_id;
        const planTier = metadata.plan_tier ?? "pro";
        const subscriptionId = session.subscription?.toString();
        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await adminDb.collection("users").doc(userId).set(
            {
              proStatus: subscription.status === "active" ? "active" : "inactive",
              proPlan: planTier,
              proExpiresAt: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null
            },
            { merge: true }
          );
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const metadata = subscription.metadata ?? {};
      const userId = metadata.user_id;
      const planTier = metadata.plan_tier ?? "pro";
      if (userId) {
        await adminDb.collection("users").doc(userId).set(
          {
            proStatus: subscription.status === "active" ? "active" : "inactive",
            proPlan: planTier,
            proExpiresAt: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null
          },
          { merge: true }
        );
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
