import "./globals.css";
import Providers from "@/app/providers";
import AppShell from "@/components/AppShell";
import UserPlanBadge from "@/components/UserPlanBadge";

export const metadata = {
  title: "Mini SaaS Job Tracker",
  description: "Track job applications like a lightweight CRM."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserPlanBadge />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
