import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function BillingPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });

  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

  return (
    <div className="max-w-xl space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-xl font-semibold">Billing</h1>
        <div className="text-sm text-zinc-600">Current plan: <span className="badge">{user?.plan ?? "FREE"}</span></div>

        {searchParams.success && (
          <div className="text-sm text-green-700">Payment successful. Your plan will update shortly.</div>
        )}
        {searchParams.canceled && (
          <div className="text-sm text-zinc-700">Checkout canceled.</div>
        )}

        {!stripeConfigured ? (
          <div className="text-sm text-zinc-600">
            Stripe not configured. Set STRIPE_SECRET_KEY + STRIPE_PRICE_ID to enable.
          </div>
        ) : (
          <form action="/api/billing/create-checkout-session" method="post">
            <button className="btn btn-primary" type="submit">
              Upgrade to Pro
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
