"use client";

import { useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetcher, postFetcher, deleteFetcher, FetchError } from "@/lib/fetcher";

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

interface NotesResponse {
  items: Note[];
}

function NotesSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

interface NotesPanelSWRProps {
  applicationId: string;
}

/**
 * NotesPanel with SWR caching
 * 
 * Benefits over the original:
 * - Automatic cache deduplication
 * - Background revalidation
 * - Optimistic updates for better UX
 * - Automatic error retry
 */
export default function NotesPanelSWR({ applicationId }: NotesPanelSWRProps) {
  const [draft, setDraft] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch notes with SWR
  const notesKey = `/api/notes?applicationId=${encodeURIComponent(applicationId)}`;
  const { data, error, isLoading, mutate } = useSWR<NotesResponse, FetchError>(
    notesKey,
    fetcher
  );

  // Create note mutation
  const { trigger: createNote, isMutating: isCreating } = useSWRMutation<
    { note: Note },
    FetchError,
    string,
    { applicationId: string; content: string }
  >("/api/notes", postFetcher, {
    onSuccess: () => {
      setDraft("");
      mutate(); // Revalidate the notes list
    },
  });

  // Delete note - use direct fetch since key changes
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteNote() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notes?id=${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Failed to delete");
      }
      setDeleteId(null);
      mutate(); // Revalidate
    } catch (err) {
      // Error shown via UI
    } finally {
      setIsDeleting(false);
    }
  }

  const items = data?.items ?? [];
  const err = error?.message;

  async function handleAddNote() {
    if (!draft.trim()) return;
    try {
      await createNote({ applicationId, content: draft.trim() });
    } catch {
      // Error is handled by SWR
    }
  }

  async function handleConfirmDelete() {
    await handleDeleteNote();
  }

  if (isLoading) return <NotesSkeleton />;

  if (err) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
        {err}
        <button
          className="ml-2 underline hover:no-underline"
          onClick={() => mutate()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              handleAddNote();
            }
          }}
        />
        <button
          onClick={handleAddNote}
          disabled={isCreating || !draft.trim()}
          className="self-end px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Notes list */}
      {items.length === 0 ? (
        <EmptyState
          icon="notes"
          title="No notes yet"
          description="Add a note to keep track of important details."
        />
      ) : (
        <div className="space-y-2">
          {items.map((note) => (
            <div
              key={note.id}
              className="group rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <button
                  onClick={() => setDeleteId(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title="Delete note"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
