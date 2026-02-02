"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NotesPanel from "@/components/NotesPanel";
import TasksPanel from "@/components/TasksPanel";
import ApplicationQuickEdit from "@/components/ApplicationQuickEdit";
import ContactsPanel from "@/components/ContactsPanel";
import AttachmentLinksPanel from "@/components/AttachmentLinksPanel";
import InterviewsPanel from "@/components/InterviewsPanel";
import TimelinePanel from "@/components/TimelinePanel";
import SalaryOffersPanel from "@/components/SalaryOffersPanel";
import StageProgressIndicator from "@/components/StageProgressIndicator";
import SalaryDisplay, { SalaryRangeBar } from "@/components/SalaryDisplay";
import { ApplicationStage } from "@prisma/client";

type AppItem = {
  id: string;
  company: string;
  title: string;
  stage: ApplicationStage;
  location: string | null;
  url: string | null;
  source: string | null;
  tags: string[];
  appliedDate: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  updatedAt: string;
};

export default function ApplicationDetailsClient({ id }: { id: string }) {
  const [item, setItem] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/applications/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load application");
        setItem(null);
        return;
      }
      setItem(data.item);
    } catch {
      setErr("Failed to load application");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="text-sm text-zinc-600">Loading…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!item) return <div className="text-sm text-zinc-600">Not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-600">
            <Link className="underline" href="/applications">Applications</Link> / Details
          </div>
          <h1 className="text-xl font-semibold mt-1">{item.company} — {item.title}</h1>

          {/* Stage Progress Indicator */}
          <div className="mt-3">
            <StageProgressIndicator currentStage={item.stage} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            {item.location && <span className="badge">📍 {item.location}</span>}
            {item.source && <span className="badge">Source: {item.source}</span>}
            {item.appliedDate && <span className="badge">Applied: {new Date(item.appliedDate).toISOString().slice(0,10)}</span>}
            {(item.salaryMin || item.salaryMax) && (
              <span className="badge">
                💰 <SalaryDisplay min={item.salaryMin} max={item.salaryMax} />
              </span>
            )}
          </div>

          {item.url && (
            <div className="mt-2 text-sm">
              <a className="underline" href={item.url} target="_blank" rel="noreferrer">
                Open job posting
              </a>
            </div>
          )}

          {item.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span key={t} className="badge">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link className="btn" href={`/applications/${id}/edit`}>Full edit</Link>
          <Link className="btn btn-primary" href="/applications/new">New</Link>
        </div>
      </div>

      <ApplicationQuickEdit item={item} onUpdated={load} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NotesPanel applicationId={id} />
        <TasksPanel applicationId={id} />
        <InterviewsPanel applicationId={id} />
        <SalaryOffersPanel applicationId={id} />
        <ContactsPanel applicationId={id} />
        <AttachmentLinksPanel applicationId={id} />
        <TimelinePanel applicationId={id} />
      </div>

    </div>
  );
}
