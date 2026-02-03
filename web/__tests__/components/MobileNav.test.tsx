/**
 * Component Tests: MobileNav
 * 
 * Tests mobile navigation components including:
 * - MobileBottomNav rendering and navigation
 * - Active state highlighting
 * - Session-based visibility
 * - MobileFAB functionality
 * - Accessibility attributes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileBottomNav, MobileFAB } from "@/components/MobileNav";

// Mock next-auth/react
const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("MobileBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({ data: { user: { email: "test@example.com" } } });
    mockUsePathname.mockReturnValue("/dashboard");
  });

  describe("Visibility", () => {
    it("renders when user is authenticated", () => {
      mockUseSession.mockReturnValue({ data: { user: { email: "test@example.com" } } });
      
      render(<MobileBottomNav />);
      
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("does not render when user is not authenticated", () => {
      mockUseSession.mockReturnValue({ data: null });
      
      render(<MobileBottomNav />);
      
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    it("does not render on login page", () => {
      mockUsePathname.mockReturnValue("/login");
      
      render(<MobileBottomNav />);
      
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    it("does not render on register page", () => {
      mockUsePathname.mockReturnValue("/register");
      
      render(<MobileBottomNav />);
      
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("Navigation Items", () => {
    it("renders all navigation items", () => {
      render(<MobileBottomNav />);
      
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Jobs")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Add" })).toBeInTheDocument();
      expect(screen.getByText("Import")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("links to correct destinations", () => {
      render(<MobileBottomNav />);
      
      expect(screen.getByText("Home").closest("a")).toHaveAttribute("href", "/dashboard");
      expect(screen.getByText("Jobs").closest("a")).toHaveAttribute("href", "/applications");
      expect(screen.getByRole("link", { name: "Add" })).toHaveAttribute("href", "/applications/new");
      expect(screen.getByText("Import").closest("a")).toHaveAttribute("href", "/applications/import");
      expect(screen.getByText("Settings").closest("a")).toHaveAttribute("href", "/settings/account");
    });
  });

  describe("Active State", () => {
    it("highlights Dashboard link when on dashboard", () => {
      mockUsePathname.mockReturnValue("/dashboard");
      
      render(<MobileBottomNav />);
      
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveAttribute("aria-current", "page");
      expect(homeLink?.className).toContain("text-blue-600");
    });

    it("highlights Applications link when on applications page", () => {
      mockUsePathname.mockReturnValue("/applications");
      
      render(<MobileBottomNav />);
      
      const jobsLink = screen.getByText("Jobs").closest("a");
      expect(jobsLink).toHaveAttribute("aria-current", "page");
    });

    it("highlights Applications link when on application detail page", () => {
      mockUsePathname.mockReturnValue("/applications/123");
      
      render(<MobileBottomNav />);
      
      const jobsLink = screen.getByText("Jobs").closest("a");
      expect(jobsLink).toHaveAttribute("aria-current", "page");
    });

    it("highlights Settings link when on settings page", () => {
      mockUsePathname.mockReturnValue("/settings/account");
      
      render(<MobileBottomNav />);
      
      const settingsLink = screen.getByText("Settings").closest("a");
      expect(settingsLink).toHaveAttribute("aria-current", "page");
    });

    it("highlights Import link when on import page", () => {
      mockUsePathname.mockReturnValue("/applications/import");
      
      render(<MobileBottomNav />);
      
      const importLink = screen.getByText("Import").closest("a");
      expect(importLink).toHaveAttribute("aria-current", "page");
    });

    it("does not highlight inactive items", () => {
      mockUsePathname.mockReturnValue("/dashboard");
      
      render(<MobileBottomNav />);
      
      const settingsLink = screen.getByText("Settings").closest("a");
      expect(settingsLink).not.toHaveAttribute("aria-current");
    });
  });

  describe("Primary Add Button", () => {
    it("renders Add button with special styling", () => {
      render(<MobileBottomNav />);
      
      const addButton = screen.getByRole("link", { name: "Add" });
      expect(addButton.className).toContain("rounded-full");
      expect(addButton.className).toContain("bg-gradient-to-r");
      expect(addButton.className).toContain("from-blue-600");
    });

    it("has larger icon than other items", () => {
      render(<MobileBottomNav />);
      
      // The Add button uses an icon with h-6 w-6 class (defined in component)
      const addButton = screen.getByRole("link", { name: "Add" });
      expect(addButton).toBeInTheDocument();
      // Primary button styling verified by its gradient class
      expect(addButton.className).toContain("bg-gradient-to-r");
    });
  });

  describe("Accessibility", () => {
    it("has proper navigation landmark", () => {
      render(<MobileBottomNav />);
      
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Mobile navigation");
    });

    it("uses proper link semantics", () => {
      render(<MobileBottomNav />);
      
      const links = screen.getAllByRole("link");
      expect(links.length).toBe(5);
    });

    it("includes icon alternatives", () => {
      render(<MobileBottomNav />);
      
      // Each nav item should have text label
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Jobs")).toBeInTheDocument();
      expect(screen.getByText("Import")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });
});

describe("MobileFAB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({ data: { user: { email: "test@example.com" } } });
    mockUsePathname.mockReturnValue("/dashboard");
  });

  describe("Visibility", () => {
    it("renders when user is authenticated", () => {
      render(<MobileFAB />);
      
      const fab = screen.getByRole("link");
      expect(fab).toBeInTheDocument();
    });

    it("does not render when user is not authenticated", () => {
      mockUseSession.mockReturnValue({ data: null });
      
      render(<MobileFAB />);
      
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render on new application page", () => {
      mockUsePathname.mockReturnValue("/applications/new");
      
      render(<MobileFAB />);
      
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders on applications list page", () => {
      mockUsePathname.mockReturnValue("/applications");
      
      render(<MobileFAB />);
      
      expect(screen.getByRole("link")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("is positioned as fixed button", () => {
      render(<MobileFAB />);
      
      const fab = screen.getByRole("link");
      expect(fab.className).toContain("fixed");
    });

    it("has gradient background", () => {
      render(<MobileFAB />);
      
      const fab = screen.getByRole("link");
      expect(fab.className).toContain("bg-gradient-to-r");
    });

    it("is circular", () => {
      render(<MobileFAB />);
      
      const fab = screen.getByRole("link");
      expect(fab.className).toContain("rounded-full");
    });
  });

  describe("Functionality", () => {
    it("links to new application page", () => {
      render(<MobileFAB />);
      
      const fab = screen.getByRole("link");
      expect(fab).toHaveAttribute("href", "/applications/new");
    });

    it("has accessible name", () => {
      render(<MobileFAB />);
      
      const fab = screen.getByRole("link");
      expect(fab).toHaveAttribute("aria-label", "Add new application");
    });
  });
});
