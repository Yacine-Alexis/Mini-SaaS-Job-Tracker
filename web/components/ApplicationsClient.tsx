"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ApplicationStage } from "@prisma/client";
import { formatDateTime } from "@/lib/dateUtils";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

type SortField = "company" | "title" | "stage" | "updatedAt" | "appliedDate";
type SortDir = "asc" | "desc";

type AppItem = {
  id: string;
  company: string;
  title: string;
  stage: ApplicationStage;
  location: string | null;
  url: string | null;
  tags: string[];
  appliedDate: string | null;
  updatedAt: string;
};

// Stage colors for consistent styling
const stageColors: Record<ApplicationStage, string> = {
  SAVED: "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
  APPLIED: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  INTERVIEW: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  OFFER: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export default function ApplicationsClient() {
  const { addToast } = useToast();
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<ApplicationStage | "">("");
  const [tags, setTags] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [batchStageModalOpen, setBatchStageModalOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchNewStage, setBatchNewStage] = useState<ApplicationStage>("APPLIED");

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (q.trim()) sp.set("q", q.trim());
    if (stage) sp.set("stage", stage);
    if (tags.trim()) sp.set("tags", tags.trim());
    if (from) sp.set("from", `${from}T00:00:00`);
    if (to) sp.set("to", `${to}T23:59:59`);
    return sp.toString();
  }, [q, stage, tags, from, to, page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/applications?${queryString}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load");
        return;
      }
      setItems(data.items ?? []);
      setSelectedIds(new Set()); // Clear selection on reload
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sort items client-side
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "company":
          aVal = a.company.toLowerCase();
          bVal = b.company.toLowerCase();
          break;
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "stage":
          aVal = a.stage;
          bVal = b.stage;
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case "appliedDate":
          aVal = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
          bVal = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
          break;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function resetPageAnd<T>(fn: () => T) {
    setPage(1);
    fn();
  }

  // Selection handlers
  const allSelected = sortedItems.length > 0 && selectedIds.size === sortedItems.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < sortedItems.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map((it) => it.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Quick stage change
  async function handleQuickStageChange(id: string, newStage: ApplicationStage) {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({ type: "error", title: "Failed to update", message: data?.error?.message });
        return;
      }
      // Update locally for instant feedback
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, stage: newStage } : it))
      );
      addToast({ type: "success", title: "Stage updated" });
    } catch {
      addToast({ type: "error", title: "Failed to update stage" });
    }
  }

  // Batch delete
  async function handleBatchDelete() {
    setBatchDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setBatchDeleting(false);
    setDeleteModalOpen(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      addToast({ type: "success", title: `Deleted ${successCount} application${successCount > 1 ? "s" : ""}` });
    }
    if (failCount > 0) {
      addToast({ type: "error", title: `Failed to delete ${failCount} application${failCount > 1 ? "s" : ""}` });
    }

    await load();
  }

  // Batch stage change
  async function handleBatchStageChange(stage: ApplicationStage) {
    setBatchDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stage }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setBatchDeleting(false);
    setBatchStageModalOpen(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      addToast({ type: "success", title: `Updated ${successCount} application${successCount > 1 ? "s" : ""}` });
    }
    if (failCount > 0) {
      addToast({ type: "error", title: `Failed to update ${failCount} application${failCount > 1 ? "s" : ""}` });
    }

    await load();
  }

  const [plan, setPlan] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setPlan(d?.user?.plan ?? null)).catch(() => {});
  }, []);
  const isPro = plan === "PRO";

  // Sort indicator component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="h-4 w-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === "asc" ? (
      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Search, filter, and manage your job applications.
            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500 ml-2">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600">K</kbd> for quick actions
            </span>
          </p>
        </div>
        <Link
          href="/applications/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </Link>
      </div>

      {/* Filters Card */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              className="input pl-10"
              placeholder="Search company, title, location…"
              value={q}
              onChange={(e) => resetPageAnd(() => setQ(e.target.value))}
            />
          </div>
          <select
            className="input"
            value={stage}
            onChange={(e) => resetPageAnd(() => setStage(e.target.value as ApplicationStage | ""))}
          >
            <option value="">All stages</option>
            {Object.values(ApplicationStage).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Tags: remote, referral…"
            value={tags}
            onChange={(e) => resetPageAnd(() => setTags(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Applied from</label>
            <input className="input mt-1" type="date" value={from} onChange={(e) => resetPageAnd(() => setFrom(e.target.value))} />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Applied to</label>
            <input className="input mt-1" type="date" value={to} onChange={(e) => resetPageAnd(() => setTo(e.target.value))} />
          </div>
          <div className="md:col-span-2 flex gap-2 items-end flex-wrap">
            <button className="btn" onClick={() => load()} disabled={loading}>
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              className="btn"
              onClick={() => { setQ(""); setStage(""); setTags(""); setFrom(""); setTo(""); setPage(1); }}
              disabled={loading}
            >
              Clear
            </button>
            {isPro ? (
              <button
                className="btn"
                onClick={async () => {
                  const res = await fetch(`/api/applications/export?${queryString}`);
                  if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    addToast({ type: "error", title: "Export failed", message: data?.error?.message });
                    return;
                  }
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "applications.csv";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  addToast({ type: "success", title: "Export complete" });
                }}
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            ) : (
              <Link className="btn" href="/settings/billing" title="Upgrade to export CSV">
                <svg className="h-4 w-4 mr-1.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Export (Pro)
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="card p-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} application{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn text-sm"
              onClick={() => setBatchStageModalOpen(true)}
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Change Stage
            </button>
            <button
              className="btn text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setDeleteModalOpen(true)}
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <button
              className="btn text-sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card p-8 flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-zinc-600 dark:text-zinc-400">Loading applications...</span>
        </div>
      )}

      {/* Error State */}
      {err && (
        <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{err}</span>
            <button className="btn text-sm ml-auto" onClick={() => load()}>Retry</button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !err && items.length === 0 && (
        <EmptyState
          icon="applications"
          title="No applications found"
          description="Try adjusting your filters, or create your first job application to get started."
          action={{ label: "Create Application", href: "/applications/new" }}
          secondaryAction={{ label: "Import CSV", href: "/applications/import" }}
        >
          <button
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={async () => {
              const res = await fetch("/api/onboarding/sample-data", { method: "POST" });
              const data = await res.json().catch(() => null);
              if (!res.ok) {
                addToast({ type: "error", title: "Failed to add sample data", message: data?.error?.message });
              } else {
                addToast({ type: "success", title: "Sample data added" });
                await load();
              }
            }}
          >
            Or add sample data to explore
          </button>
        </EmptyState>
      )}

      {/* Data Table */}
      {!loading && !err && sortedItems.length > 0 && (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.size === sortedItems.length && sortedItems.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3">
                    <button
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => handleSort("company")}
                    >
                      Company
                      <SortIcon field="company" />
                    </button>
                  </th>
                  <th className="p-3">
                    <button
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => handleSort("title")}
                    >
                      Title
                      <SortIcon field="title" />
                    </button>
                  </th>
                  <th className="p-3">
                    <button
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => handleSort("stage")}
                    >
                      Stage
                      <SortIcon field="stage" />
                    </button>
                  </th>
                  <th className="p-3">
                    <button
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => handleSort("updatedAt")}
                    >
                      Updated
                      <SortIcon field="updatedAt" />
                    </button>
                  </th>
                  <th className="p-3 w-[180px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sortedItems.map((it) => (
                  <tr 
                    key={it.id} 
                    className={`
                      hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors
                      ${selectedIds.has(it.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                    `}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.has(it.id)}
                        onChange={() => toggleSelect(it.id)}
                      />
                    </td>
                    <td className="p-3">
                      <Link 
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                        href={`/applications/${it.id}`}
                      >
                        {it.company}
                      </Link>
                      {it.location && (
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{it.location}</span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-700 dark:text-zinc-300">{it.title}</td>
                    <td className="p-3">
                      <select
                        className={`
                          text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer
                          focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                          ${stageColors[it.stage as keyof typeof stageColors] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"}
                        `}
                        value={it.stage}
                        onChange={(e) => handleQuickStageChange(it.id, e.target.value as ApplicationStage)}
                      >
                        {Object.values(ApplicationStage).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-zinc-500 dark:text-zinc-400 text-xs">
                      {formatDateTime(it.updatedAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 justify-end">
                        <Link 
                          className="btn text-xs py-1.5 px-2.5" 
                          href={`/applications/${it.id}`}
                          title="View details"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link 
                          className="btn text-xs py-1.5 px-2.5" 
                          href={`/applications/${it.id}/edit`}
                          title="Edit application"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <DeleteButton id={it.id} onDone={load} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedItems.map((it) => (
              <div 
                key={it.id} 
                className={`p-4 ${selectedIds.has(it.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.has(it.id)}
                    onChange={() => toggleSelect(it.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link 
                          className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600" 
                          href={`/applications/${it.id}`}
                        >
                          {it.company}
                        </Link>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{it.title}</p>
                        {it.location && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">{it.location}</p>
                        )}
                      </div>
                      <select
                        className={`
                          text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer
                          ${stageColors[it.stage as keyof typeof stageColors] || "bg-zinc-100 text-zinc-800"}
                        `}
                        value={it.stage}
                        onChange={(e) => handleQuickStageChange(it.id, e.target.value as ApplicationStage)}
                      >
                        {Object.values(ApplicationStage).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{formatDateTime(it.updatedAt)}</span>
                      <div className="flex gap-1.5">
                        <Link className="btn text-xs py-1 px-2" href={`/applications/${it.id}`}>View</Link>
                        <Link className="btn text-xs py-1 px-2" href={`/applications/${it.id}/edit`}>Edit</Link>
                        <DeleteButton id={it.id} onDone={load} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !err && items.length > 0 && (
        <div className="flex items-center justify-between">
          <button 
            className="btn flex items-center gap-1" 
            disabled={page <= 1 || loading} 
            onClick={() => setPage((p) => p - 1)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Page <span className="font-medium text-zinc-900 dark:text-zinc-100">{page}</span>
            </span>
            <select
              className="input text-sm py-1.5"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Items per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <button 
            className="btn flex items-center gap-1" 
            disabled={loading || items.length < pageSize} 
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Batch Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Applications"
        message={`Are you sure you want to delete ${selectedIds.size} application${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText={batchDeleting ? "Deleting..." : "Delete"}
        variant="danger"
        loading={batchDeleting}
        onConfirm={handleBatchDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Batch Stage Change Modal */}
      {batchStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Change Stage for {selectedIds.size} Application{selectedIds.size > 1 ? "s" : ""}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Select a new stage for the selected applications.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {Object.values(ApplicationStage).map((s) => (
                <button
                  key={s}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl border transition-all
                    hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                    ${batchDeleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  disabled={batchDeleting}
                  onClick={() => handleBatchStageChange(s)}
                >
                  <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${stageColors[s]}`}>
                    {s}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="btn"
                onClick={() => setBatchStageModalOpen(false)}
                disabled={batchDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useToast();

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", title: "Delete failed", message: data?.error?.message });
      } else {
        addToast({ type: "success", title: "Application deleted" });
        onDone();
      }
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  }

  return (
    <>
      <button 
        className="btn text-xs py-1.5 px-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
        onClick={() => setShowModal(true)} 
        disabled={loading}
        title="Delete application"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <ConfirmModal
        open={showModal}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
        confirmText={loading ? "Deleting..." : "Delete"}
        variant="danger"
        loading={loading}
        onConfirm={onDelete}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
