"use client";

import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { useRef, ReactNode, useMemo, CSSProperties } from "react";

export interface VirtualListProps<T> {
  /** The data to display */
  items: T[];
  /** Height of each row in pixels */
  estimateSize: number;
  /** Height of the container (CSS value like "400px" or "calc(100vh - 200px)") */
  height: string | number;
  /** Render function for each item */
  renderItem: (item: T, index: number, virtualItem: VirtualItem) => ReactNode;
  /** Unique key extractor */
  getItemKey: (item: T, index: number) => string | number;
  /** Number of items to render outside the visible area for smoother scrolling */
  overscan?: number;
  /** Optional empty state renderer */
  emptyState?: ReactNode;
  /** Optional loading state */
  loading?: boolean;
  /** Optional loader component */
  loader?: ReactNode;
  /** Gap between items in pixels */
  gap?: number;
  /** Additional class for the container */
  className?: string;
}

/**
 * VirtualList - A high-performance virtualized list component
 * 
 * Only renders items that are visible in the viewport plus a small overscan buffer.
 * Perfect for large datasets (100+ items) to maintain smooth 60fps scrolling.
 * 
 * @example
 * ```tsx
 * <VirtualList
 *   items={applications}
 *   estimateSize={72}
 *   height="calc(100vh - 300px)"
 *   getItemKey={(app) => app.id}
 *   renderItem={(app, index, virtualItem) => (
 *     <ApplicationRow key={app.id} app={app} />
 *   )}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  estimateSize,
  height,
  renderItem,
  getItemKey,
  overscan = 5,
  emptyState,
  loading,
  loader,
  gap = 0,
  className = "",
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan,
    getItemKey: (index) => getItemKey(items[index], index),
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Container style
  const containerStyle: CSSProperties = useMemo(
    () => ({
      height: typeof height === "number" ? `${height}px` : height,
      overflow: "auto",
    }),
    [height]
  );

  // Inner container style
  const innerStyle: CSSProperties = useMemo(
    () => ({
      height: `${totalSize}px`,
      width: "100%",
      position: "relative" as const,
    }),
    [totalSize]
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={containerStyle}>
        {loader || (
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-blue-500" />
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={containerStyle}>
        {emptyState || <div className="text-zinc-500 dark:text-zinc-400">No items</div>}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={containerStyle}
      role="list"
      aria-label="Virtual list"
    >
      <div style={innerStyle}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size - gap}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              role="listitem"
            >
              {renderItem(item, virtualItem.index, virtualItem)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook for measuring dynamic row heights
 * Use when row heights vary based on content
 */
export function useDynamicVirtualizer<T>(
  items: T[],
  getItemKey: (item: T, index: number) => string | number,
  parentRef: React.RefObject<HTMLDivElement>,
  defaultSize = 72
) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => defaultSize,
    overscan: 5,
    getItemKey: (index) => getItemKey(items[index], index),
    measureElement: (element) => element?.getBoundingClientRect().height ?? defaultSize,
  });

  return virtualizer;
}

export default VirtualList;
