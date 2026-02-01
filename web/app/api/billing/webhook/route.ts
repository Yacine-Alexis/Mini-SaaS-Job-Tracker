import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    console.error("[Stripe Webhook] Missing Stripe configuration (STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)");
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Minimal subscription -> PRO toggle
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string | undefined;

    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "PRO",
          stripeSubscriptionId: subscriptionId ?? null,
          planUpdatedAt: new Date()
        }
      });
      await audit(req, user.id, AuditAction.BILLING_UPGRADED, { meta: { from: "FREE", to: "PRO" } });
      console.log(`[Stripe Webhook] User ${user.id} upgraded to PRO`);
    } else {
      console.warn(`[Stripe Webhook] No user found for customer: ${customerId}`);
    }
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const customerId = sub.customer as string;

    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "FREE",
          stripeSubscriptionId: null,
          planUpdatedAt: new Date()
        }
      });
      await audit(req, user.id, AuditAction.BILLING_DOWNGRADED, { meta: { from: "PRO", to: "FREE" } });
      console.log(`[Stripe Webhook] User ${user.id} downgraded to FREE`);
    } else {
      console.warn(`[Stripe Webhook] No user found for customer: ${customerId}`);
    }
  }


  // You should also handle subscription canceled/paused events in a real app.
  return NextResponse.json({ received: true });
}
