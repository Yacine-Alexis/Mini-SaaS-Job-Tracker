"use client";

import { useEffect, useState, useCallback } from "react";
import { DocumentType } from "@prisma/client";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

type Document = {
  id: string;
  name: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string | null;
  version: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  application: {
    id: string;
    company: string;
    title: string;
  } | null;
};

const TYPE_LABELS: Record<DocumentType, { label: string; icon: string; color: string }> = {
  RESUME: { label: "Resume", icon: "📄", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COVER_LETTER: { label: "Cover Letter", icon: "✉️", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  PORTFOLIO: { label: "Portfolio", icon: "🎨", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  OTHER: { label: "Other", icon: "📎", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300" },
};

export default function DocumentsClient() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filter
  const [filterType, setFilterType] = useState<DocumentType | "">("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("RESUME");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [version, setVersion] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      const res = await fetch(`/api/documents?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load documents");
        return;
      }
      setDocuments(data.items ?? []);
    } catch {
      setErr("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setType("RESUME");
    setFileName("");
    setFileUrl("");
    setVersion("");
    setIsDefault(false);
  }

  function startEdit(doc: Document) {
    setEditingId(doc.id);
    setName(doc.name);
    setType(doc.type);
    setFileName(doc.fileName);
    setFileUrl(doc.fileUrl ?? "");
    setVersion(doc.version ?? "");
    setIsDefault(doc.isDefault);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        name,
        type,
        fileName,
        fileUrl: fileUrl || null,
        version: version || null,
        isDefault,
      };

      const res = await fetch("/api/documents", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to save" });
        return;
      }

      addToast({ type: "success", title: editingId ? "Document updated" : "Document created" });
      resetForm();
      await load();
    } catch {
      addToast({ type: "error", title: "Failed to save document" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/documents?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to delete" });
        return;
      }
      addToast({ type: "success", title: "Document deleted" });
      setDeleteId(null);
      await load();
    } catch {
      addToast({ type: "error", title: "Failed to delete document" });
    } finally {
      setDeleting(false);
    }
  }

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<DocumentType, Document[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Documents</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your resumes, cover letters, and other application documents
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Document
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filter by type:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DocumentType | "")}
          className="input w-48"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {editingId ? "Edit Document" : "Add New Document"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Software Engineer Resume"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DocumentType)}
                  className="input"
                >
                  {Object.entries(TYPE_LABELS).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., john_doe_resume.pdf"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., v2, Tech Focus"
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  File URL
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://dropbox.com/..."
                  className="input"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Link to Google Drive, Dropbox, or other cloud storage
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600"
              />
              <label htmlFor="isDefault" className="text-sm text-zinc-700 dark:text-zinc-300">
                Set as default for this type
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Add Document"}
              </button>
              <button type="button" onClick={resetForm} className="btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-zinc-600 dark:text-zinc-400">Loading documents...</span>
        </div>
      )}

      {/* Error */}
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
      {!loading && !err && documents.length === 0 && (
        <EmptyState
          icon="document"
          title="No documents yet"
          description="Add your resumes, cover letters, and other documents to keep them organized."
          action={{ label: "Add Document", onClick: () => { resetForm(); setShowForm(true); } }}
        />
      )}

      {/* Documents Grid */}
      {!loading && !err && documents.length > 0 && (
        <div className="space-y-6">
          {(Object.entries(TYPE_LABELS) as [DocumentType, typeof TYPE_LABELS[DocumentType]][])
            .filter(([docType]) => !filterType || groupedDocs[docType])
            .map(([docType, { label, icon, color }]) => {
              const docs = groupedDocs[docType] || [];
              if (docs.length === 0) return null;

              return (
                <div key={docType}>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <span>{icon}</span>
                    {label}s
                    <span className="text-sm font-normal text-zinc-500">({docs.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="card p-4 hover:shadow-md transition-shadow relative group"
                      >
                        {doc.isDefault && (
                          <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            Default
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                            <span className="text-lg">{icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {doc.name}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {doc.fileName}
                            </p>
                            {doc.version && (
                              <span className="text-xs text-zinc-400">{doc.version}</span>
                            )}
                          </div>
                        </div>
                        {doc.application && (
                          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                            Linked to:{" "}
                            <Link
                              href={`/applications/${doc.application.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {doc.application.company} - {doc.application.title}
                            </Link>
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open
                            </a>
                          )}
                          <button
                            onClick={() => startEdit(doc)}
                            className="btn btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(doc.id)}
                            className="btn btn-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
