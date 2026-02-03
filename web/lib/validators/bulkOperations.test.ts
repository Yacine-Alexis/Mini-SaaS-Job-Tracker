import { describe, it, expect } from "vitest";
import {
  bulkUpdateFieldsSchema,
  bulkOperationSchema
} from "@/lib/validators/bulkOperations";

describe("bulkUpdateFieldsSchema", () => {
  it("accepts valid stage update", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ stage: "INTERVIEW" });
    expect(result.success).toBe(true);
  });

  it("accepts valid priority update", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ priority: "HIGH" });
    expect(result.success).toBe(true);
  });

  it("accepts null priority", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ priority: null });
    expect(result.success).toBe(true);
  });

  it("accepts valid tags replacement", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ tags: ["react", "senior"] });
    expect(result.success).toBe(true);
  });

  it("accepts valid addTags", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ addTags: ["urgent", "priority"] });
    expect(result.success).toBe(true);
  });

  it("accepts valid removeTags", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ removeTags: ["old-tag"] });
    expect(result.success).toBe(true);
  });

  it("accepts addTags and removeTags together", () => {
    const result = bulkUpdateFieldsSchema.safeParse({
      addTags: ["new"],
      removeTags: ["old"]
    });
    expect(result.success).toBe(true);
  });

  it("rejects tags with addTags", () => {
    const result = bulkUpdateFieldsSchema.safeParse({
      tags: ["replace-all"],
      addTags: ["add-this"]
    });
    expect(result.success).toBe(false);
  });

  it("rejects tags with removeTags", () => {
    const result = bulkUpdateFieldsSchema.safeParse({
      tags: ["replace-all"],
      removeTags: ["remove-this"]
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple fields together", () => {
    const result = bulkUpdateFieldsSchema.safeParse({
      stage: "OFFER",
      priority: "HIGH",
      addTags: ["negotiating"]
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid stage", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ stage: "INVALID_STAGE" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ priority: "URGENT" });
    expect(result.success).toBe(false);
  });

  it("rejects empty tag strings", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ tags: ["", "valid"] });
    expect(result.success).toBe(false);
  });

  it("rejects tags exceeding max length", () => {
    const result = bulkUpdateFieldsSchema.safeParse({ tags: ["a".repeat(41)] });
    expect(result.success).toBe(false);
  });
});

describe("bulkOperationSchema", () => {
  describe("validation", () => {
    it("accepts valid delete operation", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123"],
        operation: "delete"
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid update operation with fields", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123", "cuid0987654321098"],
        operation: "update",
        fields: { stage: "APPLIED" }
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty ids array", () => {
      const result = bulkOperationSchema.safeParse({
        ids: [],
        operation: "delete"
      });
      expect(result.success).toBe(false);
    });

    it("rejects ids array exceeding 100", () => {
      const ids = Array(101).fill(null).map((_, i) => `cuid${i.toString().padStart(17, "0")}`);
      const result = bulkOperationSchema.safeParse({
        ids,
        operation: "delete"
      });
      expect(result.success).toBe(false);
    });

    it("accepts exactly 100 ids", () => {
      const ids = Array(100).fill(null).map((_, i) => `cuid${i.toString().padStart(17, "0")}`);
      const result = bulkOperationSchema.safeParse({
        ids,
        operation: "delete"
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid operation type", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123"],
        operation: "archive"
      });
      expect(result.success).toBe(false);
    });

    it("rejects update operation without fields", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123"],
        operation: "update"
      });
      expect(result.success).toBe(false);
    });

    it("rejects update operation with empty fields", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123"],
        operation: "update",
        fields: {}
      });
      expect(result.success).toBe(false);
    });

    it("accepts update with only addTags", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123"],
        operation: "update",
        fields: { addTags: ["new-tag"] }
      });
      expect(result.success).toBe(true);
    });

    it("accepts update with only removeTags", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["cuid1234567890123"],
        operation: "update",
        fields: { removeTags: ["old-tag"] }
      });
      expect(result.success).toBe(true);
    });
  });

  describe("id format validation", () => {
    it("accepts valid cuid format", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["clwxyz1234567890123"],
        operation: "delete"
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid id format (too short)", () => {
      const result = bulkOperationSchema.safeParse({
        ids: ["short"],
        operation: "delete"
      });
      expect(result.success).toBe(false);
    });
  });
});
