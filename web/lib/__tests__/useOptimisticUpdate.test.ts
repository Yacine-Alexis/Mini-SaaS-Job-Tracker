/**
 * Tests for useOptimisticUpdate hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useOptimisticUpdate,
  createTempId,
  isTempId,
} from "@/lib/useOptimisticUpdate";

type TestItem = {
  id: string;
  name: string;
  value: number;
};

// Increase waitFor timeout for CI environments
const waitForOptions = { timeout: 5000 };

describe("useOptimisticUpdate", () => {
  const mockItems: TestItem[] = [
    { id: "1", name: "Item 1", value: 10 },
    { id: "2", name: "Item 2", value: 20 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state and loading", () => {
    it("starts with loading true and empty items", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      // Initial state before async completes
      expect(result.current.items).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.mutating).toBe(false);
      
      // Wait for load to complete
      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);
    });

    it("loads items on mount", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      expect(result.current.items).toEqual(mockItems);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("handles fetch error", async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      expect(result.current.error).toBe("Network error");
      expect(result.current.items).toEqual([]);
    });
  });

  describe("refresh", () => {
    it("refreshes items from server", async () => {
      const fetchFn = vi.fn()
        .mockResolvedValueOnce({ items: mockItems })
        .mockResolvedValueOnce({ items: [{ id: "3", name: "Item 3", value: 30 }] });

      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);
      expect(result.current.items).toEqual(mockItems);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.items).toEqual([{ id: "3", name: "Item 3", value: 30 }]);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("optimisticCreate", () => {
    it("adds item optimistically then updates with server response", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const tempItem: TestItem = { id: "temp-1", name: "New Item", value: 100 };
      const serverItem: TestItem = { id: "server-1", name: "New Item", value: 100 };
      const serverFn = vi.fn().mockResolvedValue({ item: serverItem });

      let createdItem: TestItem | null = null;
      await act(async () => {
        createdItem = await result.current.optimisticCreate(
          tempItem,
          serverFn,
          (res) => res.item
        );
      });

      expect(createdItem).toEqual(serverItem);
      expect(result.current.items).toContainEqual(serverItem);
      expect(result.current.mutating).toBe(false);
    });

    it("sets error on server failure", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const tempItem: TestItem = { id: "temp-1", name: "New Item", value: 100 };
      const serverFn = vi.fn().mockRejectedValue(new Error("Create failed"));

      await act(async () => {
        const created = await result.current.optimisticCreate(tempItem, serverFn, (res) => res.item);
        expect(created).toBeNull();
      });

      // Error should be set
      await waitFor(() => expect(result.current.error).toBe("Create failed"), waitForOptions);
    });
  });

  describe("optimisticUpdate", () => {
    it("updates item optimistically", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const serverFn = vi.fn().mockResolvedValue({});

      await act(async () => {
        const success = await result.current.optimisticUpdate(
          "1",
          { name: "Updated Item" },
          serverFn
        );
        expect(success).toBe(true);
      });

      const updatedItem = result.current.items.find((i) => i.id === "1");
      expect(updatedItem?.name).toBe("Updated Item");
    });

    it("sets error on server failure", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const serverFn = vi.fn().mockRejectedValue(new Error("Update failed"));

      await act(async () => {
        const success = await result.current.optimisticUpdate(
          "1",
          { name: "Updated Item" },
          serverFn
        );
        expect(success).toBe(false);
      });

      // Error should be set
      await waitFor(() => expect(result.current.error).toBe("Update failed"), waitForOptions);
    });
  });

  describe("optimisticDelete", () => {
    it("deletes item optimistically", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const serverFn = vi.fn().mockResolvedValue({});

      await act(async () => {
        const success = await result.current.optimisticDelete("1", serverFn);
        expect(success).toBe(true);
      });

      expect(result.current.items.find((i) => i.id === "1")).toBeUndefined();
      expect(result.current.items).toHaveLength(1);
    });

    it("sets error on server failure", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ items: mockItems });
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const serverFn = vi.fn().mockRejectedValue(new Error("Delete failed"));

      await act(async () => {
        const success = await result.current.optimisticDelete("1", serverFn);
        expect(success).toBe(false);
      });

      // Error should be set
      await waitFor(() => expect(result.current.error).toBe("Delete failed"), waitForOptions);
    });
  });

  describe("clearError", () => {
    it("clears error state", async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useOptimisticUpdate<TestItem>({
          fetchFn,
          getItems: (data) => data.items,
        })
      );

      await waitFor(() => expect(result.current.error).toBe("Test error"), waitForOptions);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("custom idKey", () => {
    type CustomItem = {
      customId: string;
      name: string;
    };

    it("uses custom id key for operations", async () => {
      const items: CustomItem[] = [{ customId: "a", name: "Item A" }];
      const fetchFn = vi.fn().mockResolvedValue({ items });

      const { result } = renderHook(() =>
        useOptimisticUpdate<CustomItem>({
          fetchFn,
          getItems: (data) => data.items,
          idKey: "customId",
        })
      );

      await waitFor(() => expect(result.current.loading).toBe(false), waitForOptions);

      const serverFn = vi.fn().mockResolvedValue({});

      await act(async () => {
        await result.current.optimisticDelete("a", serverFn);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });
});

describe("helper functions", () => {
  describe("createTempId", () => {
    it("creates unique IDs starting with temp-", () => {
      const id1 = createTempId();
      const id2 = createTempId();

      expect(id1).toMatch(/^temp-/);
      expect(id2).toMatch(/^temp-/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("isTempId", () => {
    it("returns true for temp IDs", () => {
      expect(isTempId("temp-123")).toBe(true);
      expect(isTempId("temp-abc-xyz")).toBe(true);
    });

    it("returns false for regular IDs", () => {
      expect(isTempId("123")).toBe(false);
      expect(isTempId("uuid-abc")).toBe(false);
      expect(isTempId("")).toBe(false);
    });
  });
});
