/**
 * Component Tests: OnboardingCard
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingCard from '@/components/OnboardingCard';

// Mock next/link to avoid IntersectionObserver issues
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('OnboardingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('displays welcome message', () => {
      render(<OnboardingCard />);
      expect(screen.getByText('Welcome 👋')).toBeInTheDocument();
    });

    it('displays getting started instructions', () => {
      render(<OnboardingCard />);
      expect(screen.getByText(/Get started by creating your first application/)).toBeInTheDocument();
    });

    it('renders create application link', () => {
      render(<OnboardingCard />);
      expect(screen.getByRole('link', { name: 'Create application' })).toHaveAttribute('href', '/applications/new');
    });

    it('renders import CSV link', () => {
      render(<OnboardingCard />);
      expect(screen.getByRole('link', { name: 'Import CSV' })).toHaveAttribute('href', '/applications/import');
    });

    it('renders add sample data button', () => {
      render(<OnboardingCard />);
      expect(screen.getByRole('button', { name: 'Add sample data' })).toBeInTheDocument();
    });
  });

  describe('sample data seeding', () => {
    it('shows loading state when seeding', async () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
      render(<OnboardingCard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Add sample data' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Adding…' })).toBeDisabled();
      });
    });

    it('calls onSeeded callback on success', async () => {
      const onSeeded = vi.fn().mockResolvedValue(undefined);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      
      render(<OnboardingCard onSeeded={onSeeded} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Add sample data' }));
      
      await waitFor(() => {
        expect(onSeeded).toHaveBeenCalled();
      });
    });

    it('shows error message on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });
      
      render(<OnboardingCard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Add sample data' }));
      
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('shows generic error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(<OnboardingCard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Add sample data' }));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to add sample data')).toBeInTheDocument();
      });
    });
  });
});
