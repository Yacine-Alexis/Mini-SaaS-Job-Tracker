/**
 * API Route Tests: /api/applications/[id]
 * Tests for single application CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockJobApplication,
} from "../../../utils/factories";
import {
  mockPrismaClient,
  resetPrismaMocks,
  mockUserId,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  createGETRequest,
  createPATCHRequest,
  createDELETERequest,
  parseJsonResponse,
} from "../../../utils/mocks";

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
import { GET, PATCH, DELETE } from "@/app/api/applications/[id]/route";
import { requireUserOr401 } from "@/lib/auth";

// Helper to create route context
function createRouteContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("/api/applications/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  describe("GET /api/applications/[id]", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createGETRequest("/api/applications/abc123");
      const response = await GET(request, createRouteContext("abc123"));

      expect(response.status).toBe(401);
    });

    it("should return application with related data", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const mockAppWithRelations = {
        ...mockApp,
        notes: [],
        tasks: [],
        contacts: [],
        attachmentLinks: [],
        interviews: [],
        documents: [],
        salaryOffers: [],
      };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(mockAppWithRelations);

      const request = createGETRequest("/api/applications/app123");
      const response = await GET(request, createRouteContext("app123"));

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof mockAppWithRelations }>(response);
      expect(data.item.id).toBe("app123");
      expect(data.item.userId).toBe(mockUserId);
    });

    it("should return 404 when application not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(null);

      const request = createGETRequest("/api/applications/nonexistent");
      const response = await GET(request, createRouteContext("nonexistent"));

      expect(response.status).toBe(404);

      const data = await parseJsonResponse<{ error: { code: string } }>(response);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("should not return other users' applications", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      // Simulate Prisma not finding the app because userId doesn't match
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(null);

      const request = createGETRequest("/api/applications/other-user-app");
      const response = await GET(request, createRouteContext("other-user-app"));

      expect(response.status).toBe(404);

      // Verify the query included userId filter
      expect(mockPrismaClient.jobApplication.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe("PATCH /api/applications/[id]", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPATCHRequest("/api/applications/abc123", {
        company: "Updated Company",
      });
      const response = await PATCH(request, createRouteContext("abc123"));

      expect(response.status).toBe(401);
    });

    it("should update application fields", async () => {
      const existingApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const updatedApp = {
        ...existingApp,
        company: "Updated Company",
        title: "Updated Title",
      };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(existingApp);
      mockPrismaClient.jobApplication.update.mockResolvedValue(updatedApp);

      const request = createPATCHRequest("/api/applications/app123", {
        company: "Updated Company",
        title: "Updated Title",
      });
      const response = await PATCH(request, createRouteContext("app123"));

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedApp }>(response);
      expect(data.item.company).toBe("Updated Company");
      expect(data.item.title).toBe("Updated Title");
    });

    it("should return 404 when application not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(null);

      const request = createPATCHRequest("/api/applications/nonexistent", {
        company: "Updated",
      });
      const response = await PATCH(request, createRouteContext("nonexistent"));

      expect(response.status).toBe(404);
    });

    it("should update stage", async () => {
      const existingApp = createMockJobApplication({
        userId: mockUserId,
        id: "app123",
        stage: "SAVED" as const,
      });
      const updatedApp = { ...existingApp, stage: "APPLIED" as const };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(existingApp);
      mockPrismaClient.jobApplication.update.mockResolvedValue(updatedApp);

      const request = createPATCHRequest("/api/applications/app123", {
        stage: "APPLIED",
      });
      const response = await PATCH(request, createRouteContext("app123"));

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedApp }>(response);
      expect(data.item.stage).toBe("APPLIED");
    });

    it("should reject invalid stage value", async () => {
      const existingApp = createMockJobApplication({ userId: mockUserId, id: "app123" });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(existingApp);

      const request = createPATCHRequest("/api/applications/app123", {
        stage: "INVALID_STAGE",
      });
      const response = await PATCH(request, createRouteContext("app123"));

      expect(response.status).toBe(400);
    });

    it("should update salary range", async () => {
      const existingApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const updatedApp = { ...existingApp, salaryMin: 100000, salaryMax: 150000 };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(existingApp);
      mockPrismaClient.jobApplication.update.mockResolvedValue(updatedApp);

      const request = createPATCHRequest("/api/applications/app123", {
        salaryMin: 100000,
        salaryMax: 150000,
      });
      const response = await PATCH(request, createRouteContext("app123"));

      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/applications/[id]", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createDELETERequest("/api/applications/abc123");
      const response = await DELETE(request, createRouteContext("abc123"));

      expect(response.status).toBe(401);
    });

    it("should soft delete application", async () => {
      const existingApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const deletedApp = { ...existingApp, deletedAt: new Date() };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(existingApp);
      mockPrismaClient.jobApplication.update.mockResolvedValue(deletedApp);

      const request = createDELETERequest("/api/applications/app123");
      const response = await DELETE(request, createRouteContext("app123"));

      expect(response.status).toBe(200);

      // Verify soft delete (update with deletedAt, not actual delete)
      expect(mockPrismaClient.jobApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "app123" },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return 404 when application not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(null);

      const request = createDELETERequest("/api/applications/nonexistent");
      const response = await DELETE(request, createRouteContext("nonexistent"));

      expect(response.status).toBe(404);
    });

    it("should cascade soft delete related records", async () => {
      const existingApp = createMockJobApplication({ userId: mockUserId, id: "app123" });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(existingApp);
      mockPrismaClient.jobApplication.update.mockResolvedValue({ ...existingApp, deletedAt: new Date() });
      // Mock cascade deletes for notes, tasks, contacts, attachmentLinks
      mockPrismaClient.note.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaClient.task.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.contact.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.attachmentLink.updateMany.mockResolvedValue({ count: 1 });

      const request = createDELETERequest("/api/applications/app123");
      const response = await DELETE(request, createRouteContext("app123"));

      expect(response.status).toBe(200);
    });
  });
});
