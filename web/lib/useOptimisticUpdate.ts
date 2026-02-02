/**
 * useOptimisticUpdate Hook
 *
 * Provides optimistic UI updates for CRUD operations with automatic rollback on error.
 * Reduces latency perception by updating UI immediately before server confirmation.
 *
 * Features:
 * - Optimistic create/update/delete operations
 * - Automatic rollback on server error
 * - Loading and error state management
 * - Type-safe with generics
 *
 * @example
 * const { items, loading, error, optimisticCreate, optimisticUpdate, optimisticDelete } =
 *   useOptimisticUpdate<Note>({
 *     fetchFn: () => fetch('/api/notes').then(r => r.json()),
 *     getItems: (data) => data.items,
 *   });
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type OptimisticConfig<T, FetchResult = unknown> = {
  /** Function to fetch items from the server */
  fetchFn: () => Promise<FetchResult>;
  /** Extract items array from fetch result */
  getItems: (data: FetchResult) => T[];
  /** Unique identifier key for items (default: 'id') */
  idKey?: keyof T;
};

export type OptimisticState<T> = {
  /** Current items (may include optimistic updates) */
  items: T[];
  /** Whether initial load or refresh is in progress */
  loading: boolean;
  /** Error message if last operation failed */
  error: string | null;
  /** Whether any mutation is in progress */
  mutating: boolean;
};

export type OptimisticActions<T> = {
  /** Refresh items from server */
  refresh: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /**
   * Optimistically add an item
   * @param tempItem - Temporary item to show (must have temp ID)
   * @param serverFn - Function that creates item on server
   * @param mapResponse - Extract created item from server response
   */
  optimisticCreate: <R>(
    tempItem: T,
    serverFn: () => Promise<R>,
    mapResponse: (response: R) => T
  ) => Promise<T | null>;
  /**
   * Optimistically update an item
   * @param id - Item ID to update
   * @param updates - Partial updates to apply
   * @param serverFn - Function that updates item on server
   */
  optimisticUpdate: (
    id: T[keyof T],
    updates: Partial<T>,
    serverFn: () => Promise<unknown>
  ) => Promise<boolean>;
  /**
   * Optimistically delete an item
   * @param id - Item ID to delete
   * @param serverFn - Function that deletes item on server
   */
  optimisticDelete: (
    id: T[keyof T],
    serverFn: () => Promise<unknown>
  ) => Promise<boolean>;
  /**
   * Set items directly (for external updates)
   */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
};

export type UseOptimisticUpdateReturn<T> = OptimisticState<T> & OptimisticActions<T>;

export function useOptimisticUpdate<T extends Record<string, unknown>, FetchResult = unknown>(
  config: OptimisticConfig<T, FetchResult>
): UseOptimisticUpdateReturn<T> {
  const { idKey = "id" as keyof T } = config;

  // Store config in refs to avoid dependency issues
  const fetchFnRef = useRef(config.fetchFn);
  const getItemsRef = useRef(config.getItems);
  
  // Update refs when config changes
  useEffect(() => {
    fetchFnRef.current = config.fetchFn;
    getItemsRef.current = config.getItems;
  }, [config.fetchFn, config.getItems]);

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  // Track pending operations for rollback
  const pendingRef = useRef<Map<string, T[]>>(new Map());
  
  // Track if mounted
  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFnRef.current();
      setItems(getItemsRef.current(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount (only once)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      void refresh();
    }
  }, [refresh]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const optimisticCreate = useCallback(
    async <R>(
      tempItem: T,
      serverFn: () => Promise<R>,
      mapResponse: (response: R) => T
    ): Promise<T | null> => {
      const operationId = `create-${Date.now()}`;

      // Save current state for rollback
      setItems((prev) => {
        pendingRef.current.set(operationId, prev);
        return [...prev, tempItem];
      });

      setMutating(true);
      setError(null);

      try {
        const response = await serverFn();
        const createdItem = mapResponse(response);

        // Replace temp item with server item
        setItems((prev) =>
          prev.map((item) =>
            item[idKey] === tempItem[idKey] ? createdItem : item
          )
        );

        pendingRef.current.delete(operationId);
        return createdItem;
      } catch (err) {
        // Rollback
        const previousItems = pendingRef.current.get(operationId);
        if (previousItems) {
          setItems(previousItems);
          pendingRef.current.delete(operationId);
        }
        setError(err instanceof Error ? err.message : "Failed to create item");
        return null;
      } finally {
        setMutating(false);
      }
    },
    [idKey]
  );

  const optimisticUpdate = useCallback(
    async (
      id: T[keyof T],
      updates: Partial<T>,
      serverFn: () => Promise<unknown>
    ): Promise<boolean> => {
      const operationId = `update-${id}-${Date.now()}`;

      // Save current state for rollback
      setItems((prev) => {
        pendingRef.current.set(operationId, prev);
        return prev.map((item) =>
          item[idKey] === id ? { ...item, ...updates } : item
        );
      });

      setMutating(true);
      setError(null);

      try {
        await serverFn();
        pendingRef.current.delete(operationId);
        return true;
      } catch (err) {
        // Rollback
        const previousItems = pendingRef.current.get(operationId);
        if (previousItems) {
          setItems(previousItems);
          pendingRef.current.delete(operationId);
        }
        setError(err instanceof Error ? err.message : "Failed to update item");
        return false;
      } finally {
        setMutating(false);
      }
    },
    [idKey]
  );

  const optimisticDelete = useCallback(
    async (
      id: T[keyof T],
      serverFn: () => Promise<unknown>
    ): Promise<boolean> => {
      const operationId = `delete-${id}-${Date.now()}`;

      // Save current state for rollback
      setItems((prev) => {
        pendingRef.current.set(operationId, prev);
        return prev.filter((item) => item[idKey] !== id);
      });

      setMutating(true);
      setError(null);

      try {
        await serverFn();
        pendingRef.current.delete(operationId);
        return true;
      } catch (err) {
        // Rollback
        const previousItems = pendingRef.current.get(operationId);
        if (previousItems) {
          setItems(previousItems);
          pendingRef.current.delete(operationId);
        }
        setError(err instanceof Error ? err.message : "Failed to delete item");
        return false;
      } finally {
        setMutating(false);
      }
    },
    [idKey]
  );

  return {
    items,
    loading,
    error,
    mutating,
    refresh,
    clearError,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    setItems,
  };
}

/**
 * Helper to create a temporary ID for optimistic creates
 */
export function createTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to check if an ID is a temporary ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith("temp-");
}
