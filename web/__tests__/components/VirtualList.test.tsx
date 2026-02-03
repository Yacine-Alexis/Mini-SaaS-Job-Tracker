import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VirtualList } from "@/components/VirtualList";

// Mock getBoundingClientRect for virtualizer
const mockGetBoundingClientRect = vi.fn(() => ({
  width: 800,
  height: 400,
  top: 0,
  left: 0,
  bottom: 400,
  right: 800,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

// Mock scrollHeight and scrollTop
Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  get: function () {
    return 2000;
  },
});

Object.defineProperty(HTMLElement.prototype, "scrollTop", {
  configurable: true,
  get: function () {
    return 0;
  },
  set: function () {},
});

interface TestItem {
  id: string;
  name: string;
}

const createTestItems = (count: number): TestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
  }));

describe("VirtualList", () => {
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
  });

  describe("rendering", () => {
    it("renders items within viewport", () => {
      const items = createTestItems(100);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
        />
      );

      // Should render some items (not all 100)
      const renderedItems = screen.getAllByTestId(/^item-item-/);
      expect(renderedItems.length).toBeLessThan(100);
      expect(renderedItems.length).toBeGreaterThan(0);
    });

    it("renders empty state when no items", () => {
      render(
        <VirtualList
          items={[]}
          estimateSize={50}
          height={400}
          getItemKey={(item: TestItem) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
          emptyState={<div data-testid="empty">No data</div>}
        />
      );

      expect(screen.getByTestId("empty")).toBeInTheDocument();
    });

    it("renders default empty state when no items and no emptyState prop", () => {
      render(
        <VirtualList
          items={[]}
          estimateSize={50}
          height={400}
          getItemKey={(item: TestItem) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      expect(screen.getByText("No items")).toBeInTheDocument();
    });

    it("renders loading state when loading", () => {
      const items = createTestItems(10);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
          loading={true}
        />
      );

      // Should show loading spinner (doesn't render items)
      expect(screen.queryByText("Item 0")).not.toBeInTheDocument();
    });

    it("renders custom loader when loading", () => {
      const items = createTestItems(10);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
          loading={true}
          loader={<div data-testid="custom-loader">Loading...</div>}
        />
      );

      expect(screen.getByTestId("custom-loader")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has list role on container", () => {
      const items = createTestItems(10);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("has listitem role on items", () => {
      const items = createTestItems(10);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe("configuration", () => {
    it("accepts string height value", () => {
      const items = createTestItems(10);
      
      const { container } = render(
        <VirtualList
          items={items}
          estimateSize={50}
          height="calc(100vh - 200px)"
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      const listContainer = container.querySelector("[role='list']");
      expect(listContainer).toHaveStyle({ height: "calc(100vh - 200px)" });
    });

    it("accepts numeric height value", () => {
      const items = createTestItems(10);
      
      const { container } = render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      const listContainer = container.querySelector("[role='list']");
      expect(listContainer).toHaveStyle({ height: "400px" });
    });

    it("applies custom className", () => {
      const items = createTestItems(10);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={(item) => <div>{item.name}</div>}
          className="custom-class"
        />
      );

      expect(screen.getByRole("list")).toHaveClass("custom-class");
    });
  });

  describe("key extraction", () => {
    it("uses getItemKey for unique keys", () => {
      const items = createTestItems(10);
      const getItemKey = vi.fn((item: TestItem) => item.id);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={getItemKey}
          renderItem={(item) => <div>{item.name}</div>}
        />
      );

      // getItemKey should be called for visible items
      expect(getItemKey).toHaveBeenCalled();
    });
  });

  describe("render callback", () => {
    it("provides item, index, and virtualItem to renderItem", () => {
      const items = createTestItems(10);
      const renderItem = vi.fn((item: TestItem, index: number) => (
        <div data-testid={`item-${index}`}>{item.name}</div>
      ));
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={renderItem}
        />
      );

      expect(renderItem).toHaveBeenCalled();
      // First call should have item, index, and virtualItem
      const [item, index, virtualItem] = renderItem.mock.calls[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(typeof index).toBe("number");
      expect(virtualItem).toHaveProperty("index");
      expect(virtualItem).toHaveProperty("start");
      expect(virtualItem).toHaveProperty("size");
    });
  });

  describe("performance", () => {
    it("does not render all items at once for large lists", () => {
      const items = createTestItems(1000);
      const renderItem = vi.fn((item: TestItem) => <div>{item.name}</div>);
      
      render(
        <VirtualList
          items={items}
          estimateSize={50}
          height={400}
          getItemKey={(item) => item.id}
          renderItem={renderItem}
        />
      );

      // Should only render visible items + overscan (default 5)
      // With height=400 and estimateSize=50, that's ~8 visible items + 5*2 overscan = ~18
      expect(renderItem.mock.calls.length).toBeLessThan(50);
    });
  });
});
