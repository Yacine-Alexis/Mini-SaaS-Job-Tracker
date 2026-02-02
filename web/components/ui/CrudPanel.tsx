/**
 * CrudPanel<T> - Generic CRUD Panel Component
 *
 * A reusable panel component for managing related items (notes, tasks, contacts, etc.)
 * with create, read, update, and delete operations.
 *
 * Features:
 * - Type-safe with generics
 * - Configurable form fields
 * - Loading skeletons
 * - Empty state handling
 * - Delete confirmation modal
 * - Inline editing support
 * - Optimistic updates ready
 *
 * @example
 * <CrudPanel<Note>
 *   title="Notes"
 *   applicationId={applicationId}
 *   apiEndpoint="/api/notes"
 *   emptyState={{ icon: "notes", title: "No notes", description: "Add a note..." }}
 *   createFields={[{ key: "content", type: "textarea", placeholder: "Add a note..." }]}
 *   renderItem={(note, { onEdit, onDelete }) => <NoteRow note={note} ... />}
 * />
 */

"use client";

import React, { useEffect, useState, useCallback, ReactNode } from "react";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState, { type IconType } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

// ============================================================================
// Types
// ============================================================================

export type FieldType = "text" | "textarea" | "email" | "tel" | "date" | "select" | "checkbox";

export type FieldConfig<T> = {
  /** Key in the item object */
  key: keyof T;
  /** Input type */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Label (optional, defaults to capitalized key) */
  label?: string;
  /** Whether field is required for create */
  required?: boolean;
  /** Select options (for type="select") */
  options?: { value: string; label: string }[];
  /** Grid column span (1-2) */
  colSpan?: 1 | 2;
  /** Transform value before sending to API */
  transform?: (value: string) => unknown;
  /** Keyboard shortcut hint */
  shortcutHint?: string;
};

export type CrudPanelProps<T extends { id: string }> = {
  /** Panel title */
  title: string;
  /** Application ID to scope items */
  applicationId: string;
  /** API endpoint (e.g., "/api/notes") */
  apiEndpoint: string;
  /** Empty state configuration */
  emptyState: {
    icon: IconType;
    title: string;
    description: string;
  };
  /** Fields for the create form */
  createFields: FieldConfig<T>[];
  /** Render function for each item */
  renderItem: (
    item: T,
    actions: {
      onEdit: () => void;
      onDelete: () => void;
      onUpdate: (updates: Partial<T>) => Promise<void>;
      isUpdating: boolean;
    }
  ) => ReactNode;
  /** Custom skeleton loader */
  skeleton?: ReactNode;
  /** Number of skeleton items to show */
  skeletonCount?: number;
  /** Custom create button text */
  createButtonText?: string;
  /** Custom delete confirmation message */
  deleteConfirmMessage?: string;
  /** Additional query params for fetch */
  queryParams?: Record<string, string>;
  /** Called after successful create */
  onCreated?: (item: T) => void;
  /** Called after successful delete */
  onDeleted?: (id: string) => void;
  /** Sort items before display */
  sortFn?: (a: T, b: T) => number;
  /** Filter items before display */
  filterFn?: (item: T) => boolean;
};

// ============================================================================
// Default Skeleton
// ============================================================================

function DefaultSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3"
        >
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CrudPanel<T extends { id: string; createdAt?: string }>({
  title,
  applicationId,
  apiEndpoint,
  emptyState,
  createFields,
  renderItem,
  skeleton,
  skeletonCount = 2,
  createButtonText = "Add",
  deleteConfirmMessage = "Are you sure you want to delete this item? This action cannot be undone.",
  queryParams = {},
  onCreated,
  onDeleted,
  sortFn,
  filterFn,
}: CrudPanelProps<T>) {
  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form state - dynamic based on createFields
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    createFields.forEach((field) => {
      initial[field.key as string] = "";
    });
    return initial;
  });

  // Build query string
  const buildQueryString = useCallback(
    (extraParams: Record<string, string> = {}) => {
      const params = new URLSearchParams({
        applicationId,
        ...queryParams,
        ...extraParams,
      });
      return params.toString();
    },
    [applicationId, queryParams]
  );

  // Load items
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiEndpoint}?${buildQueryString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? `Failed to load ${title.toLowerCase()}`);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, buildQueryString, title]);

  useEffect(() => {
    void load();
  }, [load]);

  // Create item
  const handleCreate = async () => {
    // Check required fields
    const requiredFields = createFields.filter((f) => f.required);
    const missingRequired = requiredFields.find(
      (f) => !formData[f.key as string]?.trim()
    );
    if (missingRequired) {
      setError(`${missingRequired.label || String(missingRequired.key)} is required`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Build payload with transforms
      const payload: Record<string, unknown> = { applicationId };
      createFields.forEach((field) => {
        const value = formData[field.key as string];
        if (value?.trim()) {
          payload[field.key as string] = field.transform
            ? field.transform(value.trim())
            : value.trim();
        } else if (field.type === "checkbox") {
          payload[field.key as string] = value === "true";
        } else {
          payload[field.key as string] = null;
        }
      });

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to create item");
        return;
      }

      // Reset form
      const resetData: Record<string, string> = {};
      createFields.forEach((field) => {
        resetData[field.key as string] = "";
      });
      setFormData(resetData);

      // Callback and refresh
      if (onCreated && data.item) {
        onCreated(data.item as T);
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  // Update item
  const handleUpdate = async (id: string, updates: Partial<T>) => {
    setUpdatingId(id);
    setError(null);

    try {
      const res = await fetch(`${apiEndpoint}?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to update item");
        return;
      }

      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`${apiEndpoint}?id=${encodeURIComponent(deleteId)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to delete item");
      } else {
        if (onDeleted) onDeleted(deleteId);
        await load();
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // Process items for display
  let displayItems = [...items];
  if (filterFn) {
    displayItems = displayItems.filter(filterFn);
  }
  if (sortFn) {
    displayItems.sort(sortFn);
  }

  // Check if primary field has content for button state
  const primaryField = createFields.find((f) => f.required) || createFields[0];
  const canCreate = primaryField
    ? !!formData[primaryField.key as string]?.trim()
    : true;

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <button className="btn" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Create Form */}
      <div className="space-y-2">
        <div
          className={`grid gap-2 ${
            createFields.some((f) => f.colSpan === 2)
              ? "grid-cols-1"
              : createFields.length > 1
              ? "grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {createFields.map((field) => (
            <div
              key={String(field.key)}
              className={field.colSpan === 2 ? "col-span-full" : ""}
            >
              {field.type === "textarea" ? (
                <textarea
                  className="input min-h-[90px]"
                  placeholder={field.placeholder || String(field.key)}
                  value={formData[field.key as string] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key as string]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.metaKey || e.ctrlKey) &&
                      canCreate
                    ) {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  className="input"
                  value={formData[field.key as string] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key as string]: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {field.placeholder || `Select ${field.label || String(field.key)}`}
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300"
                    checked={formData[field.key as string] === "true"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.key as string]: e.target.checked.toString(),
                      }))
                    }
                  />
                  <span className="text-sm">
                    {field.label || String(field.key)}
                  </span>
                </label>
              ) : (
                <input
                  type={field.type}
                  className="input"
                  placeholder={field.placeholder || String(field.key)}
                  value={formData[field.key as string] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key as string]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreate) {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {createFields.some((f) => f.type === "textarea") && (
            <span className="text-xs text-zinc-500">Ctrl+Enter to save</span>
          )}
          <button
            className="btn btn-primary ml-auto"
            onClick={handleCreate}
            disabled={saving || !canCreate}
          >
            {saving ? "Adding..." : createButtonText}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div role="alert" aria-live="polite" className="text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Items List */}
      {loading ? (
        skeleton || <DefaultSkeleton count={skeletonCount} />
      ) : displayItems.length === 0 ? (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
        />
      ) : (
        <div className="space-y-2">
          {displayItems.map((item) =>
            renderItem(item, {
              onEdit: () => {
                // Edit mode is handled by renderItem
              },
              onDelete: () => setDeleteId(item.id),
              onUpdate: (updates) => handleUpdate(item.id, updates),
              isUpdating: updatingId === item.id,
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Delete ${title.slice(0, -1)}`}
        message={deleteConfirmMessage}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

// ============================================================================
// Helper Components for Common Patterns
// ============================================================================

export type ItemRowProps<T> = {
  item: T;
  displayContent: ReactNode;
  editForm: ReactNode;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  onDelete: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
  error: string | null;
  timestamp?: string;
};

/**
 * Generic item row component with edit/delete actions
 */
export function ItemRow<T>({
  displayContent,
  editForm,
  editing,
  setEditing,
  onDelete,
  onSave,
  saving,
  error,
  timestamp,
}: ItemRowProps<T>) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
      {timestamp && (
        <div className="text-xs text-zinc-500">
          {new Date(timestamp).toLocaleString()}
        </div>
      )}

      {!editing ? (
        <>
          <div className="mt-1">{displayContent}</div>
          <div className="mt-2 flex gap-2">
            <button className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              className="btn text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          {editForm}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrudPanel;
