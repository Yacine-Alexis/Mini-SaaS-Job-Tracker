import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  applicationListQuerySchema,
  validateSalaryRange
} from "./applications";
import { ApplicationStage, Priority, RemoteType, JobType } from "@prisma/client";

describe("applicationCreateSchema", () => {
  it("should accept minimal valid input", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Acme Corp",
      title: "Software Engineer"
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty company", () => {
    const result = applicationCreateSchema.safeParse({
      company: "",
      title: "Software Engineer"
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Acme Corp",
      title: ""
    });
    expect(result.success).toBe(false);
  });

  it("should accept all optional fields", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Google",
      title: "Senior Engineer",
      location: "Remote",
      url: "https://careers.google.com/job/123",
      salaryMin: 100000,
      salaryMax: 150000,
      salaryCurrency: "USD",
      stage: ApplicationStage.APPLIED,
      appliedDate: "2025-01-15T00:00:00.000Z",
      source: "LinkedIn",
      tags: ["react", "typescript"],
      priority: Priority.HIGH,
      remoteType: RemoteType.REMOTE,
      jobType: JobType.FULL_TIME,
      description: "Great opportunity...",
      nextFollowUp: "2025-01-22T00:00:00.000Z",
      rejectionReason: null
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Acme",
      title: "Dev",
      url: "not-a-url"
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative salary", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Acme",
      title: "Dev",
      salaryMin: -1000
    });
    expect(result.success).toBe(false);
  });

  it("should accept null for optional nullable fields", () => {
    const result = applicationCreateSchema.safeParse({
      company: "Acme",
      title: "Dev",
      location: null,
      url: null,
      salaryMin: null,
      salaryMax: null
    });
    expect(result.success).toBe(true);
  });
});

describe("applicationUpdateSchema", () => {
  it("should accept partial updates", () => {
    const result = applicationUpdateSchema.safeParse({
      stage: ApplicationStage.INTERVIEW
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (no changes)", () => {
    const result = applicationUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate fields that are provided", () => {
    const result = applicationUpdateSchema.safeParse({
      url: "not-valid-url"
    });
    expect(result.success).toBe(false);
  });
});

describe("applicationListQuerySchema", () => {
  it("should accept empty query", () => {
    const result = applicationListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept valid stage filter", () => {
    const result = applicationListQuerySchema.safeParse({
      stage: ApplicationStage.APPLIED
    });
    expect(result.success).toBe(true);
  });

  it("should accept search query", () => {
    const result = applicationListQuerySchema.safeParse({
      q: "software engineer"
    });
    expect(result.success).toBe(true);
  });

  it("should sanitize search query from SQL wildcards", () => {
    const result = applicationListQuerySchema.safeParse({
      q: "test%_injection"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Should escape the wildcards with backslashes
      expect(result.data.q).toBe("test\\%\\_injection");
    }
  });

  it("should accept sort parameters", () => {
    const result = applicationListQuerySchema.safeParse({
      sortBy: "company",
      sortDir: "asc"
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid sort field", () => {
    const result = applicationListQuerySchema.safeParse({
      sortBy: "invalidField"
    });
    expect(result.success).toBe(false);
  });
});

describe("validateSalaryRange", () => {
  it("should return true when both are null", () => {
    expect(validateSalaryRange({ salaryMin: null, salaryMax: null })).toBe(true);
  });

  it("should return true when only min is set", () => {
    expect(validateSalaryRange({ salaryMin: 50000, salaryMax: null })).toBe(true);
  });

  it("should return true when only max is set", () => {
    expect(validateSalaryRange({ salaryMin: null, salaryMax: 100000 })).toBe(true);
  });

  it("should return true when min <= max", () => {
    expect(validateSalaryRange({ salaryMin: 50000, salaryMax: 100000 })).toBe(true);
    expect(validateSalaryRange({ salaryMin: 50000, salaryMax: 50000 })).toBe(true);
  });

  it("should return false when min > max", () => {
    expect(validateSalaryRange({ salaryMin: 100000, salaryMax: 50000 })).toBe(false);
  });
});
