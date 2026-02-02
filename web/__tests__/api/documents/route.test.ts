/**
 * API Route Tests: /api/documents
 * Tests for CRUD operations on documents (resumes, cover letters, etc.)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockDocument,
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
import { GET, POST, PATCH, DELETE } from "@/app/api/documents/route";
import { requireUserOr401 } from "@/lib/auth";

describe("/api/documents", () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  describe("GET /api/documents", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createGETRequest("/api/documents");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return all documents for user", async () => {
      const mockDocs = [
        { ...createMockDocument({ userId: mockUserId, type: "RESUME" as const }), application: null },
        { ...createMockDocument({ userId: mockUserId, type: "COVER_LETTER" as const }), application: null },
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findMany.mockResolvedValue(mockDocs);

      const request = createGETRequest("/api/documents");
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ items: typeof mockDocs }>(response);
      expect(data.items).toHaveLength(2);
    });

    it("should filter by document type", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/documents", {
        type: "RESUME",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "RESUME",
          }),
        })
      );
    });

    it("should filter by applicationId", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/documents", {
        applicationId: "app123",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            applicationId: "app123",
          }),
        })
      );
    });

    it("should include application details when linked", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId, company: "Tech Corp" });
      const mockDocs = [
        {
          ...createMockDocument({ userId: mockUserId, applicationId: mockApp.id }),
          application: { id: mockApp.id, company: mockApp.company, title: mockApp.title },
        },
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findMany.mockResolvedValue(mockDocs);

      const request = createGETRequest("/api/documents");
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ items: typeof mockDocs }>(response);
      expect(data.items[0].application?.company).toBe("Tech Corp");
    });
  });

  describe("POST /api/documents", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPOSTRequest("/api/documents", {
        name: "My Resume",
        type: "RESUME",
        fileName: "resume.pdf",
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should create a new document", async () => {
      const newDoc = createMockDocument({
        userId: mockUserId,
        name: "Technical Resume",
        type: "RESUME" as const,
        fileName: "technical_resume.pdf",
        fileUrl: "https://drive.google.com/file/123",
        version: "v2",
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.create.mockResolvedValue(newDoc);

      const request = createPOSTRequest("/api/documents", {
        name: "Technical Resume",
        type: "RESUME",
        fileName: "technical_resume.pdf",
        fileUrl: "https://drive.google.com/file/123",
        version: "v2",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await parseJsonResponse<{ item: typeof newDoc }>(response);
      expect(data.item.name).toBe("Technical Resume");
      expect(data.item.type).toBe("RESUME");
    });

    it("should set as default document", async () => {
      const newDoc = createMockDocument({
        userId: mockUserId,
        type: "RESUME" as const,
        isDefault: true,
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      // First, unset other defaults
      mockPrismaClient.document.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.document.create.mockResolvedValue(newDoc);

      const request = createPOSTRequest("/api/documents", {
        name: "Default Resume",
        type: "RESUME",
        fileName: "default.pdf",
        isDefault: true,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      // Verify updateMany was called to unset other defaults
      expect(mockPrismaClient.document.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            type: "RESUME",
            deletedAt: null,
          }),
          data: { isDefault: false },
        })
      );
    });

    it("should validate document type", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/documents", {
        name: "My Doc",
        type: "INVALID_TYPE",
        fileName: "file.pdf",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should require name and fileName", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/documents", {
        type: "RESUME",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should validate URL format if provided", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/documents", {
        name: "Resume",
        type: "RESUME",
        fileName: "resume.pdf",
        fileUrl: "not-a-valid-url",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/documents", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPATCHRequest("/api/documents", {
        id: "doc123",
        name: "Updated Name",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it("should update document fields", async () => {
      const existingDoc = createMockDocument({
        userId: mockUserId,
        id: "doc123",
        name: "Old Name",
      });
      const updatedDoc = { ...existingDoc, name: "New Name", version: "v3" };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findFirst.mockResolvedValue(existingDoc);
      mockPrismaClient.document.update.mockResolvedValue(updatedDoc);

      const request = createPATCHRequest("/api/documents", {
        id: "doc123",
        name: "New Name",
        version: "v3",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedDoc }>(response);
      expect(data.item.name).toBe("New Name");
      expect(data.item.version).toBe("v3");
    });

    it("should update default status and unset others", async () => {
      const existingDoc = createMockDocument({
        userId: mockUserId,
        id: "doc123",
        type: "RESUME" as const,
        isDefault: false,
      });
      const updatedDoc = { ...existingDoc, isDefault: true };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findFirst.mockResolvedValue(existingDoc);
      mockPrismaClient.document.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.document.update.mockResolvedValue(updatedDoc);

      const request = createPATCHRequest("/api/documents", {
        id: "doc123",
        isDefault: true,
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);
    });

    it("should return 404 when document not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findFirst.mockResolvedValue(null);

      const request = createPATCHRequest("/api/documents", {
        id: "nonexistent",
        name: "Updated",
      });
      const response = await PATCH(request);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/documents", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createDELETERequest("/api/documents", { id: "doc123" });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should soft delete document", async () => {
      const existingDoc = createMockDocument({ userId: mockUserId, id: "doc123" });
      const deletedDoc = { ...existingDoc, deletedAt: new Date() };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findFirst.mockResolvedValue(existingDoc);
      mockPrismaClient.document.update.mockResolvedValue(deletedDoc);

      const request = createDELETERequest("/api/documents", { id: "doc123" });
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      expect(mockPrismaClient.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return 404 when document not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.document.findFirst.mockResolvedValue(null);

      const request = createDELETERequest("/api/documents", { id: "nonexistent" });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
    });
  });
});
