import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/applications/bulk/route";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: {
    jobApplication: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireUserOr401: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  enforceRateLimitAsync: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/audit", () => ({
  audit: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";

const mockPrisma = prisma as unknown as {
  jobApplication: {
    findMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const mockAuth = requireUserOr401 as ReturnType<typeof vi.fn>;

// Valid cuid-like IDs for testing
const testId1 = "clwx12345678901234";
const testId2 = "clwx09876543210987";
const testId3 = "clwx11111111111111";

describe("POST /api/applications/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost:3000/api/applications/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  describe("authentication", () => {
    it("returns 401 if user not authenticated", async () => {
      const mockError = { status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) };
      mockAuth.mockResolvedValue({ userId: null, error: mockError });

      const req = createRequest({ ids: [testId1], operation: "delete" });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  describe("delete operation", () => {
    it("soft deletes valid applications", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: [] },
        { id: testId2, tags: [] },
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 2 });

      const req = createRequest({
        ids: [testId1, testId2],
        operation: "delete",
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.deleted).toBe(2);
      expect(body.failed).toBe(0);
    });

    it("reports failed deletions for invalid ids", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: [] },
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 1 });

      const req = createRequest({
        ids: [testId1, testId2], // testId2 will be "not found"
        operation: "delete",
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.deleted).toBe(1);
      expect(body.failed).toBe(1);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0].id).toBe(testId2);
    });
  });

  describe("update operation", () => {
    it("updates stage for multiple applications", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: [] },
        { id: testId2, tags: [] },
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 2 });

      const req = createRequest({
        ids: [testId1, testId2],
        operation: "update",
        fields: { stage: "INTERVIEW" },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.updated).toBe(2);
    });

    it("updates priority for applications", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: [] },
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 1 });

      const req = createRequest({
        ids: [testId1],
        operation: "update",
        fields: { priority: "HIGH" },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.updated).toBe(1);
    });

    it("replaces all tags with new tags", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: ["old"] },
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 1 });

      const req = createRequest({
        ids: [testId1],
        operation: "update",
        fields: { tags: ["new", "tags"] },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.updated).toBe(1);
      expect(mockPrisma.jobApplication.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tags: ["new", "tags"] }),
        })
      );
    });

    it("adds tags to existing tags", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: ["existing"] },
        { id: testId2, tags: ["other"] },
      ]);
      mockPrisma.jobApplication.update.mockResolvedValue({});

      const req = createRequest({
        ids: [testId1, testId2],
        operation: "update",
        fields: { addTags: ["new-tag"] },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.updated).toBe(2);
      expect(mockPrisma.jobApplication.update).toHaveBeenCalledTimes(2);
    });

    it("does not add duplicate tags", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: ["existing"] },
      ]);
      mockPrisma.jobApplication.update.mockImplementation(({ data }) => {
        expect(data.tags).toEqual(["existing", "new-tag"]);
        return Promise.resolve({});
      });

      const req = createRequest({
        ids: [testId1],
        operation: "update",
        fields: { addTags: ["existing", "new-tag"] },
      });
      await POST(req);
    });

    it("removes specific tags", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: ["keep", "remove-me", "also-keep"] },
      ]);
      mockPrisma.jobApplication.update.mockImplementation(({ data }) => {
        expect(data.tags).toEqual(["keep", "also-keep"]);
        return Promise.resolve({});
      });

      const req = createRequest({
        ids: [testId1],
        operation: "update",
        fields: { removeTags: ["remove-me"] },
      });
      await POST(req);
    });

    it("handles combined addTags and removeTags", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: ["old", "keep"] },
      ]);
      mockPrisma.jobApplication.update.mockImplementation(({ data }) => {
        expect(data.tags).toEqual(["keep", "new"]);
        return Promise.resolve({});
      });

      const req = createRequest({
        ids: [testId1],
        operation: "update",
        fields: { addTags: ["new"], removeTags: ["old"] },
      });
      await POST(req);
    });
  });

  describe("validation", () => {
    it("returns 400 for invalid JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/applications/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "invalid json{",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("INVALID_JSON");
    });

    it("returns 400 for missing ids", async () => {
      const req = createRequest({ operation: "delete" });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for update without fields", async () => {
      const req = createRequest({
        ids: [testId1],
        operation: "update",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("authorization", () => {
    it("only processes applications belonging to the user", async () => {
      // findMany returns only applications that match userId
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { id: testId1, tags: [] },
        // testId2 belongs to another user, not returned
      ]);
      mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 1 });

      const req = createRequest({
        ids: [testId1, testId2],
        operation: "delete",
      });
      const res = await POST(req);
      const body = await res.json();

      // Verify findMany was called with userId filter
      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
          }),
        })
      );

      expect(body.deleted).toBe(1);
      expect(body.failed).toBe(1);
    });
  });
});
