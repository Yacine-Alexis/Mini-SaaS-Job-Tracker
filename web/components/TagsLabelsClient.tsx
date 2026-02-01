"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/Modal";
import { LABEL_COLORS } from "@/lib/validators/labels";

type Label = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

type TagWithCount = {
  tag: string;
  count: number;
};

export default function TagsLabelsClient() {
  const { addToast } = useToast();

  // Labels state
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(true);

  // Tags state
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  // Label form
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0].value);
  const [savingLabel, setSavingLabel] = useState(false);
  const [deleteLabelId, setDeleteLabelId] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"labels" | "tags">("labels");

  const loadLabels = useCallback(async () => {
    setLoadingLabels(true);
    try {
      const res = await fetch("/api/labels", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message);
      setLabels(data.items ?? []);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load labels", message: String(err) });
    } finally {
      setLoadingLabels(false);
    }
  }, [addToast]);

  const loadTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const res = await fetch("/api/applications/tags", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message);
      setTags(data.tags ?? []);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load tags", message: String(err) });
    } finally {
      setLoadingTags(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadLabels();
    void loadTags();
  }, [loadLabels, loadTags]);

  // Label form handlers
  function resetLabelForm() {
    setShowLabelForm(false);
    setEditingLabel(null);
    setLabelName("");
    setLabelColor(LABEL_COLORS[0].value);
  }

  function startEditLabel(label: Label) {
    setEditingLabel(label);
    setLabelName(label.name);
    setLabelColor(label.color);
    setShowLabelForm(true);
  }

  async function handleSaveLabel(e: React.FormEvent) {
    e.preventDefault();
    setSavingLabel(true);

    try {
      const payload = {
        ...(editingLabel && { id: editingLabel.id }),
        name: labelName.trim(),
        color: labelColor,
      };

      const res = await fetch("/api/labels", {
        method: editingLabel ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to save" });
        return;
      }

      addToast({ type: "success", title: editingLabel ? "Label updated" : "Label created" });
      resetLabelForm();
      await loadLabels();
    } catch {
      addToast({ type: "error", title: "Failed to save label" });
    } finally {
      setSavingLabel(false);
    }
  }

  async function handleDeleteLabel() {
    if (!deleteLabelId) return;
    setDeletingLabel(true);

    try {
      const res = await fetch(`/api/labels?id=${deleteLabelId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to delete" });
        return;
      }
      addToast({ type: "success", title: "Label deleted" });
      setDeleteLabelId(null);
      await loadLabels();
    } catch {
      addToast({ type: "error", title: "Failed to delete label" });
    } finally {
      setDeletingLabel(false);
    }
  }

  // Get contrast text color for a background
  function getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Tags & Labels</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Organize your job applications with custom labels and see your tag usage
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("labels")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "labels"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Labels
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                {labels.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tags
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                {tags.length}
              </span>
            </span>
          </button>
        </nav>
      </div>

      {/* Labels Tab */}
      {activeTab === "labels" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Create custom labels with colors to categorize your applications
            </p>
            <button
              onClick={() => { resetLabelForm(); setShowLabelForm(true); }}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Label
            </button>
          </div>

          {/* Label Form */}
          {showLabelForm && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {editingLabel ? "Edit Label" : "Create New Label"}
              </h3>
              <form onSubmit={handleSaveLabel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={labelName}
                    onChange={(e) => setLabelName(e.target.value)}
                    placeholder="e.g., High Priority, Dream Company"
                    className="input"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setLabelColor(c.value)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          labelColor === c.value
                            ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                    {/* Custom color input */}
                    <div className="relative">
                      <input
                        type="color"
                        value={labelColor}
                        onChange={(e) => setLabelColor(e.target.value)}
                        className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                      />
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center"
                        style={{ backgroundColor: !LABEL_COLORS.some(c => c.value === labelColor) ? labelColor : undefined }}
                      >
                        {LABEL_COLORS.some(c => c.value === labelColor) && (
                          <span className="text-xs text-zinc-400">+</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: labelColor,
                      color: getContrastColor(labelColor),
                    }}
                  >
                    {labelName || "Preview"}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" className="btn btn-primary" disabled={savingLabel}>
                    {savingLabel ? "Saving..." : editingLabel ? "Update" : "Create Label"}
                  </button>
                  <button type="button" onClick={resetLabelForm} className="btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Labels Grid */}
          {loadingLabels ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-zinc-600 dark:text-zinc-400">Loading labels...</span>
            </div>
          ) : labels.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">No labels yet</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create labels to organize and categorize your applications
              </p>
              <button
                onClick={() => { resetLabelForm(); setShowLabelForm(true); }}
                className="btn btn-primary mt-4"
              >
                Create your first label
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="card p-4 group relative hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {label.name}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: label.color,
                        color: getContrastColor(label.color),
                      }}
                    >
                      {label.name}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditLabel(label)}
                      className="btn btn-sm text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteLabelId(label.id)}
                      className="btn btn-sm text-xs text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Tags are automatically collected from your applications. Click a tag to filter.
            </p>
            <span className="text-sm text-zinc-500">
              {tags.reduce((acc, t) => acc + t.count, 0)} total tag uses
            </span>
          </div>

          {loadingTags ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-zinc-600 dark:text-zinc-400">Loading tags...</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">No tags yet</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Add tags to your applications to see them here
              </p>
            </div>
          ) : (
            <div className="card p-6">
              {/* Tag cloud visualization */}
              <div className="flex flex-wrap gap-2">
                {tags.map(({ tag, count }) => {
                  const maxCount = Math.max(...tags.map(t => t.count));
                  const ratio = count / maxCount;
                  const size = ratio > 0.7 ? "text-lg font-semibold" : ratio > 0.4 ? "text-base font-medium" : "text-sm";
                  
                  return (
                    <a
                      key={tag}
                      href={`/applications?tags=${encodeURIComponent(tag)}`}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                        hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300
                        transition-colors cursor-pointer
                        ${size}
                      `}
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                        {count}
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Tag stats */}
              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Top Tags
                </h4>
                <div className="space-y-2">
                  {tags.slice(0, 5).map(({ tag, count }) => {
                    const maxCount = tags[0]?.count || 1;
                    const percentage = (count / maxCount) * 100;
                    
                    return (
                      <div key={tag} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400 truncate">
                          {tag}
                        </span>
                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-500 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Label Modal */}
      <ConfirmModal
        open={!!deleteLabelId}
        onClose={() => setDeleteLabelId(null)}
        onConfirm={handleDeleteLabel}
        title="Delete Label"
        message="Are you sure you want to delete this label? Applications using this label won't be affected."
        confirmText="Delete"
        loading={deletingLabel}
        variant="danger"
      />
    </div>
  );
}
