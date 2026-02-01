import "./globals.css";
import Providers from "@/app/providers";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "JobTracker – Track Your Job Applications",
  description: "A modern job application tracker to organize your job search like a pro. Track applications, contacts, notes, and never miss an opportunity.",
  keywords: ["job tracker", "job applications", "career", "job search", "application tracker"],
  authors: [{ name: "JobTracker" }],
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" }
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "JobTracker – Track Your Job Applications",
    description: "A modern job application tracker to organize your job search like a pro.",
    type: "website",
    siteName: "JobTracker"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
