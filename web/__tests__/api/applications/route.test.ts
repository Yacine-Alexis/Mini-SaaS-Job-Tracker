/**
 * API Route Tests: /api/applications
 * Tests for CRUD operations on job applications
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createMockJobApplication,
  createMockUser,
} from "../../utils/factories";
import {
  mockPrismaClient,
  resetPrismaMocks,
  mockUserId,
  mockAuthenticatedUser,
  mockAuthenticatedUserWithPlan,
  mockUnauthenticatedUser,
  mockUnauthenticatedUserWithPlan,
  createGETRequest,
  createPOSTRequest,
  parseJsonResponse,
} from "../../utils/mocks";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: mockPrismaClient,
}));

vi.mock("@/lib/auth", () => ({
  requireUserOr401: vi.fn(),
  requireUserWithPlanOr401: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  audit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/plan", () => ({
  getUserPlan: vi.fn().mockResolvedValue("PRO"),
  isPro: vi.fn().mockReturnValue(true),
  LIMITS: { FREE_MAX_APPLICATIONS: 200 },
}));

// Import after mocking
import { GET, POST } from "@/app/api/applications/route";
import { requireUserOr401, requireUserWithPlanOr401 } from "@/lib/auth";
import { getUserPlan, isPro } from "@/lib/plan";

describe("/api/applications", () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  describe("GET /api/applications", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockUnauthenticatedUser());

      const request = createGETRequest("/api/applications");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return paginated applications for authenticated user", async () => {
      const mockApps = [
        createMockJobApplication({ userId: mockUserId }),
        createMockJobApplication({ userId: mockUserId }),
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.count.mockResolvedValue(2);
      mockPrismaClient.jobApplication.findMany.mockResolvedValue(mockApps);

      const request = createGETRequest("/api/applications", {
        page: "1",
        pageSize: "10",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<{
        items: typeof mockApps;
        total: number;
        page: number;
        pageSize: number;
      }>(response);

      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(10);
    });

    it("should filter by stage", async () => {
      const mockApps = [
        createMockJobApplication({ userId: mockUserId, stage: "APPLIED" as const }),
      ];

      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.count.mockResolvedValue(1);
      mockPrismaClient.jobApplication.findMany.mockResolvedValue(mockApps);

      const request = createGETRequest("/api/applications", {
        stage: "APPLIED",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: "APPLIED",
          }),
        })
      );
    });

    it("should filter by search query", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.count.mockResolvedValue(0);
      mockPrismaClient.jobApplication.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/applications", {
        search: "Google",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                company: expect.objectContaining({ contains: "Google" }),
              }),
            ]),
          }),
        })
      );
    });

    it("should sort by specified field and direction", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.count.mockResolvedValue(0);
      mockPrismaClient.jobApplication.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/applications", {
        sortBy: "company",
        sortDir: "asc",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { company: "asc" },
        })
      );
    });

    it("should filter by date range", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.count.mockResolvedValue(0);
      mockPrismaClient.jobApplication.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/applications", {
        dateFrom: "2026-01-01",
        dateTo: "2026-01-31",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrismaClient.jobApplication.findMany).toHaveBeenCalled();
    });

    it("should filter by tags", async () => {
      vi.mocked(requireUserOr401).mockResolvedValue(mockAuthenticatedUser());
      mockPrismaClient.jobApplication.count.mockResolvedValue(0);
      mockPrismaClient.jobApplication.findMany.mockResolvedValue([]);

      const request = createGETRequest("/api/applications", {
        tags: "react,typescript",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/applications", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(requireUserWithPlanOr401).mockResolvedValue(mockUnauthenticatedUserWithPlan());

      const request = createPOSTRequest("/api/applications", {
        company: "Test Co",
        title: "Developer",
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should create a new application", async () => {
      const newApp = createMockJobApplication({
        userId: mockUserId,
        company: "Test Company",
        title: "Software Engineer",
      });

      vi.mocked(requireUserWithPlanOr401).mockResolvedValue(mockAuthenticatedUserWithPlan(mockUserId, "PRO"));
      mockPrismaClient.jobApplication.create.mockResolvedValue(newApp);

      const request = createPOSTRequest("/api/applications", {
        company: "Test Company",
        title: "Software Engineer",
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await parseJsonResponse<{ item: typeof newApp }>(response);
      expect(data.item.company).toBe("Test Company");
      expect(data.item.title).toBe("Software Engineer");
    });

    it("should reject invalid input", async () => {
      vi.mocked(requireUserWithPlanOr401).mockResolvedValue(mockAuthenticatedUserWithPlan(mockUserId, "PRO"));

      const request = createPOSTRequest("/api/applications", {
        company: "", // Empty company should fail validation
        title: "Developer",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await parseJsonResponse<{ error: { code: string } }>(response);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should enforce free plan limit", async () => {
      vi.mocked(requireUserWithPlanOr401).mockResolvedValue(mockAuthenticatedUserWithPlan(mockUserId, "FREE"));
      mockPrismaClient.jobApplication.count.mockResolvedValue(200); // At limit

      const request = createPOSTRequest("/api/applications", {
        company: "Test Company",
        title: "Developer",
      });
      const response = await POST(request);

      expect(response.status).toBe(403);

      const data = await parseJsonResponse<{ error: { code: string } }>(response);
      expect(data.error.code).toBe("PLAN_LIMIT");
    });

    it("should validate URL format", async () => {
      vi.mocked(requireUserWithPlanOr401).mockResolvedValue(mockAuthenticatedUserWithPlan(mockUserId, "PRO"));

      const request = createPOSTRequest("/api/applications", {
        company: "Test Company",
        title: "Developer",
        url: "not-a-valid-url",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should accept valid optional fields", async () => {
      const newApp = createMockJobApplication({
        userId: mockUserId,
        company: "Tech Corp",
        title: "Senior Engineer",
        location: "San Francisco, CA",
        salaryMin: 150000,
        salaryMax: 200000,
        priority: "HIGH" as const,
        remoteType: "REMOTE" as const,
        tags: ["react", "typescript"],
      });

      vi.mocked(requireUserWithPlanOr401).mockResolvedValue(mockAuthenticatedUserWithPlan(mockUserId, "PRO"));
      mockPrismaClient.jobApplication.create.mockResolvedValue(newApp);

      const request = createPOSTRequest("/api/applications", {
        company: "Tech Corp",
        title: "Senior Engineer",
        location: "San Francisco, CA",
        salaryMin: 150000,
        salaryMax: 200000,
        priority: "HIGH",
        remoteType: "REMOTE",
        tags: ["react", "typescript"],
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});
