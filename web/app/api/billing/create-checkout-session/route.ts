import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { withStripeRetry } from "@/lib/retry";

export async function POST(req: NextRequest) {
  // Rate limit: 5 checkout attempts per minute per IP
  const rl = await enforceRateLimitAsync(req, "billing:checkout", 5, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!stripe || !priceId) return jsonError(400, "NOT_CONFIGURED", "Stripe is not configured.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "NOT_FOUND", "User not found");

  // Retrieve or create Stripe customer with retry
  const customer = user.stripeCustomerId
    ? await withStripeRetry(
        () => stripe.customers.retrieve(user.stripeCustomerId!),
        "retrieve-customer"
      )
    : await withStripeRetry(
        () => stripe.customers.create({ email: user.email }),
        "create-customer"
      );

  const customerId = (customer as { id: string }).id;

  if (!user.stripeCustomerId) {
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  // Create checkout session with retry
  const session = await withStripeRetry(
    () => stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings/billing?success=1`,
      cancel_url: `${baseUrl}/settings/billing?canceled=1`
    }),
    "create-checkout-session"
  );

  return NextResponse.json({ url: session.url });
}
