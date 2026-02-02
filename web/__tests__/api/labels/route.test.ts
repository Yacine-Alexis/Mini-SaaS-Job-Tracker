/**
 * API Route Tests: /api/labels
 * Tests for CRUD operations on custom labels
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockLabel,
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
import { GET, POST, PATCH, DELETE } from "@/app/api/labels/route";
import { requireUserOr401 } from "@/lib/auth";

describe("/api/labels", () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  describe("GET /api/labels", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createGETRequest("/api/labels");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return all labels for user", async () => {
      const mockLabels = [
        createMockLabel({ userId: mockUserId, name: "Priority", color: "#ff0000" }),
        createMockLabel({ userId: mockUserId, name: "Follow-up", color: "#00ff00" }),
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findMany.mockResolvedValue(mockLabels);

      const request = createGETRequest("/api/labels");
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ items: typeof mockLabels }>(response);
      expect(data.items).toHaveLength(2);
      expect(data.items[0].name).toBe("Priority");
    });

    it("should only return non-deleted labels", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/labels");
      await GET(request);

      expect(mockPrismaClient.label.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe("POST /api/labels", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPOSTRequest("/api/labels", {
        name: "New Label",
        color: "#3b82f6",
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should create a new label", async () => {
      const newLabel = createMockLabel({
        userId: mockUserId,
        name: "Urgent",
        color: "#ef4444",
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValue(null); // No duplicate
      mockPrismaClient.label.create.mockResolvedValue(newLabel);

      const request = createPOSTRequest("/api/labels", {
        name: "Urgent",
        color: "#ef4444",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await parseJsonResponse<{ item: typeof newLabel }>(response);
      expect(data.item.name).toBe("Urgent");
      expect(data.item.color).toBe("#ef4444");
    });

    it("should reject duplicate label name", async () => {
      const existingLabel = createMockLabel({
        userId: mockUserId,
        name: "Urgent",
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValue(existingLabel);

      const request = createPOSTRequest("/api/labels", {
        name: "Urgent",
        color: "#ef4444",
      });
      const response = await POST(request);

      expect(response.status).toBe(409);

      const data = await parseJsonResponse<{ error: { code: string } }>(response);
      expect(data.error.code).toBe("DUPLICATE");
    });

    it("should validate color format", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/labels", {
        name: "Test",
        color: "not-a-color",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should require name field", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/labels", {
        color: "#3b82f6",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/labels", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPATCHRequest("/api/labels", {
        id: "label123",
        name: "Updated Name",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it("should update label name", async () => {
      const existingLabel = createMockLabel({
        userId: mockUserId,
        id: "label123",
        name: "Old Name",
      });
      const updatedLabel = { ...existingLabel, name: "New Name" };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValueOnce(existingLabel); // Find existing
      mockPrismaClient.label.findFirst.mockResolvedValueOnce(null); // No duplicate with new name
      mockPrismaClient.label.update.mockResolvedValue(updatedLabel);

      const request = createPATCHRequest("/api/labels", {
        id: "label123",
        name: "New Name",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedLabel }>(response);
      expect(data.item.name).toBe("New Name");
    });

    it("should update label color", async () => {
      const existingLabel = createMockLabel({
        userId: mockUserId,
        id: "label123",
        color: "#ff0000",
      });
      const updatedLabel = { ...existingLabel, color: "#00ff00" };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValue(existingLabel);
      mockPrismaClient.label.update.mockResolvedValue(updatedLabel);

      const request = createPATCHRequest("/api/labels", {
        id: "label123",
        color: "#00ff00",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedLabel }>(response);
      expect(data.item.color).toBe("#00ff00");
    });

    it("should return 404 when label not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValue(null);

      const request = createPATCHRequest("/api/labels", {
        id: "nonexistent",
        name: "Updated",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(404);
    });

    it("should reject duplicate name on update", async () => {
      const existingLabel = createMockLabel({
        userId: mockUserId,
        id: "label123",
        name: "Label 1",
      });
      const conflictingLabel = createMockLabel({
        userId: mockUserId,
        id: "label456",
        name: "Label 2",
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValueOnce(existingLabel);
      mockPrismaClient.label.findFirst.mockResolvedValueOnce(conflictingLabel); // Duplicate found

      const request = createPATCHRequest("/api/labels", {
        id: "label123",
        name: "Label 2", // Already exists
      });
      const response = await PATCH(request);

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /api/labels", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createDELETERequest("/api/labels", { id: "label123" });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should soft delete label", async () => {
      const existingLabel = createMockLabel({ userId: mockUserId, id: "label123" });
      const deletedLabel = { ...existingLabel, deletedAt: new Date() };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValue(existingLabel);
      mockPrismaClient.label.update.mockResolvedValue(deletedLabel);

      const request = createDELETERequest("/api/labels", { id: "label123" });
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      expect(mockPrismaClient.label.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return 404 when label not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.label.findFirst.mockResolvedValue(null);

      const request = createDELETERequest("/api/labels", { id: "nonexistent" });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
    });

    it("should reject missing id parameter", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createDELETERequest("/api/labels");
      const response = await DELETE(request);

      expect(response.status).toBe(400);
    });
  });
});
