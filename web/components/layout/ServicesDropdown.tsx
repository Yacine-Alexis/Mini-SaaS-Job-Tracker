"use client";

import { useState } from "react";
import { GridIcon, MicIcon, ChartIcon, LetterIcon, ChevronDownIcon } from "@/components/icons";

interface ServiceItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

const comingSoonItems: ServiceItem[] = [
  { label: "Interview Prep", icon: MicIcon, badge: "Soon" },
  { label: "Salary Insights", icon: ChartIcon, badge: "Pro" },
  { label: "Email Templates", icon: LetterIcon, badge: "Soon" },
];

export function ServicesDropdown() {
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setServicesOpen(!servicesOpen)}
        onBlur={() => setTimeout(() => setServicesOpen(false), 150)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
      >
        <GridIcon className="h-4 w-4" />
        Services
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
      </button>

      {servicesOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Coming Soon
          </div>
          {comingSoonItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-60"
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-sm">{item.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                item.badge === "Pro"
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
              }`}>
                {item.badge}
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
            <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">
              More tools coming in 2026 🚀
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
