"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import Link from "next/link";

type Row = Record<string, unknown>;

type ImportRow = {
  company: string;
  title: string;
  stage?: string;
  location: string | null;
  url: string | null;
  source: string | null;
  appliedDate: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
};

type ImportResult = {
  ok: boolean;
  created: number;
  truncated: boolean;
  failures: Array<{ index: number; reason: string }>;
};

function normalizeKey(k: string) {
  return k.trim().toLowerCase();
}

function toTags(v: unknown): string[] {
  if (v == null) return [];
  const s = String(v).trim();
  if (!s) return [];
  // allow "a|b|c" or "a, b, c"
  const parts = s.includes("|") ? s.split("|") : s.split(",");
  return parts.map(t => t.trim()).filter(Boolean);
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toIsoOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;

  // Accept ISO already, or yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s).toISOString();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function pickField(row: Row, name: string) {
  const key = Object.keys(row).find(k => normalizeKey(k) === name);
  return key ? row[key] : undefined;
}

export default function ImportCsvClient() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const canImport = rows.length > 0 && !importing;

  const templateCsv = useMemo(() => {
    return [
      "company,title,stage,location,url,source,appliedDate,salaryMin,salaryMax,tags",
      "Acme Inc,Junior Dev,APPLIED,Remote,https://example.com,LinkedIn,2026-01-10,55000,65000,remote|typescript",
      "Northwind,QA Intern,INTERVIEW,Montreal,,Referral,2026-01-05,,,qa|playwright"
    ].join("\n");
  }, []);

  function onFile(file: File) {
    setErr(null);
    setResult(null);
    setFileName(file.name);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors?.length) {
          setErr(`CSV parse error: ${res.errors[0].message}`);
          return;
        }

        const raw = res.data ?? [];
        const mapped = raw.map((r) => {
          const company = pickField(r, "company");
          const title = pickField(r, "title");

          return {
            company: company ? String(company).trim() : "",
            title: title ? String(title).trim() : "",
            stage: pickField(r, "stage") ? String(pickField(r, "stage")).trim().toUpperCase() : undefined,
            location: pickField(r, "location") ? String(pickField(r, "location")).trim() : null,
            url: pickField(r, "url") ? String(pickField(r, "url")).trim() : null,
            source: pickField(r, "source") ? String(pickField(r, "source")).trim() : null,
            appliedDate: toIsoOrNull(pickField(r, "applieddate") ?? pickField(r, "appliedDate")),
            salaryMin: toNumberOrNull(pickField(r, "salarymin") ?? pickField(r, "salaryMin")),
            salaryMax: toNumberOrNull(pickField(r, "salarymax") ?? pickField(r, "salaryMax")),
            tags: toTags(pickField(r, "tags"))
          };
        });

        setRows(mapped);
        setPreview(mapped.slice(0, 10));
      }
    });
  }

  async function doImport() {
    setImporting(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/applications/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error?.message ?? "Import failed");
        return;
      }
      setResult(data);
    } catch {
      setErr("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">Upload a CSV</div>
          <a
            className="btn"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv)}`}
            download="jobtracker_template.csv"
          >
            Download template
          </a>
        </div>

        <input
          className="input"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />

        {fileName && <div className="text-sm text-zinc-600">Loaded: {fileName}</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        <button className="btn btn-primary" onClick={doImport} disabled={!canImport}>
          {importing ? "Importing…" : `Import ${rows.length} row(s)`}
        </button>

        {result && (
          <div className="text-sm text-zinc-700 space-y-1">
            <div><span className="badge">Created</span> {result.created}</div>
            {result.truncated && <div className="text-sm text-zinc-600">Some rows were skipped due to plan limits.</div>}
            {result.failures?.length > 0 && (
              <div className="text-sm text-zinc-600">
                {result.failures.length} row(s) failed. (Fix & re-import.)
              </div>
            )}
            <Link className="underline" href="/applications">Go to applications</Link>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="font-medium">Preview (first 10)</div>
        <div className="text-sm text-zinc-600 mt-1">
          Company + Title are required; invalid rows will be rejected by the server validator.
        </div>

        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr className="text-left">
                <th className="p-2">Company</th>
                <th className="p-2">Title</th>
                <th className="p-2">Stage</th>
                <th className="p-2">Tags</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="p-2">{r.company}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.stage ?? "SAVED"}</td>
                  <td className="p-2">{(r.tags ?? []).join(", ")}</td>
                </tr>
              ))}
              {preview.length === 0 && (
                <tr>
                  <td className="p-2 text-zinc-600" colSpan={4}>No preview yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
