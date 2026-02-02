/**
 * API Route Tests: /api/salary-offers
 * Tests for CRUD operations on salary offers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockSalaryOffer,
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
import { GET, POST, PATCH, DELETE } from "@/app/api/salary-offers/route";
import { requireUserOr401 } from "@/lib/auth";

describe("/api/salary-offers", () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  describe("GET /api/salary-offers", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createGETRequest("/api/salary-offers");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return salary offers for application", async () => {
      const mockOffers = [
        createMockSalaryOffer({ userId: mockUserId, applicationId: "app123", type: "INITIAL_OFFER" }),
        createMockSalaryOffer({ userId: mockUserId, applicationId: "app123", type: "COUNTER_OFFER" }),
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findMany.mockResolvedValue(mockOffers);

      const request = createGETRequest("/api/salary-offers", {
        applicationId: "app123",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ items: typeof mockOffers }>(response);
      expect(data.items).toHaveLength(2);
    });

    it("should require applicationId parameter", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createGETRequest("/api/salary-offers");
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should order by offerDate ascending", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/salary-offers", {
        applicationId: "app123",
      });
      await GET(request);

      expect(mockPrismaClient.salaryOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            offerDate: "asc",
          }),
        })
      );
    });
  });

  describe("POST /api/salary-offers", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPOSTRequest("/api/salary-offers", {
        applicationId: "app123",
        type: "INITIAL_OFFER",
        baseSalary: 100000,
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should create a new salary offer", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const newOffer = createMockSalaryOffer({
        userId: mockUserId,
        applicationId: "app123",
        type: "INITIAL_OFFER",
        baseSalary: 120000,
        bonus: 15000,
        currency: "USD",
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(mockApp);
      mockPrismaClient.salaryOffer.create.mockResolvedValue(newOffer);

      const request = createPOSTRequest("/api/salary-offers", {
        applicationId: "app123",
        type: "INITIAL_OFFER",
        baseSalary: 120000,
        bonus: 15000,
        currency: "USD",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await parseJsonResponse<{ item: typeof newOffer }>(response);
      expect(data.item.baseSalary).toBe(120000);
      expect(data.item.bonus).toBe(15000);
    });

    it("should reject if application not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(null);

      const request = createPOSTRequest("/api/salary-offers", {
        applicationId: "nonexistent",
        type: "INITIAL_OFFER",
        baseSalary: 100000,
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it("should validate offer type", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/salary-offers", {
        applicationId: "app123",
        type: "INVALID_TYPE",
        baseSalary: 100000,
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should validate salary ranges", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());

      const request = createPOSTRequest("/api/salary-offers", {
        applicationId: "app123",
        type: "INITIAL_OFFER",
        baseSalary: -1000, // Negative salary
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should accept all optional fields", async () => {
      const mockApp = createMockJobApplication({ userId: mockUserId, id: "app123" });
      const newOffer = createMockSalaryOffer({
        userId: mockUserId,
        applicationId: "app123",
        type: "FINAL_OFFER",
        baseSalary: 150000,
        bonus: 20000,
        equity: "10,000 RSUs over 4 years",
        signingBonus: 25000,
        benefits: "Health, Dental, Vision, 401k match",
        notes: "Negotiated from initial offer",
        isAccepted: true,
      });

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.findFirst.mockResolvedValue(mockApp);
      mockPrismaClient.salaryOffer.create.mockResolvedValue(newOffer);

      const request = createPOSTRequest("/api/salary-offers", {
        applicationId: "app123",
        type: "FINAL_OFFER",
        baseSalary: 150000,
        bonus: 20000,
        equity: "10,000 RSUs over 4 years",
        signingBonus: 25000,
        benefits: "Health, Dental, Vision, 401k match",
        notes: "Negotiated from initial offer",
        isAccepted: true,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("PATCH /api/salary-offers", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createPATCHRequest("/api/salary-offers", {
        id: "offer123",
        baseSalary: 130000,
      });
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it("should update salary offer", async () => {
      const existingOffer = createMockSalaryOffer({
        userId: mockUserId,
        id: "offer123",
        baseSalary: 100000,
      });
      const updatedOffer = { ...existingOffer, baseSalary: 130000 };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findFirst.mockResolvedValue(existingOffer);
      mockPrismaClient.salaryOffer.update.mockResolvedValue(updatedOffer);

      const request = createPATCHRequest("/api/salary-offers", {
        id: "offer123",
        baseSalary: 130000,
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedOffer }>(response);
      expect(data.item.baseSalary).toBe(130000);
    });

    it("should update acceptance status", async () => {
      const existingOffer = createMockSalaryOffer({
        userId: mockUserId,
        id: "offer123",
        isAccepted: null,
      });
      const updatedOffer = { ...existingOffer, isAccepted: true };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findFirst.mockResolvedValue(existingOffer);
      mockPrismaClient.salaryOffer.update.mockResolvedValue(updatedOffer);

      const request = createPATCHRequest("/api/salary-offers", {
        id: "offer123",
        isAccepted: true,
      });
      const response = await PATCH(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{ item: typeof updatedOffer }>(response);
      expect(data.item.isAccepted).toBe(true);
    });

    it("should return 404 when offer not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findFirst.mockResolvedValue(null);

      const request = createPATCHRequest("/api/salary-offers", {
        id: "nonexistent",
        baseSalary: 130000,
      });
      const response = await PATCH(request);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/salary-offers", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createDELETERequest("/api/salary-offers", { id: "offer123" });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should soft delete salary offer", async () => {
      const existingOffer = createMockSalaryOffer({ userId: mockUserId, id: "offer123" });
      const deletedOffer = { ...existingOffer, deletedAt: new Date() };

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findFirst.mockResolvedValue(existingOffer);
      mockPrismaClient.salaryOffer.update.mockResolvedValue(deletedOffer);

      const request = createDELETERequest("/api/salary-offers", { id: "offer123" });
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      expect(mockPrismaClient.salaryOffer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it("should return 404 when offer not found", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.salaryOffer.findFirst.mockResolvedValue(null);

      const request = createDELETERequest("/api/salary-offers", { id: "nonexistent" });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
    });
  });
});
