"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LandingHeader from "./LandingHeader";
import AuthModal from "./AuthModal";

// Feature icons as SVG components
const FeatureIcons = {
  pipeline: (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  notes: (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  tasks: (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  tags: (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  analytics: (
    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

const features = [
  {
    icon: FeatureIcons.pipeline,
    title: "Visual Pipeline",
    description: "Track every application through stages: Saved, Applied, Interview, Offer, or Rejected. See your progress at a glance."
  },
  {
    icon: FeatureIcons.notes,
    title: "Notes & Contacts",
    description: "Keep detailed notes, save recruiter contacts, and never forget important details about each opportunity."
  },
  {
    icon: FeatureIcons.tasks,
    title: "Task Management",
    description: "Set reminders for follow-ups, interviews, and deadlines. Never miss an important date."
  },
  {
    icon: FeatureIcons.calendar,
    title: "Interview Calendar",
    description: "Visualize all your scheduled interviews in a clean calendar view. Stay organized and prepared."
  },
  {
    icon: FeatureIcons.tags,
    title: "Tags & Labels",
    description: "Organize applications with custom tags like 'Remote', 'Startup', or 'Dream Job'. Filter and find fast."
  },
  {
    icon: FeatureIcons.analytics,
    title: "Analytics Dashboard",
    description: "Track your success rates, response times, and identify patterns to improve your job search."
  },
];

const steps = [
  {
    step: "1",
    title: "Add Applications",
    description: "Quickly add job applications with company details, job title, and posting URL.",
  },
  {
    step: "2",
    title: "Track Progress",
    description: "Move applications through your pipeline as you progress through interviews.",
  },
  {
    step: "3",
    title: "Stay Organized",
    description: "Add notes, set reminders, and keep all your job search info in one place.",
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "login" | "register" }>({
    open: false,
    mode: "login"
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // If authenticated, don't render (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <LandingHeader
        onLoginClick={() => setAuthModal({ open: true, mode: "login" })}
        onSignupClick={() => setAuthModal({ open: true, mode: "register" })}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Free to use • No credit card required
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white leading-tight">
              Land your dream job with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                organized tracking
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Stop losing track of applications. JobTracker Pro helps you stay organized, 
              follow up on time, and increase your chances of landing that perfect role.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAuthModal({ open: true, mode: "register" })}
                className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105"
              >
                Start Tracking Free
              </button>
              <a
                href="#features"
                className="px-8 py-4 text-base font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                See How It Works
              </a>
            </div>

            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
              Trusted by <span className="font-semibold text-zinc-700 dark:text-zinc-300">2,000+</span> job seekers worldwide
            </p>
          </div>

          {/* App Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent z-10 h-32 bottom-0 top-auto pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 border-b border-zinc-300 dark:border-zinc-600">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full max-w-md mx-auto px-4 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                    app.jobtracker.pro
                  </div>
                </div>
              </div>
              
              {/* App screenshot mockup */}
              <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900">
                {/* Dashboard mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Stats row */}
                  <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Applications", value: "47", color: "text-blue-600" },
                      { label: "Interviews", value: "12", color: "text-green-600" },
                      { label: "Offers", value: "3", color: "text-purple-600" },
                      { label: "Response Rate", value: "34%", color: "text-amber-600" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline columns */}
                  <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { stage: "Saved", count: 8, color: "bg-zinc-500" },
                      { stage: "Applied", count: 15, color: "bg-blue-500" },
                      { stage: "Interview", count: 12, color: "bg-amber-500" },
                      { stage: "Offer", count: 3, color: "bg-green-500" },
                      { stage: "Rejected", count: 9, color: "bg-red-500" },
                    ].map((col) => (
                      <div key={col.stage} className="bg-white dark:bg-zinc-800 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full ${col.color}`} />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{col.stage}</span>
                          <span className="ml-auto text-xs text-zinc-400">{col.count}</span>
                        </div>
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="p-2 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-600 rounded w-3/4 mb-1" />
                              <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded w-1/2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ace your job search
              </span>
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Powerful features designed to keep you organized and ahead of the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Get started in{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Start tracking your applications in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-transparent -translate-x-1/2" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/25 mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Simple,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                transparent pricing
              </span>
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Start free, upgrade when you need more power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-700">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-white">$0</span>
                <span className="text-zinc-500 dark:text-zinc-400">/month</span>
              </div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Perfect for getting started with your job search.
              </p>
              <ul className="mt-6 space-y-3">
                {["Up to 200 applications", "Visual pipeline", "Notes & tasks", "Tags & labels", "Dark mode"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setAuthModal({ open: true, mode: "register" })}
                className="w-full mt-8 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                Popular
              </div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-white/70">/month</span>
              </div>
              <p className="mt-4 text-white/80">
                For serious job seekers who want every advantage.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited applications",
                  "CSV export & import",
                  "Advanced analytics",
                  "Interview calendar",
                  "Salary tracking",
                  "Priority support"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/90">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setAuthModal({ open: true, mode: "register" })}
                className="w-full mt-8 py-3 text-sm font-semibold text-blue-600 bg-white rounded-xl hover:bg-zinc-100 transition-colors"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
            Ready to organize your job search?
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Join thousands of job seekers who landed their dream roles with JobTracker Pro.
          </p>
          <button
            onClick={() => setAuthModal({ open: true, mode: "register" })}
            className="mt-8 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105"
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-zinc-900 dark:text-white">JobTracker Pro</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              © {new Date().getFullYear()} JobTracker Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        onClose={() => setAuthModal({ ...authModal, open: false })}
        mode={authModal.mode}
        onSwitchMode={() => setAuthModal({ 
          open: true, 
          mode: authModal.mode === "login" ? "register" : "login" 
        })}
      />
    </div>
  );
}
