import { describe, it, expect } from "vitest";
import { paginationQuerySchema, toSkipTake } from "./pagination";

describe("paginationQuerySchema", () => {
  it("should provide defaults when no values given", () => {
    const result = paginationQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("should coerce string numbers to integers", () => {
    const result = paginationQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("should reject page less than 1", () => {
    expect(() => paginationQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => paginationQuerySchema.parse({ page: -1 })).toThrow();
  });

  it("should reject pageSize less than 1", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: 0 })).toThrow();
  });

  it("should reject pageSize greater than 100", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: 101 })).toThrow();
  });

  it("should accept valid boundary values", () => {
    const min = paginationQuerySchema.parse({ page: 1, pageSize: 1 });
    expect(min.page).toBe(1);
    expect(min.pageSize).toBe(1);

    const max = paginationQuerySchema.parse({ page: 1000, pageSize: 100 });
    expect(max.page).toBe(1000);
    expect(max.pageSize).toBe(100);
  });
});

describe("toSkipTake", () => {
  it("should calculate skip=0 for page 1", () => {
    const result = toSkipTake({ page: 1, pageSize: 20 });
    expect(result.skip).toBe(0);
    expect(result.take).toBe(20);
  });

  it("should calculate correct skip for page 2", () => {
    const result = toSkipTake({ page: 2, pageSize: 20 });
    expect(result.skip).toBe(20);
    expect(result.take).toBe(20);
  });

  it("should calculate correct skip for page 5 with pageSize 10", () => {
    const result = toSkipTake({ page: 5, pageSize: 10 });
    expect(result.skip).toBe(40);
    expect(result.take).toBe(10);
  });

  it("should handle large page numbers", () => {
    const result = toSkipTake({ page: 100, pageSize: 50 });
    expect(result.skip).toBe(4950);
    expect(result.take).toBe(50);
  });
});
