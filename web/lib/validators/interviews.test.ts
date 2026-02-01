import { describe, it, expect } from "vitest";
import {
  interviewCreateSchema,
  interviewUpdateSchema,
  interviewListQuerySchema
} from "./interviews";
import { InterviewType, InterviewResult } from "@prisma/client";

describe("interviewCreateSchema", () => {
  it("should accept minimal valid input", () => {
    const result = interviewCreateSchema.safeParse({
      applicationId: "app_123",
      scheduledAt: "2025-02-15T14:00:00.000Z"
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing applicationId", () => {
    const result = interviewCreateSchema.safeParse({
      scheduledAt: "2025-02-15T14:00:00.000Z"
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing scheduledAt", () => {
    const result = interviewCreateSchema.safeParse({
      applicationId: "app_123"
    });
    expect(result.success).toBe(false);
  });

  it("should accept all optional fields", () => {
    const result = interviewCreateSchema.safeParse({
      applicationId: "app_123",
      scheduledAt: "2025-02-15T14:00:00.000Z",
      duration: 60,
      type: InterviewType.VIDEO,
      location: "https://zoom.us/j/123456",
      interviewers: ["John Smith", "Jane Doe"],
      notes: "Prepare for system design questions",
      feedback: null,
      result: InterviewResult.PENDING
    });
    expect(result.success).toBe(true);
  });

  it("should reject duration less than 15 minutes", () => {
    const result = interviewCreateSchema.safeParse({
      applicationId: "app_123",
      scheduledAt: "2025-02-15T14:00:00.000Z",
      duration: 10
    });
    expect(result.success).toBe(false);
  });

  it("should reject duration more than 480 minutes (8 hours)", () => {
    const result = interviewCreateSchema.safeParse({
      applicationId: "app_123",
      scheduledAt: "2025-02-15T14:00:00.000Z",
      duration: 500
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid boundary durations", () => {
    const min = interviewCreateSchema.safeParse({
      applicationId: "app_123",
      scheduledAt: "2025-02-15T14:00:00.000Z",
      duration: 15
    });
    expect(min.success).toBe(true);

    const max = interviewCreateSchema.safeParse({
      applicationId: "app_123",
      scheduledAt: "2025-02-15T14:00:00.000Z",
      duration: 480
    });
    expect(max.success).toBe(true);
  });

  it("should accept all interview types", () => {
    const types = Object.values(InterviewType);
    for (const type of types) {
      const result = interviewCreateSchema.safeParse({
        applicationId: "app_123",
        scheduledAt: "2025-02-15T14:00:00.000Z",
        type
      });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all interview results", () => {
    const results = Object.values(InterviewResult);
    for (const result of results) {
      const parsed = interviewCreateSchema.safeParse({
        applicationId: "app_123",
        scheduledAt: "2025-02-15T14:00:00.000Z",
        result
      });
      expect(parsed.success).toBe(true);
    }
  });
});

describe("interviewUpdateSchema", () => {
  it("should accept partial updates", () => {
    const result = interviewUpdateSchema.safeParse({
      result: InterviewResult.PASSED
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = interviewUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate duration when provided", () => {
    const invalid = interviewUpdateSchema.safeParse({
      duration: 5
    });
    expect(invalid.success).toBe(false);
  });

  it("should accept updating feedback", () => {
    const result = interviewUpdateSchema.safeParse({
      feedback: "Great communication skills, strong technical background"
    });
    expect(result.success).toBe(true);
  });
});

describe("interviewListQuerySchema", () => {
  it("should accept empty query", () => {
    const result = interviewListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept applicationId filter", () => {
    const result = interviewListQuerySchema.safeParse({
      applicationId: "app_123"
    });
    expect(result.success).toBe(true);
  });

  it("should accept upcoming filter", () => {
    const result = interviewListQuerySchema.safeParse({
      upcoming: "true"
    });
    expect(result.success).toBe(true);
  });

  it("should accept result filter", () => {
    const result = interviewListQuerySchema.safeParse({
      result: InterviewResult.PENDING
    });
    expect(result.success).toBe(true);
  });

  it("should accept multiple filters", () => {
    const result = interviewListQuerySchema.safeParse({
      applicationId: "app_123",
      upcoming: "true",
      result: InterviewResult.PENDING
    });
    expect(result.success).toBe(true);
  });
});
