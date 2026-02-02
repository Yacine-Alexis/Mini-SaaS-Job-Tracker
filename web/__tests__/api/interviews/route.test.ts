/**
 * API Route Tests: /api/interviews
 * Tests for CRUD operations on interviews
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockInterview,
  createMockJobApplication,
} from "../../utils/factories";
import {
  mockPrismaClient,
  resetPrismaMocks,
  mockUserId,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  createGETRequest,
  createPOSTRequest,
  createPATCHRequest,
  createDELETERequest,
  parseJsonResponse,
} from "../../utils/mocks";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: mockPrismaClient,
}));

vi.mock("@/lib/auth", () => ({
  requireUserOr401: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  audit: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocking
import { GET, POST, PATCH, DELETE } from "@/app/api/interviews/route";
import { requireUserOr401 } from "@/lib/auth";

describe("/api/interviews", () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  describe("GET /api/interviews", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createGETRequest("/api/interviews");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return interviews for authenticated user", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId });
      const mockInterviews = [
        { ...createMockInterview({ userId: mockUserId, applicationId: mockApp.id }), application: mockApp },
        { ...createMockInterview({ userId: mockUserId, applicationId: mockApp.id }), application: mockApp },
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.count.mockResolvedValue(2);
      mockPrismaClient.interview.findMany.mockResolvedValue(mockInterviews);

      const request = createGETRequest("/api/interviews");
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ items: typeof mockInterviews; total: number }>(response);
      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it("should filter by applicationId", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.count.mockResolvedValue(0);
      mockPrismaClient.interview.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/interviews", {
        applicationId: "app123",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.interview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            applicationId: "app123",
          }),
        })
      );
    });

    it("should filter by date range", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.count.mockResolvedValue(0);
      mockPrismaClient.interview.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/interviews", {
        start: "2026-02-01T00:00:00Z",
        end: "2026-02-28T23:59:59Z",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.interview.findMany).toHaveBeenCalled();
    });

    it("should include application details", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId, company: "Tech Corp" });
      const mockInterviews = [
        { ...createMockInterview({ userId: mockUserId, applicationId: mockApp.id }), application: mockApp },
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.count.mockResolvedValue(1);
      mockPrismaClient.interview.findMany.mockResolvedValue(mockInterviews);

      const request = createGETRequest("/api/interviews");
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ items: typeof mockInterviews }>(response);
      expect(data.items[0].application.company).toBe("Tech Corp");
    });
  });

  describe("POST /api/interviews", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPOSTRequest("/api/interviews", {
        applicationId: "app123",
        scheduledAt: "2026-02-15T10:00:00Z",
        type: "VIDEO",
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should create a new interview", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const newInterview = createMockInterview({
        userId: mockUserId,
        applicationId: "app123",
        type: "VIDEO" as const,
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(mockApp);
      mockPrismaClient.interview.create.mockResolvedValue(newInterview);

      const request = createPOSTRequest("/api/interviews", {
        applicationId: "app123",
        scheduledAt: "2026-02-15T10:00:00Z",
        type: "VIDEO",
        duration: 60,
        location: "https://zoom.us/j/123456",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await parseJsonResponse<{ item: typeof newInterview }>(response);
      expect(data.item.applicationId).toBe("app123");
      expect(data.item.type).toBe("VIDEO");
    });

    it("should reject invalid interview type", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/interviews", {
        applicationId: "app123",
        scheduledAt: "2026-02-15T10:00:00Z",
        type: "INVALID_TYPE",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await parseJsonResponse<{ error: { code: string } }>(response);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject if application not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(null);

      const request = createPOSTRequest("/api/interviews", {
        applicationId: "nonexistent",
        scheduledAt: "2026-02-15T10:00:00Z",
        type: "PHONE",
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it("should validate duration range", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/interviews", {
        applicationId: "app123",
        scheduledAt: "2026-02-15T10:00:00Z",
        type: "VIDEO",
        duration: 1000, // Too long
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/interviews", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPATCHRequest("/api/interviews", {
        id: "int123",
        result: "PASSED",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it("should update interview fields", async () => {
      const existingInterview = createMockInterview({
        userId: mockUserId,
        id: "int123",
        result: "PENDING" as const,
      });
      const updatedInterview = { ...existingInterview, result: "PASSED" as const, feedback: "Great interview!" };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.findFirst.mockResolvedValue(existingInterview);
      mockPrismaClient.interview.update.mockResolvedValue(updatedInterview);

      const request = createPATCHRequest("/api/interviews", {
        id: "int123",
        result: "PASSED",
        feedback: "Great interview!",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedInterview }>(response);
      expect(data.item.result).toBe("PASSED");
      expect(data.item.feedback).toBe("Great interview!");
    });

    it("should return 404 when interview not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.findFirst.mockResolvedValue(null);

      const request = createPATCHRequest("/api/interviews", {
        id: "nonexistent",
        result: "PASSED",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(404);
    });

    it("should reject missing id", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPATCHRequest("/api/interviews", {
        result: "PASSED",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/interviews", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createDELETERequest("/api/interviews", { id: "int123" });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should soft delete interview", async () => {
      const existingInterview = createMockInterview({ userId: mockUserId, id: "int123" });
      const deletedInterview = { ...existingInterview, deletedAt: new Date() };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.findFirst.mockResolvedValue(existingInterview);
      mockPrismaClient.interview.update.mockResolvedValue(deletedInterview);

      const request = createDELETERequest("/api/interviews", { id: "int123" });
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      expect(mockPrismaClient.interview.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return 404 when interview not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.interview.findFirst.mockResolvedValue(null);

      const request = createDELETERequest("/api/interviews", { id: "nonexistent" });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
    });

    it("should reject missing id parameter", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createDELETERequest("/api/interviews");
      const response = await DELETE(request);

      expect(response.status).toBe(400);
    });
  });
});
