import "@testing-library/jest-dom";
import { vi } from "vitest";
import * as React from "react";

// Make React available globally for JSX runtime
(globalThis as any).React = React;

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver with a proper class
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe = vi.fn((element: Element) => {
    // Immediately call callback with fake entry to simulate observation
    this.callback(
      [
        {
          target: element,
          contentRect: { width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400, x: 0, y: 0 } as DOMRectReadOnly,
          borderBoxSize: [{ inlineSize: 800, blockSize: 400 }],
          contentBoxSize: [{ inlineSize: 800, blockSize: 400 }],
          devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 400 }],
        } as ResizeObserverEntry,
      ],
      this
    );
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock offsetWidth and offsetHeight for virtualization tests
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get: function() { return 800; },
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get: function() { return 400; },
});

// Mock IntersectionObserver (required for Next.js Link component)
const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
}));
global.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Suppress console.error in tests (optional, comment out for debugging)
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
