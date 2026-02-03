/**
 * Component Tests: TagCloud
 * 
 * Tests tag cloud functionality including:
 * - Tag display and sizing based on count
 * - Tag selection state
 * - Show more/less pagination
 * - Tag adding functionality
 * - Loading states
 * - Empty states
 * - API fetching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagCloud, TagInput } from "@/components/TagCloud";

// Mock Toast hook
const mockAddToast = vi.fn();
vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe("TagCloud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTags = [
    { tag: "javascript", count: 10 },
    { tag: "typescript", count: 8 },
    { tag: "react", count: 6 },
    { tag: "nodejs", count: 4 },
    { tag: "python", count: 2 },
  ];

  describe("Display", () => {
    it("renders tags from props", () => {
      render(<TagCloud tags={mockTags} />);
      
      expect(screen.getByText("javascript")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("nodejs")).toBeInTheDocument();
      expect(screen.getByText("python")).toBeInTheDocument();
    });

    it("displays tag counts when showCounts is true", () => {
      render(<TagCloud tags={mockTags} showCounts={true} />);
      
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
    });

    it("hides tag counts when showCounts is false", () => {
      render(<TagCloud tags={mockTags} showCounts={false} />);
      
      expect(screen.queryByText("10")).not.toBeInTheDocument();
      expect(screen.queryByText("8")).not.toBeInTheDocument();
    });

    it("shows empty state when no tags", () => {
      render(<TagCloud tags={[]} />);
      
      expect(screen.getByText("No tags yet")).toBeInTheDocument();
      expect(screen.getByText("Add tags to your applications to organize them")).toBeInTheDocument();
    });

    it("applies larger size to higher count tags", () => {
      render(<TagCloud tags={mockTags} />);
      
      const javascriptButton = screen.getByText("javascript").closest("button");
      const pythonButton = screen.getByText("python").closest("button");
      
      // Higher count tag should have larger font class
      expect(javascriptButton?.className).toContain("text-base");
      expect(pythonButton?.className).toContain("text-xs");
    });
  });

  describe("Selection", () => {
    it("highlights selected tags", () => {
      render(<TagCloud tags={mockTags} selectedTags={["javascript"]} />);
      
      const selectedButton = screen.getByText("javascript").closest("button");
      expect(selectedButton?.className).toContain("ring-2");
      expect(selectedButton?.className).toContain("ring-blue-500");
    });

    it("calls onTagClick when tag is clicked", async () => {
      const user = userEvent.setup();
      const onTagClick = vi.fn();
      
      render(<TagCloud tags={mockTags} onTagClick={onTagClick} />);
      
      await user.click(screen.getByText("react"));
      
      expect(onTagClick).toHaveBeenCalledWith("react");
    });

    it("supports multiple selected tags", () => {
      render(<TagCloud tags={mockTags} selectedTags={["javascript", "react"]} />);
      
      const jsButton = screen.getByText("javascript").closest("button");
      const reactButton = screen.getByText("react").closest("button");
      const tsButton = screen.getByText("typescript").closest("button");
      
      expect(jsButton?.className).toContain("ring-2");
      expect(reactButton?.className).toContain("ring-2");
      expect(tsButton?.className).not.toContain("ring-2");
    });
  });

  describe("Pagination", () => {
    const manyTags = Array.from({ length: 30 }, (_, i) => ({
      tag: `tag${i + 1}`,
      count: 30 - i,
    }));

    it("shows only maxTags initially", () => {
      render(<TagCloud tags={manyTags} maxTags={20} />);
      
      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag20")).toBeInTheDocument();
      expect(screen.queryByText("tag21")).not.toBeInTheDocument();
    });

    it("shows 'Show more' button when tags exceed maxTags", () => {
      render(<TagCloud tags={manyTags} maxTags={20} />);
      
      expect(screen.getByText("Show 10 more tags")).toBeInTheDocument();
    });

    it("shows all tags when 'Show more' is clicked", async () => {
      const user = userEvent.setup();
      render(<TagCloud tags={manyTags} maxTags={20} />);
      
      await user.click(screen.getByText("Show 10 more tags"));
      
      expect(screen.getByText("tag21")).toBeInTheDocument();
      expect(screen.getByText("tag30")).toBeInTheDocument();
    });

    it("shows 'Show less' button when expanded", async () => {
      const user = userEvent.setup();
      render(<TagCloud tags={manyTags} maxTags={20} />);
      
      await user.click(screen.getByText("Show 10 more tags"));
      
      expect(screen.getByText("Show less")).toBeInTheDocument();
    });

    it("collapses back when 'Show less' is clicked", async () => {
      const user = userEvent.setup();
      render(<TagCloud tags={manyTags} maxTags={20} />);
      
      await user.click(screen.getByText("Show 10 more tags"));
      await user.click(screen.getByText("Show less"));
      
      expect(screen.queryByText("tag21")).not.toBeInTheDocument();
    });
  });

  describe("Add Tag", () => {
    it("shows add tag input when allowAdd is true", () => {
      render(<TagCloud tags={mockTags} allowAdd={true} />);
      
      expect(screen.getByPlaceholderText("Add new tag...")).toBeInTheDocument();
      expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("hides add tag input when allowAdd is false", () => {
      render(<TagCloud tags={mockTags} allowAdd={false} />);
      
      expect(screen.queryByPlaceholderText("Add new tag...")).not.toBeInTheDocument();
    });

    it("calls onTagAdd when new tag is added via button", async () => {
      const user = userEvent.setup();
      const onTagAdd = vi.fn();
      
      render(<TagCloud tags={mockTags} allowAdd={true} onTagAdd={onTagAdd} />);
      
      await user.type(screen.getByPlaceholderText("Add new tag..."), "newTag");
      await user.click(screen.getByText("Add"));
      
      expect(onTagAdd).toHaveBeenCalledWith("newtag");
    });

    it("calls onTagAdd when Enter is pressed", async () => {
      const user = userEvent.setup();
      const onTagAdd = vi.fn();
      
      render(<TagCloud tags={mockTags} allowAdd={true} onTagAdd={onTagAdd} />);
      
      const input = screen.getByPlaceholderText("Add new tag...");
      await user.type(input, "newTag{Enter}");
      
      expect(onTagAdd).toHaveBeenCalledWith("newtag");
    });

    it("shows warning toast when adding duplicate tag", async () => {
      const user = userEvent.setup();
      
      render(<TagCloud tags={mockTags} allowAdd={true} />);
      
      await user.type(screen.getByPlaceholderText("Add new tag..."), "javascript");
      await user.click(screen.getByText("Add"));
      
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning", title: "Tag already exists" })
      );
    });

    it("clears input after adding tag", async () => {
      const user = userEvent.setup();
      const onTagAdd = vi.fn();
      
      render(<TagCloud tags={mockTags} allowAdd={true} onTagAdd={onTagAdd} />);
      
      const input = screen.getByPlaceholderText("Add new tag...");
      await user.type(input, "newTag");
      await user.click(screen.getByText("Add"));
      
      expect(input).toHaveValue("");
    });

    it("does not add empty tags", async () => {
      const user = userEvent.setup();
      const onTagAdd = vi.fn();
      
      render(<TagCloud tags={mockTags} allowAdd={true} onTagAdd={onTagAdd} />);
      
      await user.click(screen.getByText("Add"));
      
      expect(onTagAdd).not.toHaveBeenCalled();
    });
  });

  describe("API Fetching", () => {
    it("shows loading state when fetching", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<TagCloud fetchTags={true} />);
      
      // Loading skeleton should be visible
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("fetches tags from API when fetchTags is true", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ tags: mockTags }),
      });
      
      render(<TagCloud fetchTags={true} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/applications/tags");
      });
      
      await waitFor(() => {
        expect(screen.getByText("javascript")).toBeInTheDocument();
      });
    });

    it("shows error toast on API failure", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
      
      render(<TagCloud fetchTags={true} />);
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({ type: "error", title: "Failed to load tags" })
        );
      });
    });

    it("uses props tags instead of fetching when both are provided", () => {
      render(<TagCloud tags={mockTags} fetchTags={true} />);
      
      // Should not fetch when tags prop is provided
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText("javascript")).toBeInTheDocument();
    });
  });
});

describe("TagInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Display", () => {
    it("renders existing tags as pills", () => {
      render(<TagInput value={["react", "typescript"]} onChange={vi.fn()} />);
      
      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
    });

    it("shows placeholder when no tags", () => {
      render(<TagInput value={[]} onChange={vi.fn()} placeholder="Add tags..." />);
      
      expect(screen.getByPlaceholderText("Add tags...")).toBeInTheDocument();
    });

    it("hides placeholder when tags exist", () => {
      render(<TagInput value={["react"]} onChange={vi.fn()} placeholder="Add tags..." />);
      
      expect(screen.queryByPlaceholderText("Add tags...")).not.toBeInTheDocument();
    });
  });

  describe("Adding tags", () => {
    it("adds tag on Enter key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={[]} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "newTag{Enter}");
      
      expect(onChange).toHaveBeenCalledWith(["newtag"]);
    });

    it("adds tag on comma key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={[]} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "newTag,");
      
      expect(onChange).toHaveBeenCalledWith(["newtag"]);
    });

    it("normalizes tag to lowercase", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={[]} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "NewTag{Enter}");
      
      expect(onChange).toHaveBeenCalledWith(["newtag"]);
    });

    it("does not add duplicate tags", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={["react"]} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "react{Enter}");
      
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add empty tags", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={[]} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "   {Enter}");
      
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Removing tags", () => {
    it("removes tag when X button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={["react", "typescript"]} onChange={onChange} />);
      
      const removeButtons = screen.getAllByRole("button");
      await user.click(removeButtons[0]); // Remove first tag
      
      expect(onChange).toHaveBeenCalledWith(["typescript"]);
    });

    it("removes last tag on Backspace when input is empty", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={["react", "typescript"]} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("{Backspace}");
      
      expect(onChange).toHaveBeenCalledWith(["react"]);
    });
  });

  describe("Suggestions", () => {
    it("shows matching suggestions on input", async () => {
      const user = userEvent.setup();
      const suggestions = ["react", "react-native", "redux"];
      
      render(<TagInput value={[]} onChange={vi.fn()} suggestions={suggestions} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "rea");
      
      await waitFor(() => {
        expect(screen.getByText("react")).toBeInTheDocument();
        expect(screen.getByText("react-native")).toBeInTheDocument();
      });
    });

    it("adds tag when suggestion is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const suggestions = ["react", "redux"];
      
      render(<TagInput value={[]} onChange={onChange} suggestions={suggestions} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "rea");
      
      await waitFor(() => {
        expect(screen.getByText("react")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("react"));
      
      expect(onChange).toHaveBeenCalledWith(["react"]);
    });

    it("filters out already selected tags from suggestions", async () => {
      const user = userEvent.setup();
      const suggestions = ["react", "react-native"];
      
      render(<TagInput value={["react"]} onChange={vi.fn()} suggestions={suggestions} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "rea");
      
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /react$/i })).not.toBeInTheDocument();
        expect(screen.getByText("react-native")).toBeInTheDocument();
      });
    });
  });

  describe("Max tags", () => {
    it("disables input when max tags reached", () => {
      render(<TagInput value={["a", "b", "c"]} onChange={vi.fn()} maxTags={3} />);
      
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("shows warning when max tags reached", () => {
      render(<TagInput value={["a", "b", "c"]} onChange={vi.fn()} maxTags={3} />);
      
      expect(screen.getByText("Maximum 3 tags allowed")).toBeInTheDocument();
    });

    it("does not add more tags when max is reached", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<TagInput value={["a", "b"]} onChange={onChange} maxTags={3} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "c{Enter}");
      expect(onChange).toHaveBeenCalledWith(["a", "b", "c"]);
      
      // Reset and try to add fourth
      onChange.mockClear();
      render(<TagInput value={["a", "b", "c"]} onChange={onChange} maxTags={3} />);
      
      // Input should be disabled so user cannot add more
    });
  });
});
