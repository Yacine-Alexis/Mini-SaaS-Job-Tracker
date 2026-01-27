import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) return NextResponse.json({ ok: false }, { status: 400 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false }, { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

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
    }
  }


  // You should also handle subscription canceled/paused events in a real app.
  return NextResponse.json({ received: true });
}
