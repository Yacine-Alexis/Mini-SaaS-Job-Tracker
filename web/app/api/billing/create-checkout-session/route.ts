import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";

export async function POST(_req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!stripe || !priceId) return jsonError(400, "NOT_CONFIGURED", "Stripe is not configured.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "NOT_FOUND", "User not found");

  const customer =
    user.stripeCustomerId
      ? await stripe.customers.retrieve(user.stripeCustomerId)
      : await stripe.customers.create({ email: user.email });

  const customerId = (customer as any).id as string;

  if (!user.stripeCustomerId) {
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings/billing?success=1`,
    cancel_url: `${baseUrl}/settings/billing?canceled=1`
  });

  return NextResponse.json({ url: session.url });
}
