import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";
import { logger, getRequestId } from "@/lib/logger";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    logger.error("Missing Stripe configuration", { requestId, error: "STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set" });
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    logger.error("Missing stripe-signature header", { requestId });
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Stripe signature verification failed", { requestId, error: message });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  logger.info("Stripe webhook received", { requestId, eventType: event.type, eventId: event.id });

  // Minimal subscription -> PRO toggle
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string | null;

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
      logger.info("User upgraded to PRO", { requestId, userId: user.id });
    } else {
      logger.warn("No user found for customer", { requestId, customerId });
    }
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
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
      logger.info("User downgraded to FREE", { requestId, userId: user.id });
    } else {
      logger.warn("No user found for customer", { requestId, customerId });
    }
  }


  // You should also handle subscription canceled/paused events in a real app.
  return NextResponse.json({ received: true });
}
