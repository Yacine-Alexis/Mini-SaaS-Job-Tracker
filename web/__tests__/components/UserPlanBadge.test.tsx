/**
 * Component Tests: UserPlanBadge
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserPlanBadge from '@/components/UserPlanBadge';

describe('UserPlanBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pro plan', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ user: { plan: 'PRO' } }),
      });
    });

    it('displays Pro badge', async () => {
      render(<UserPlanBadge />);
      await waitFor(() => {
        expect(screen.getByText('Pro')).toBeInTheDocument();
      });
    });

    it('displays Pro Plan text when inline', async () => {
      render(<UserPlanBadge inline />);
      await waitFor(() => {
        expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      });
    });
  });

  describe('Free plan', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ user: { plan: 'FREE' } }),
      });
    });

    it('displays Free badge', async () => {
      render(<UserPlanBadge />);
      await waitFor(() => {
        expect(screen.getByText('Free')).toBeInTheDocument();
      });
    });

    it('displays Free Plan text when inline', async () => {
      render(<UserPlanBadge inline />);
      await waitFor(() => {
        expect(screen.getByText('Free Plan')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and error states', () => {
    it('renders nothing initially while loading', () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
      const { container } = render(<UserPlanBadge />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing on API error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const { container } = render(<UserPlanBadge />);
      // Wait a tick for the effect to run
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when user data is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      });
      const { container } = render(<UserPlanBadge />);
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(container.firstChild).toBeNull();
    });
  });
});
