/**
 * Component Tests: TimelinePanel
 * 
 * Tests timeline panel functionality including:
 * - Loading states
 * - Empty states
 * - Error states
 * - Event display
 * - Pagination (expand/collapse)
 * - Icon and color mapping
 * - Refresh functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimelinePanel from "@/components/TimelinePanel";

// Mock date-fns
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns");
  return {
    ...actual,
    formatDistanceToNow: vi.fn(() => "2 hours ago"),
  };
});

describe("TimelinePanel", () => {
  const mockApplicationId = "app-123";
  
  const mockEvents = [
    {
      id: "evt-1",
      type: "created",
      title: "Application created",
      description: "Applied to Software Engineer position",
      date: "2026-02-01T10:00:00Z",
      icon: "plus",
      color: "green",
    },
    {
      id: "evt-2",
      type: "note",
      title: "Note added",
      description: "Researched company culture",
      date: "2026-02-01T11:00:00Z",
      icon: "note",
      color: "blue",
    },
    {
      id: "evt-3",
      type: "task",
      title: "Task completed",
      description: "Prepare resume",
      date: "2026-02-01T12:00:00Z",
      icon: "check",
      color: "green",
    },
    {
      id: "evt-4",
      type: "interview",
      title: "Interview scheduled",
      description: "Technical interview on Feb 10",
      date: "2026-02-01T14:00:00Z",
      icon: "calendar",
      color: "purple",
    },
    {
      id: "evt-5",
      type: "audit",
      title: "Stage changed",
      description: "Moved from Applied to Interview",
      date: "2026-02-01T15:00:00Z",
      icon: "edit",
      color: "yellow",
    },
    {
      id: "evt-6",
      type: "contact",
      title: "Contact added",
      description: "Added John Smith (Recruiter)",
      date: "2026-02-01T16:00:00Z",
      icon: "user",
      color: "teal",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading skeleton while fetching", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      // Should show loading skeleton (animate-pulse)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows loading text on button", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no events", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: [] }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("No activity recorded yet")).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("shows error message on API failure", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Failed to load timeline" } }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Failed to load timeline")).toBeInTheDocument();
      });
    });

    it("shows generic error on network failure", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Failed to load timeline")).toBeInTheDocument();
      });
    });
  });

  describe("Event Display", () => {
    beforeEach(() => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents }),
      });
    });

    it("fetches timeline from API", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/applications/${mockApplicationId}/timeline`,
          { cache: "no-store" }
        );
      });
    });

    it("renders event titles", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Application created")).toBeInTheDocument();
        expect(screen.getByText("Note added")).toBeInTheDocument();
        expect(screen.getByText("Task completed")).toBeInTheDocument();
      });
    });

    it("renders event descriptions", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Applied to Software Engineer position")).toBeInTheDocument();
        expect(screen.getByText("Researched company culture")).toBeInTheDocument();
      });
    });

    it("shows relative time for events", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        // All events should show "2 hours ago" (mocked)
        const timeLabels = screen.getAllByText("2 hours ago");
        expect(timeLabels.length).toBeGreaterThan(0);
      });
    });

    it("shows panel title", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      expect(screen.getByText("Activity Timeline")).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    beforeEach(() => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents }),
      });
    });

    it("shows only first 5 events initially", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Application created")).toBeInTheDocument();
        expect(screen.getByText("Stage changed")).toBeInTheDocument();
        // 6th event should not be visible initially
        expect(screen.queryByText("Contact added")).not.toBeInTheDocument();
      });
    });

    it("shows expand button when more than 5 events", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Show 1 more events")).toBeInTheDocument();
      });
    });

    it("shows all events when expanded", async () => {
      const user = userEvent.setup();
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Show 1 more events")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("Show 1 more events"));
      
      await waitFor(() => {
        expect(screen.getByText("Contact added")).toBeInTheDocument();
      });
    });

    it("shows collapse button when expanded", async () => {
      const user = userEvent.setup();
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Show 1 more events")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("Show 1 more events"));
      
      await waitFor(() => {
        expect(screen.getByText("Show less")).toBeInTheDocument();
      });
    });

    it("collapses back when Show less is clicked", async () => {
      const user = userEvent.setup();
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Show 1 more events")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("Show 1 more events"));
      await user.click(screen.getByText("Show less"));
      
      await waitFor(() => {
        expect(screen.queryByText("Contact added")).not.toBeInTheDocument();
      });
    });

    it("does not show expand button when 5 or fewer events", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents.slice(0, 5) }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Application created")).toBeInTheDocument();
      });
      
      expect(screen.queryByText(/Show .* more events/)).not.toBeInTheDocument();
    });
  });

  describe("Refresh", () => {
    it("has refresh button", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
    });

    it("refetches data when refresh is clicked", async () => {
      const user = userEvent.setup();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
      
      // Clear mock to track new calls
      (global.fetch as ReturnType<typeof vi.fn>).mockClear();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents }),
      });
      
      await user.click(screen.getByText("Refresh"));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/applications/${mockApplicationId}/timeline`,
          { cache: "no-store" }
        );
      });
    });

    it("disables refresh button while loading", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      const refreshButton = screen.getByText("Loading...");
      expect(refreshButton).toBeDisabled();
    });
  });

  describe("Visual Styling", () => {
    beforeEach(() => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: mockEvents.slice(0, 3) }),
      });
    });

    it("renders vertical timeline line", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Application created")).toBeInTheDocument();
      });
      
      // Check for the vertical line element
      const line = document.querySelector(".w-0\\.5.bg-zinc-200");
      expect(line).toBeInTheDocument();
    });

    it("renders colored icons for events", async () => {
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Application created")).toBeInTheDocument();
      });
      
      // Check for colored icon containers
      const iconContainers = document.querySelectorAll(".rounded-full.flex.items-center");
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe("Different Event Types", () => {
    it("handles all event types", async () => {
      const allTypeEvents = [
        { id: "1", type: "created", title: "Created", date: "2026-02-01T10:00:00Z", icon: "plus", color: "green" },
        { id: "2", type: "note", title: "Note", date: "2026-02-01T10:00:00Z", icon: "note", color: "blue" },
        { id: "3", type: "task", title: "Task", date: "2026-02-01T10:00:00Z", icon: "task", color: "yellow" },
        { id: "4", type: "interview", title: "Interview", date: "2026-02-01T10:00:00Z", icon: "calendar", color: "purple" },
        { id: "5", type: "contact", title: "Contact", date: "2026-02-01T10:00:00Z", icon: "user", color: "teal" },
      ];
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: allTypeEvents }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Created")).toBeInTheDocument();
        expect(screen.getByText("Note")).toBeInTheDocument();
        expect(screen.getByText("Task")).toBeInTheDocument();
        expect(screen.getByText("Interview")).toBeInTheDocument();
        expect(screen.getByText("Contact")).toBeInTheDocument();
      });
    });

    it("handles events without description", async () => {
      const eventWithoutDescription = [
        { id: "1", type: "audit", title: "Stage changed", date: "2026-02-01T10:00:00Z", icon: "edit", color: "yellow" },
      ];
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: eventWithoutDescription }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        expect(screen.getByText("Stage changed")).toBeInTheDocument();
      });
    });

    it("handles unknown icon gracefully", async () => {
      const eventWithUnknownIcon = [
        { id: "1", type: "audit", title: "Unknown action", date: "2026-02-01T10:00:00Z", icon: "unknown", color: "blue" },
      ];
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: eventWithUnknownIcon }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        // Should fall back to info icon
        expect(screen.getByText("Unknown action")).toBeInTheDocument();
      });
    });

    it("handles unknown color gracefully", async () => {
      const eventWithUnknownColor = [
        { id: "1", type: "audit", title: "Custom color", date: "2026-02-01T10:00:00Z", icon: "info", color: "pink" },
      ];
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ events: eventWithUnknownColor }),
      });
      
      render(<TimelinePanel applicationId={mockApplicationId} />);
      
      await waitFor(() => {
        // Should fall back to blue color
        expect(screen.getByText("Custom color")).toBeInTheDocument();
      });
    });
  });
});
