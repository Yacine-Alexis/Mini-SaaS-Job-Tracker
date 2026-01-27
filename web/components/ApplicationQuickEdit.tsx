"use client";

import { useEffect, useState } from "react";
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
};

export default function ApplicationQuickEdit({
  item,
  onUpdated
}: {
  item: AppItem;
  onUpdated: () => Promise<void>;
}) {
  const [stage, setStage] = useState<ApplicationStage>(item.stage);
  const [location, setLocation] = useState(item.location ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [source, setSource] = useState(item.source ?? "");
  const [appliedDate, setAppliedDate] = useState(item.appliedDate ? new Date(item.appliedDate).toISOString().slice(0, 10) : "");
  const [tags, setTags] = useState((item.tags ?? []).join(", "));

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setStage(item.stage);
    setLocation(item.location ?? "");
    setUrl(item.url ?? "");
    setSource(item.source ?? "");
    setAppliedDate(item.appliedDate ? new Date(item.appliedDate).toISOString().slice(0, 10) : "");
    setTags((item.tags ?? []).join(", "));
  }, [item]);

  async function save() {
    setSaving(true);
    setErr(null);

    const payload = {
      stage,
      location: location.trim() ? location.trim() : null,
      url: url.trim() ? url.trim() : null,
      source: source.trim() ? source.trim() : null,
      appliedDate: appliedDate ? new Date(appliedDate).toISOString() : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    };

    try {
      const res = await fetch(`/api/applications/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Save failed");
        return;
      }
      await onUpdated();
    } catch {
      setErr("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Quick edit</h2>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Stage</label>
          <select className="input mt-1" value={stage} onChange={(e) => setStage(e.target.value as ApplicationStage)}>
            {Object.values(ApplicationStage).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Applied date</label>
          <input className="input mt-1" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Location</label>
          <input className="input mt-1" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Source</label>
          <input className="input mt-1" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">URL</label>
          <input className="input mt-1" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <input className="input mt-1" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
