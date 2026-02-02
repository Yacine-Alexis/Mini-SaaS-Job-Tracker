/**
 * Component Tests: EmptyState
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '@/components/ui/EmptyState';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('EmptyState', () => {
  describe('Basic rendering', () => {
    it('renders title', () => {
      render(<EmptyState title="No items found" />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('renders title and description', () => {
      render(
        <EmptyState 
          title="No items found" 
          description="Try adjusting your search" 
        />
      );
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });

    it('renders without description', () => {
      render(<EmptyState title="Empty" />);
      expect(screen.getByText('Empty')).toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders applications icon', () => {
      const { container } = render(<EmptyState icon="applications" title="No applications" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders notes icon', () => {
      const { container } = render(<EmptyState icon="notes" title="No notes" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders tasks icon', () => {
      const { container } = render(<EmptyState icon="tasks" title="No tasks" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders contacts icon', () => {
      const { container } = render(<EmptyState icon="contacts" title="No contacts" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      const { container } = render(<EmptyState icon="search" title="No results" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders without icon', () => {
      const { container } = render(<EmptyState title="Empty" />);
      // Should still have default illustration or none
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders primary action button with onClick', () => {
      const onClick = vi.fn();
      render(
        <EmptyState 
          title="No items" 
          action={{ label: 'Add Item', onClick }} 
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders primary action link with href', () => {
      render(
        <EmptyState 
          title="No items" 
          action={{ label: 'Add Item', href: '/items/new' }} 
        />
      );
      
      const link = screen.getByRole('link', { name: 'Add Item' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/items/new');
    });

    it('renders secondary action', () => {
      const onClick = vi.fn();
      render(
        <EmptyState 
          title="No items"
          action={{ label: 'Primary', onClick }}
          secondaryAction={{ label: 'Secondary', onClick }}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });

    it('handles secondary action click', () => {
      const primaryClick = vi.fn();
      const secondaryClick = vi.fn();
      
      render(
        <EmptyState 
          title="No items"
          action={{ label: 'Primary', onClick: primaryClick }}
          secondaryAction={{ label: 'Secondary', onClick: secondaryClick }}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Secondary' }));
      expect(secondaryClick).toHaveBeenCalledTimes(1);
      expect(primaryClick).not.toHaveBeenCalled();
    });
  });

  describe('Children', () => {
    it('renders children content', () => {
      render(
        <EmptyState title="Empty">
          <p data-testid="custom-content">Custom content here</p>
        </EmptyState>
      );
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom content here')).toBeInTheDocument();
    });

    it('renders children alongside action', () => {
      const onClick = vi.fn();
      render(
        <EmptyState 
          title="Empty" 
          action={{ label: 'Action', onClick }}
        >
          <span>Extra info</span>
        </EmptyState>
      );
      
      expect(screen.getByText('Extra info')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<EmptyState title="No data available" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('No data available');
    });

    it('action buttons are keyboard accessible', () => {
      const onClick = vi.fn();
      render(
        <EmptyState 
          title="Empty" 
          action={{ label: 'Add', onClick }} 
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add' });
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});
