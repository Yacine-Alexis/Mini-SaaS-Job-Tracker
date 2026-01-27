"use client";

import { useEffect, useState } from "react";

export default function UserPlanBadge() {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => setPlan(d?.user?.plan ?? null)).catch(() => {});
  }, []);

  if (!plan) return null;
  return <span className="badge">Plan: {plan}</span>;
}
