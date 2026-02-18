import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-40 -right-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-40 left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">JobTracker Pro</span>
          </div>

          {/* Main content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Land your dream job with organized tracking
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Stop losing track of applications. Stay organized, follow up on time, and increase your chances of success.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <Feature 
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} 
                text="Visual pipeline to track every stage" 
              />
              <Feature 
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} 
                text="Never miss a follow-up with task reminders" 
              />
              <Feature 
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} 
                text="Insights to improve your job search" 
              />
              <Feature 
                icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>} 
                text="Beautiful dark mode for late-night sessions" 
              />
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["bg-amber-400", "bg-green-400", "bg-pink-400", "bg-blue-400"].map((color, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full ${color} border-2 border-white/20 flex items-center justify-center text-xs font-medium text-white/90`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/70">
              Trusted by <span className="text-white font-semibold">2,000+</span> job seekers
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 bg-white dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">JobTracker Pro</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          </div>

          {/* Form content */}
          {children}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
            By continuing, you agree to our{" "}
            <Link href="#" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">Terms of Service</Link>
            {" "}and{" "}
            <Link href="#" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-white">{icon}</div>
      <span className="text-white/90">{text}</span>
    </div>
  );
}
