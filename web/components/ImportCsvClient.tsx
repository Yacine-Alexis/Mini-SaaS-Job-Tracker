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

type DetectedFormat = "standard" | "linkedin" | "indeed" | "greenhouse" | "unknown";

function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/[_\s-]/g, "");
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
  const s = String(v).trim().replace(/[$,]/g, ""); // Remove currency symbols
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
  // Accept mm/dd/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split("/");
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function pickField(row: Row, ...names: string[]) {
  for (const name of names) {
    const key = Object.keys(row).find(k => normalizeKey(k) === normalizeKey(name));
    if (key && row[key] != null && String(row[key]).trim()) {
      return row[key];
    }
  }
  return undefined;
}

// Detect the format of the CSV based on column headers
function detectFormat(headers: string[]): DetectedFormat {
  const normalized = headers.map(h => normalizeKey(h));
  
  // LinkedIn export format
  if (normalized.includes("jobtitle") && normalized.includes("companyname")) {
    return "linkedin";
  }
  
  // Indeed format (common patterns)
  if (normalized.includes("jobkey") || (normalized.includes("title") && normalized.includes("company") && normalized.includes("salary"))) {
    return "indeed";
  }
  
  // Greenhouse ATS format
  if (normalized.includes("candidateid") || normalized.includes("jobpost")) {
    return "greenhouse";
  }
  
  // Standard format
  if (normalized.includes("company") && normalized.includes("title")) {
    return "standard";
  }
  
  return "unknown";
}

// Transform row based on detected format
function transformRow(row: Row, format: DetectedFormat): ImportRow {
  switch (format) {
    case "linkedin":
      return {
        company: String(pickField(row, "companyName", "Company Name", "company") ?? "").trim(),
        title: String(pickField(row, "jobTitle", "Job Title", "title", "position") ?? "").trim(),
        stage: "APPLIED", // LinkedIn usually means you applied
        location: pickField(row, "location", "jobLocation", "Job Location") 
          ? String(pickField(row, "location", "jobLocation", "Job Location")).trim() 
          : null,
        url: pickField(row, "jobUrl", "Job URL", "url", "link") 
          ? String(pickField(row, "jobUrl", "Job URL", "url", "link")).trim() 
          : null,
        source: "LinkedIn",
        appliedDate: toIsoOrNull(pickField(row, "appliedDate", "Applied Date", "applicationDate", "dateApplied")),
        salaryMin: null,
        salaryMax: null,
        tags: ["linkedin", ...toTags(pickField(row, "tags", "skills"))]
      };

    case "indeed":
      return {
        company: String(pickField(row, "company", "companyName", "employer") ?? "").trim(),
        title: String(pickField(row, "title", "jobTitle", "position") ?? "").trim(),
        stage: "SAVED",
        location: pickField(row, "location", "city") 
          ? String(pickField(row, "location", "city")).trim() 
          : null,
        url: pickField(row, "url", "link", "jobUrl") 
          ? String(pickField(row, "url", "link", "jobUrl")).trim() 
          : null,
        source: "Indeed",
        appliedDate: toIsoOrNull(pickField(row, "date", "postedDate", "appliedDate")),
        salaryMin: toNumberOrNull(pickField(row, "salaryMin", "minSalary", "salary")),
        salaryMax: toNumberOrNull(pickField(row, "salaryMax", "maxSalary")),
        tags: ["indeed", ...toTags(pickField(row, "tags", "jobType"))]
      };

    case "greenhouse":
      return {
        company: String(pickField(row, "company", "companyName") ?? "").trim(),
        title: String(pickField(row, "jobPost", "position", "title") ?? "").trim(),
        stage: "APPLIED",
        location: pickField(row, "location") 
          ? String(pickField(row, "location")).trim() 
          : null,
        url: pickField(row, "applicationUrl", "url") 
          ? String(pickField(row, "applicationUrl", "url")).trim() 
          : null,
        source: "Greenhouse",
        appliedDate: toIsoOrNull(pickField(row, "appliedAt", "createdAt", "date")),
        salaryMin: null,
        salaryMax: null,
        tags: ["greenhouse"]
      };

    default:
      // Standard format
      return {
        company: String(pickField(row, "company") ?? "").trim(),
        title: String(pickField(row, "title") ?? "").trim(),
        stage: pickField(row, "stage") ? String(pickField(row, "stage")).trim().toUpperCase() : undefined,
        location: pickField(row, "location") ? String(pickField(row, "location")).trim() : null,
        url: pickField(row, "url") ? String(pickField(row, "url")).trim() : null,
        source: pickField(row, "source") ? String(pickField(row, "source")).trim() : null,
        appliedDate: toIsoOrNull(pickField(row, "applieddate", "appliedDate")),
        salaryMin: toNumberOrNull(pickField(row, "salarymin", "salaryMin")),
        salaryMax: toNumberOrNull(pickField(row, "salarymax", "salaryMax")),
        tags: toTags(pickField(row, "tags"))
      };
  }
}

export default function ImportCsvClient() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat | null>(null);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const canImport = rows.length > 0 && !importing;

  const formatLabels: Record<DetectedFormat, { name: string; color: string }> = {
    standard: { name: "Standard CSV", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300" },
    linkedin: { name: "LinkedIn Export", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    indeed: { name: "Indeed Export", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    greenhouse: { name: "Greenhouse ATS", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    unknown: { name: "Unknown Format", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }
  };

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
    setDetectedFormat(null);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors?.length) {
          setErr(`CSV parse error: ${res.errors[0].message}`);
          return;
        }

        const raw = res.data ?? [];
        if (raw.length === 0) {
          setErr("CSV file is empty");
          return;
        }

        // Detect format from headers
        const headers = Object.keys(raw[0] as Row);
        const format = detectFormat(headers);
        setDetectedFormat(format);

        // Transform rows based on detected format
        const mapped = raw.map((r) => transformRow(r, format));

        // Filter out rows without required fields
        const validRows = mapped.filter(r => r.company && r.title);

        if (validRows.length === 0) {
          setErr("No valid rows found. Make sure your CSV has 'company' and 'title' columns.");
          return;
        }

        setRows(validRows);
        setPreview(validRows.slice(0, 10));
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
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">Upload a CSV</div>
          <a
            className="btn"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv)}`}
            download="jobtracker_template.csv"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download template
          </a>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20"); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20"); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
            const f = e.dataTransfer.files?.[0];
            if (f && f.name.endsWith(".csv")) onFile(f);
          }}
          onClick={() => document.getElementById("csv-file-input")?.click()}
        >
          <svg className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            Drag & drop your CSV file here
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            or click to browse
          </p>
          <input
            id="csv-file-input"
            className="hidden"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>

        {/* File Info & Format Detection */}
        {fileName && (
          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{fileName}</div>
                <div className="text-sm text-zinc-500">{rows.length} valid row(s) found</div>
              </div>
            </div>
            {detectedFormat && (
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${formatLabels[detectedFormat].color}`}>
                {formatLabels[detectedFormat].name}
              </span>
            )}
          </div>
        )}

        {err && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{err}</span>
          </div>
        )}

        <button className="btn btn-primary w-full" onClick={doImport} disabled={!canImport}>
          {importing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Importing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import {rows.length} application{rows.length !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Import successful!</span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {result.created} application{result.created !== 1 ? "s" : ""} created
            </div>
            {result.truncated && (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Some rows were skipped due to plan limits. Upgrade to Pro for unlimited imports.
              </div>
            )}
            {result.failures?.length > 0 && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {result.failures.length} row(s) failed validation
              </div>
            )}
            <Link 
              href="/applications" 
              className="inline-flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
            >
              View your applications
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">Preview</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing first {preview.length} of {rows.length} rows
              </div>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr className="text-left">
                  <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Company</th>
                  <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Title</th>
                  <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Stage</th>
                  <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Source</th>
                  <th className="p-3 font-medium text-zinc-700 dark:text-zinc-300">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {preview.map((r, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">{r.company}</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">{r.title}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {r.stage ?? "SAVED"}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500 dark:text-zinc-400">{r.source ?? "-"}</td>
                    <td className="p-3">
                      {(r.tags ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              {tag}
                            </span>
                          ))}
                          {r.tags.length > 3 && (
                            <span className="text-xs text-zinc-500">+{r.tags.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
