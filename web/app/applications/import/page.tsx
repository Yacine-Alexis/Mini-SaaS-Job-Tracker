import ImportCsvClient from "@/components/ImportCsvClient";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Import Applications</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Import your job applications from various sources. We support CSV files and data from popular job boards.
        </p>
      </div>

      {/* Import Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* LinkedIn */}
        <div className="card p-5 border-l-4 border-l-blue-600">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">LinkedIn</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Export your saved jobs from LinkedIn
              </p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                  How to export from LinkedIn
                </summary>
                <ol className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
                  <li>Go to Settings → Data Privacy</li>
                  <li>Click "Get a copy of your data"</li>
                  <li>Select "Jobs" and download</li>
                  <li>Upload the CSV file below</li>
                </ol>
              </details>
            </div>
          </div>
        </div>

        {/* Indeed */}
        <div className="card p-5 border-l-4 border-l-purple-600">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.566 21.552v-8.456c0-.357-.07-.63-.21-.818-.14-.188-.35-.281-.63-.281-.294 0-.574.112-.84.336-.266.224-.532.546-.798.966v8.253H6.792v-8.456c0-.357-.07-.63-.21-.818-.14-.188-.35-.281-.63-.281-.294 0-.574.112-.84.336-.266.224-.532.546-.798.966v8.253H2v-11.13h2.016l.294 1.232h.084c.294-.42.63-.756 1.008-1.008.378-.252.84-.378 1.386-.378.504 0 .924.119 1.26.357.336.238.588.574.756 1.008h.084c.294-.42.644-.756 1.05-1.008.406-.252.882-.378 1.428-.378.672 0 1.19.217 1.554.651.364.434.546 1.085.546 1.953v8.701h-2.296zm5.95-8.701c0-.49.168-.896.504-1.218.336-.322.756-.483 1.26-.483.504 0 .924.161 1.26.483.336.322.504.728.504 1.218s-.168.896-.504 1.218c-.336.322-.756.483-1.26.483-.504 0-.924-.161-1.26-.483-.336-.322-.504-.728-.504-1.218zm.294 8.701v-7.185h2.296v7.185H17.81z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Indeed</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Export your saved jobs from Indeed
              </p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-purple-600 dark:text-purple-400 hover:underline">
                  How to export from Indeed
                </summary>
                <ol className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
                  <li>Go to "My Jobs" on Indeed</li>
                  <li>Manually copy job details or use browser extensions</li>
                  <li>Create a CSV with company, title columns</li>
                  <li>Upload the file below</li>
                </ol>
              </details>
            </div>
          </div>
        </div>

        {/* Glassdoor */}
        <div className="card p-5 border-l-4 border-l-green-600">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm1-17h-2v7h7v-2h-5V5z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Glassdoor</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Export your saved jobs from Glassdoor
              </p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-green-600 dark:text-green-400 hover:underline">
                  How to export from Glassdoor
                </summary>
                <ol className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
                  <li>Go to your saved jobs</li>
                  <li>Copy job information manually</li>
                  <li>Create a CSV file with the data</li>
                  <li>Upload below</li>
                </ol>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="card p-6">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">CSV Format Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Required Columns</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Required</span>
                <code className="text-sm font-mono">company</code>
                <span className="text-sm text-zinc-500">- Company name</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Required</span>
                <code className="text-sm font-mono">title</code>
                <span className="text-sm text-zinc-500">- Job title</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Optional Columns</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">stage</code>
                <span className="text-zinc-500">SAVED, APPLIED, INTERVIEW, OFFER, REJECTED</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">location</code>
                <span className="text-zinc-500">Job location</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">url</code>
                <span className="text-zinc-500">Job posting URL</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">source</code>
                <span className="text-zinc-500">Where you found the job</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">appliedDate</code>
                <span className="text-zinc-500">YYYY-MM-DD format</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">salaryMin, salaryMax</code>
                <span className="text-zinc-500">Numbers only</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-zinc-600 dark:text-zinc-400">tags</code>
                <span className="text-zinc-500">Comma or pipe separated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Upload Component */}
      <ImportCsvClient />
    </div>
  );
}

