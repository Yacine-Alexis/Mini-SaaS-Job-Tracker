import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SettingsLayout, { SettingsCard } from "@/components/SettingsLayout";

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const resolvedParams = await searchParams;
  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });

  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  const isPro = user?.plan === "PRO";

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Success/Cancel Messages */}
        {resolvedParams.success && (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3">
            <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-700 dark:text-green-300">Payment successful! Your plan will update shortly.</span>
          </div>
        )}
        {resolvedParams.canceled && (
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 flex items-center gap-3">
            <svg className="h-5 w-5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Checkout was canceled.</span>
          </div>
        )}

        {/* Current Plan */}
        <SettingsCard title="Current Plan" description="Your subscription details">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              isPro 
                ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                : "bg-gradient-to-br from-zinc-400 to-zinc-500"
            }`}>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {isPro ? "Pro" : "Free"} Plan
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isPro 
                    ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800" 
                    : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}>
                  {isPro ? "Active" : "Current"}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isPro ? "You have access to all features" : "Upgrade to unlock more features"}
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Plan Comparison */}
        <SettingsCard title="Plans" description="Compare features and choose the right plan">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className={`rounded-xl border-2 p-5 ${!isPro ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-700"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Free</h3>
                {!isPro && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">$0<span className="text-sm font-normal text-zinc-500">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 200 applications
                </li>
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Notes & tasks
                </li>
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic dashboard
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  CSV export
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className={`rounded-xl border-2 p-5 ${isPro ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10" : "border-zinc-200 dark:border-zinc-700"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Pro</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">$9<span className="text-sm font-normal text-zinc-500">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited applications
                </li>
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Notes & tasks
                </li>
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  CSV export
                </li>
              </ul>
            </div>
          </div>

          {/* Upgrade Button */}
          {!isPro && (
            <div className="mt-6">
              {!stripeConfigured ? (
                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-700/50 p-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>Stripe is not configured. Set <code className="bg-zinc-200 dark:bg-zinc-600 px-1 py-0.5 rounded text-xs">STRIPE_SECRET_KEY</code> and <code className="bg-zinc-200 dark:bg-zinc-600 px-1 py-0.5 rounded text-xs">STRIPE_PRICE_ID</code> to enable billing.</p>
                </div>
              ) : (
                <form action="/api/billing/create-checkout-session" method="post">
                  <button 
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                  >
                    Upgrade to Pro
                  </button>
                </form>
              )}
            </div>
          )}
        </SettingsCard>
      </div>
    </SettingsLayout>
  );
}
