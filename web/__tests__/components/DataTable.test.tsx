/**
 * Component Tests: DataTable and StageBadge
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable, { StageBadge } from '@/components/DataTable';
import { ApplicationStage } from '@prisma/client';

// Sample data type for testing
type TestItem = {
  id: string;
  name: string;
  count: number;
};

describe('DataTable', () => {
  const columns = [
    { key: 'name' as const, header: 'Name' },
    { key: 'count' as const, header: 'Count' },
  ];

  const testData: TestItem[] = [
    { id: '1', name: 'Item 1', count: 10 },
    { id: '2', name: 'Item 2', count: 20 },
    { id: '3', name: 'Item 3', count: 30 },
  ];

  describe('rendering', () => {
    it('renders table headers', () => {
      render(<DataTable columns={columns} data={testData} keyField="id" />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();
    });

    it('renders data rows', () => {
      render(<DataTable columns={columns} data={testData} keyField="id" />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('renders correct number of rows', () => {
      const { container } = render(<DataTable columns={columns} data={testData} keyField="id" />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
    });
  });

  describe('empty state', () => {
    it('shows default empty message when no data', () => {
      render(<DataTable columns={columns} data={[]} keyField="id" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(<DataTable columns={columns} data={[]} keyField="id" emptyMessage="No items found" />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('does not render table when empty', () => {
      const { container } = render(<DataTable columns={columns} data={[]} keyField="id" />);
      expect(container.querySelector('table')).not.toBeInTheDocument();
    });
  });

  describe('custom render functions', () => {
    it('uses custom render function when provided', () => {
      const columnsWithRender = [
        { key: 'name' as const, header: 'Name' },
        { 
          key: 'count' as const, 
          header: 'Count',
          render: (item: TestItem) => <span data-testid="custom-count">Custom: {item.count}</span>
        },
      ];
      
      render(<DataTable columns={columnsWithRender} data={testData} keyField="id" />);
      const customElements = screen.getAllByTestId('custom-count');
      expect(customElements).toHaveLength(3);
      expect(customElements[0]).toHaveTextContent('Custom: 10');
    });
  });

  describe('link support', () => {
    it('wraps rows in links when linkHref is provided', () => {
      const { container } = render(
        <DataTable 
          columns={columns} 
          data={testData} 
          keyField="id"
          linkHref={(item) => `/items/${item.id}`}
        />
      );
      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(3);
    });
  });
});

describe('StageBadge', () => {
  it('renders SAVED stage with correct styling', () => {
    render(<StageBadge stage={ApplicationStage.SAVED} />);
    const badge = screen.getByText('SAVED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-zinc-100', 'text-zinc-700');
  });

  it('renders APPLIED stage with correct styling', () => {
    render(<StageBadge stage={ApplicationStage.APPLIED} />);
    const badge = screen.getByText('APPLIED');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('renders INTERVIEW stage with correct styling', () => {
    render(<StageBadge stage={ApplicationStage.INTERVIEW} />);
    const badge = screen.getByText('INTERVIEW');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
  });

  it('renders OFFER stage with correct styling', () => {
    render(<StageBadge stage={ApplicationStage.OFFER} />);
    const badge = screen.getByText('OFFER');
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('renders REJECTED stage with correct styling', () => {
    render(<StageBadge stage={ApplicationStage.REJECTED} />);
    const badge = screen.getByText('REJECTED');
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('has consistent badge structure', () => {
    render(<StageBadge stage={ApplicationStage.APPLIED} />);
    const badge = screen.getByText('APPLIED');
    expect(badge).toHaveClass('inline-block', 'px-2', 'py-0.5', 'text-xs', 'rounded');
  });
});
