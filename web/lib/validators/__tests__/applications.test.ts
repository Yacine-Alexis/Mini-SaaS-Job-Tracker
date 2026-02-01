import { describe, it, expect } from "vitest";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  applicationListQuerySchema
} from "@/lib/validators/applications";
import { ApplicationStage } from "@prisma/client";

describe("applicationCreateSchema", () => {
  it("validates a valid application", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Software Engineer",
      location: "Remote",
      url: "https://google.com/jobs/123",
      salaryMin: 100000,
      salaryMax: 150000,
      stage: "APPLIED",
      tags: ["remote", "tech"]
    });
    expect(result.success).toBe(true);
  });

  it("requires company and title", () => {
    const result = applicationCreateSchema.safeParse({
      company: "",
      title: ""
    });
    expect(result.success).toBe(false);
  });

  it("validates company max length (120 chars)", () => {
    const result = applicationCreateSchema.safeParse({
      company: "a".repeat(121),
      title: "Engineer"
    });
    expect(result.success).toBe(false);
  });

  it("validates URL format", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Engineer",
      url: "not-a-url"
    });
    expect(result.success).toBe(false);
  });

  it("allows null/undefined optional fields", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Engineer",
      location: null,
      url: null,
      salaryMin: null,
      salaryMax: null
    });
    expect(result.success).toBe(true);
  });

  it("validates salaryMin <= salaryMax", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Engineer",
      salaryMin: 200000,
      salaryMax: 100000
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("salaryMin");
    }
  });

  it("validates stage enum", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Engineer",
      stage: "INVALID_STAGE"
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid stage values", () => {
    for (const stage of Object.values(ApplicationStage)) {
      const result = applicationCreateSchema.safeParse({
        company: "Google",
        title: "Engineer",
        stage
      });
      expect(result.success).toBe(true);
    }
  });

  it("validates tags array", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Engineer",
      tags: ["valid", "a".repeat(41)] // tag too long
    });
    expect(result.success).toBe(false);
  });
});

describe("applicationUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = applicationUpdateSchema.safeParse({
      company: "Updated Company"
    });
    expect(result.success).toBe(true);
  });

  it("validates updated fields", () => {
    const result = applicationUpdateSchema.safeParse({
      url: "invalid-url"
    });
    expect(result.success).toBe(false);
  });

  it("allows empty object", () => {
    const result = applicationUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("applicationListQuerySchema", () => {
  it("validates stage filter", () => {
    const result = applicationListQuerySchema.safeParse({
      stage: "APPLIED"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid stage", () => {
    const result = applicationListQuerySchema.safeParse({
      stage: "INVALID"
    });
    expect(result.success).toBe(false);
  });

  it("validates query max length", () => {
    const result = applicationListQuerySchema.safeParse({
      q: "a".repeat(201)
    });
    expect(result.success).toBe(false);
  });

  it("sanitizes search query (escapes wildcards)", () => {
    const result = applicationListQuerySchema.safeParse({
      q: "test%search_query"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Wildcards should be escaped with backslash
      expect(result.data.q).toContain("\\%");
      expect(result.data.q).toContain("\\_");
    }
  });

  it("validates date formats", () => {
    const result = applicationListQuerySchema.safeParse({
      from: "2024-01-01T00:00:00.000Z",
      to: "2024-12-31T23:59:59.999Z"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date formats", () => {
    const result = applicationListQuerySchema.safeParse({
      from: "not-a-date"
    });
    expect(result.success).toBe(false);
  });
});
