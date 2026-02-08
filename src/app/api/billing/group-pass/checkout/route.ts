import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { requireGroupOwner } from "@/lib/rbac";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  groupId: z.string().min(1)
});

export async function POST(request: Request) {
  const user = await requireAuth(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await requireGroupOwner(user.id, parsed.data.groupId);

  const priceId = process.env.STRIPE_PRICE_GROUP_PASS;
  if (!priceId) {
    return NextResponse.json({ error: "PRICE_NOT_CONFIGURED" }, { status: 500 });
  }

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/groups/${parsed.data.groupId}/settings?pass=success`,
    cancel_url: `${baseUrl}/app/groups/${parsed.data.groupId}/settings?pass=cancel`,
    metadata: {
      user_id: user.id,
      group_id: parsed.data.groupId,
      sku_type: "group_pass"
    }
  });

  return NextResponse.json({ url: session.url });
}
