import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import {
  setUser,
  clearUser,
  captureException,
  captureApiError,
  addBreadcrumb,
  withErrorTracking,
} from "../sentry";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setTag: vi.fn(),
      setExtra: vi.fn(),
      setLevel: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };
    callback(scope);
    return scope;
  }),
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
  startInactiveSpan: vi.fn(() => ({
    end: vi.fn(),
  })),
  startSpan: vi.fn((_, callback) => callback()),
}));

describe("Sentry utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setUser", () => {
    it("sets user ID in Sentry", () => {
      setUser("user-123");

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "user-123",
      });
    });

    it("includes email in non-production", () => {
      // In test environment (NODE_ENV = 'test'), email should be included
      // since it's not 'production'
      setUser("user-123", "test@example.com");

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "user-123",
        email: "test@example.com",
      });
    });

    it("sets plan tag when provided", () => {
      setUser("user-123", undefined, "PRO");

      expect(Sentry.setTag).toHaveBeenCalledWith("user.plan", "PRO");
    });
  });

  describe("clearUser", () => {
    it("clears user from Sentry", () => {
      clearUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe("captureException", () => {
    it("captures exception with Sentry", () => {
      const error = new Error("Test error");

      captureException(error);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("sets tags when provided", () => {
      const error = new Error("Test error");
      let capturedScope: any;

      vi.mocked(Sentry.withScope).mockImplementation((callback) => {
        capturedScope = {
          setTag: vi.fn(),
          setExtra: vi.fn(),
          setLevel: vi.fn(),
        };
        callback(capturedScope as any);
      });

      captureException(error, {
        tags: { api: "applications", action: "create" },
      });

      expect(capturedScope.setTag).toHaveBeenCalledWith("api", "applications");
      expect(capturedScope.setTag).toHaveBeenCalledWith("action", "create");
    });

    it("sets extra data when provided", () => {
      const error = new Error("Test error");
      let capturedScope: any;

      vi.mocked(Sentry.withScope).mockImplementation((callback) => {
        capturedScope = {
          setTag: vi.fn(),
          setExtra: vi.fn(),
          setLevel: vi.fn(),
        };
        callback(capturedScope as any);
      });

      captureException(error, {
        extra: { userId: "user-123", applicationId: "app-456" },
      });

      expect(capturedScope.setExtra).toHaveBeenCalledWith("userId", "user-123");
      expect(capturedScope.setExtra).toHaveBeenCalledWith("applicationId", "app-456");
    });

    it("sets severity level when provided", () => {
      const error = new Error("Test error");
      let capturedScope: any;

      vi.mocked(Sentry.withScope).mockImplementation((callback) => {
        capturedScope = {
          setTag: vi.fn(),
          setExtra: vi.fn(),
          setLevel: vi.fn(),
        };
        callback(capturedScope as any);
      });

      captureException(error, {
        level: "warning",
      });

      expect(capturedScope.setLevel).toHaveBeenCalledWith("warning");
    });
  });

  describe("captureApiError", () => {
    it("captures API error with request context", () => {
      const error = new Error("API error");
      const mockRequest = {
        url: "http://localhost:3000/api/applications",
        method: "POST",
        headers: new Headers({
          "user-agent": "Mozilla/5.0",
          "content-type": "application/json",
        }),
      } as unknown as Request;

      let capturedScope: any;
      vi.mocked(Sentry.withScope).mockImplementation((callback) => {
        capturedScope = {
          setTag: vi.fn(),
          setExtra: vi.fn(),
          setUser: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope as any);
      });

      captureApiError(error, mockRequest as any);

      expect(capturedScope.setTag).toHaveBeenCalledWith("api.method", "POST");
      expect(capturedScope.setTag).toHaveBeenCalledWith("api.path", "/api/applications");
      expect(capturedScope.setContext).toHaveBeenCalledWith("request", expect.objectContaining({
        url: "/api/applications",
        method: "POST",
      }));
    });

    it("sets user context when userId provided", () => {
      const error = new Error("API error");
      const mockRequest = {
        url: "http://localhost:3000/api/applications",
        method: "GET",
        headers: new Headers(),
      } as unknown as Request;

      let capturedScope: any;
      vi.mocked(Sentry.withScope).mockImplementation((callback) => {
        capturedScope = {
          setTag: vi.fn(),
          setExtra: vi.fn(),
          setUser: vi.fn(),
          setContext: vi.fn(),
        };
        callback(capturedScope as any);
      });

      captureApiError(error, mockRequest as any, { userId: "user-123" });

      expect(capturedScope.setUser).toHaveBeenCalledWith({ id: "user-123" });
    });
  });

  describe("addBreadcrumb", () => {
    it("adds breadcrumb to Sentry", () => {
      addBreadcrumb("User clicked save", "ui");

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User clicked save",
          category: "ui",
          level: "info",
        })
      );
    });

    it("includes data when provided", () => {
      addBreadcrumb("Navigate to dashboard", "navigation", { from: "/login" });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Navigate to dashboard",
          category: "navigation",
          data: { from: "/login" },
        })
      );
    });

    it("includes timestamp", () => {
      const before = Date.now() / 1000;
      addBreadcrumb("Test", "info");
      const after = Date.now() / 1000;

      const call = vi.mocked(Sentry.addBreadcrumb).mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(before);
      expect(call.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("withErrorTracking", () => {
    it("returns result from wrapped function", async () => {
      const result = await withErrorTracking(async () => "success");

      expect(result).toBe("success");
    });

    it("captures and rethrows exceptions", async () => {
      const error = new Error("Tracked error");

      await expect(
        withErrorTracking(async () => {
          throw error;
        })
      ).rejects.toThrow("Tracked error");

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it("starts a span with operation name", async () => {
      await withErrorTracking(async () => "result", {
        operation: "createApplication",
      });

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "createApplication",
          op: "function",
        }),
        expect.any(Function)
      );
    });
  });
});
