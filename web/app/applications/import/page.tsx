import ImportCsvClient from "@/components/ImportCsvClient";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Import CSV</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Upload a CSV of job applications. We’ll validate rows and import what we can.
        </p>
        <div className="text-sm text-zinc-600 mt-3">
          Required columns: <span className="badge">company</span> <span className="badge">title</span><br/>
          Optional: stage, location, url, source, appliedDate, salaryMin, salaryMax, tags
        </div>
      </div>

      <ImportCsvClient />
    </div>
  );
}
