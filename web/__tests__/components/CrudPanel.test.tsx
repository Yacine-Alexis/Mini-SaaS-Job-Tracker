/**
 * Tests for CrudPanel component and ItemRow
 * 
 * Note: CrudPanel integration tests are complex due to fetch mocking in jsdom.
 * Focus here is on ItemRow component and basic CrudPanel rendering.
 * Full integration tests should use e2e testing with Playwright.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrudPanel, ItemRow, type FieldConfig } from "@/components/ui/CrudPanel";

type TestNote = {
  id: string;
  content: string;
  createdAt?: string;
};

const createDefaultProps = () => ({
  title: "Notes",
  applicationId: "app-123",
  apiEndpoint: "/api/notes",
  emptyState: {
    icon: "notes" as const,
    title: "No notes yet",
    description: "Add notes to track important details.",
  },
  createFields: [
    {
      key: "content" as keyof TestNote,
      type: "textarea" as const,
      placeholder: "Add a note...",
      required: true,
    },
  ] as FieldConfig<TestNote>[],
  renderItem: (
    note: TestNote,
    { onDelete }: { onDelete: () => void; onEdit: () => void; onUpdate: (updates: Partial<TestNote>) => Promise<void>; isUpdating: boolean }
  ) => (
    <div key={note.id} data-testid={`note-${note.id}`}>
      <span>{note.content}</span>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
});

describe("CrudPanel", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("loading state", () => {
    it("shows skeleton while loading", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ items: [] }) }), 100)
          )
      );

      render(<CrudPanel<TestNote> {...createDefaultProps()} />);

      // Should show default skeleton
      expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("shows custom skeleton when provided", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ items: [] }) }), 100)
          )
      );

      render(
        <CrudPanel<TestNote>
          {...createDefaultProps()}
          skeleton={<div data-testid="custom-skeleton">Loading...</div>}
        />
      );

      expect(screen.getByTestId("custom-skeleton")).toBeInTheDocument();
    });
  });

  describe("form functionality", () => {
    it("renders create form with fields", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      render(<CrudPanel<TestNote> {...createDefaultProps()} />);

      // Form elements should render
      expect(screen.getByPlaceholderText("Add a note...")).toBeInTheDocument();
    });

    it("shows add button disabled initially", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      render(<CrudPanel<TestNote> {...createDefaultProps()} />);

      // Add button should be disabled when form is empty
      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).toBeDisabled();
    });
  });
});

describe("ItemRow", () => {
  it("renders display content", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    
    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Custom content</span>}
        editForm={<input />}
        editing={false}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });

  it("shows edit and delete buttons in display mode", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={false}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls setEditing when edit clicked", () => {
    const setEditing = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={false}
        setEditing={setEditing}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(setEditing).toHaveBeenCalledWith(true);
  });

  it("calls onDelete when delete clicked", () => {
    const onDelete = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={false}
        setEditing={vi.fn()}
        onDelete={onDelete}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows edit form in editing mode", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input data-testid="edit-input" />}
        editing={true}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    expect(screen.getByTestId("edit-input")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("displays timestamp when provided", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Display content</span>}
        editForm={<input />}
        editing={false}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
        timestamp="2026-01-15T10:00:00Z"
      />
    );

    // Timestamp should be displayed in some localized format
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("shows error message when error is provided", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={true}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error="Something went wrong"
      />
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("disables buttons when saving", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={true}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={true}
        error={null}
      />
    );

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("calls onSave when save button clicked", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={true}
        setEditing={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it("calls setEditing(false) when cancel clicked", () => {
    const setEditing = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemRow
        item={{ id: "1", name: "Test" }}
        displayContent={<span>Content</span>}
        editForm={<input />}
        editing={true}
        setEditing={setEditing}
        onDelete={vi.fn()}
        onSave={onSave}
        saving={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(setEditing).toHaveBeenCalledWith(false);
  });
});

