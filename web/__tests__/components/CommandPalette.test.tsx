/**
 * Component Tests: CommandPalette
 * 
 * Tests command palette functionality including:
 * - Opening/closing with keyboard shortcut (Ctrl+K)
 * - Search filtering
 * - Keyboard navigation (↑↓ arrows, Enter, Escape)
 * - Command execution and routing
 * - Category grouping
 * - Additional commands prop
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandPalette from '@/components/CommandPalette';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Helper to open the command palette with Ctrl+K
const openPalette = () => {
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
};

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document theme class
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('initial state', () => {
    it('does not render dialog when closed', () => {
      render(<CommandPalette />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('keyboard shortcut activation', () => {
    it('opens dialog when Ctrl+K is triggered', () => {
      render(<CommandPalette />);
      
      openPalette();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
    });

    it('closes dialog when Escape is pressed', () => {
      render(<CommandPalette />);
      
      openPalette();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes dialog when Escape is pressed after opening', () => {
      render(<CommandPalette />);
      
      // Open
      openPalette();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Close with Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('renders search input when open', () => {
      render(<CommandPalette />);
      openPalette();
      
      const input = screen.getByPlaceholderText(/type a command/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('filters commands by search query', async () => {
      render(<CommandPalette />);
      openPalette();
      
      // Built-in commands should be visible
      expect(screen.getByText('New Application')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      
      // Type search query
      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'dashboard');
      
      // Only dashboard should match
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('New Application')).not.toBeInTheDocument();
    });

    it('filters commands by keywords', async () => {
      render(<CommandPalette />);
      openPalette();
      
      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'create');
      
      // "New Application" should match because it has "create" keyword
      expect(screen.getByText('New Application')).toBeInTheDocument();
    });

    it('shows no results message when no commands match', async () => {
      render(<CommandPalette />);
      openPalette();
      
      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'xyznonexistent123');
      
      expect(screen.getByText(/No commands found/)).toBeInTheDocument();
    });

    it('clears search when dialog closes and reopens', () => {
      render(<CommandPalette />);
      
      // Open and search
      openPalette();
      const input = screen.getByPlaceholderText(/type a command/i);
      fireEvent.change(input, { target: { value: 'dashboard' } });
      
      // Close
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Reopen
      openPalette();
      
      // Search should be cleared
      const newInput = screen.getByPlaceholderText(/type a command/i);
      expect(newInput).toHaveValue('');
    });
  });

  describe('built-in commands', () => {
    it('displays all built-in commands initially', () => {
      render(<CommandPalette />);
      openPalette();
      
      expect(screen.getByText('New Application')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Go to Applications')).toBeInTheDocument();
      expect(screen.getByText('Import Applications')).toBeInTheDocument();
      expect(screen.getByText('Go to Settings')).toBeInTheDocument();
      expect(screen.getByText('Go to Billing')).toBeInTheDocument();
      expect(screen.getByText('Toggle Dark Mode')).toBeInTheDocument();
    });

    it('groups commands by category', () => {
      render(<CommandPalette />);
      openPalette();
      
      // Check category headers exist
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('navigates down with ArrowDown key', () => {
      render(<CommandPalette />);
      openPalette();
      
      const dialog = screen.getByRole('dialog');
      
      // Press down arrow
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      
      // Second command should be selected (data-selected="true")
      const buttons = screen.getAllByRole('button').filter(b => b.hasAttribute('data-selected'));
      const selectedButton = buttons.find(b => b.getAttribute('data-selected') === 'true');
      expect(selectedButton).toBeTruthy();
    });

    it('navigates up with ArrowUp key', () => {
      render(<CommandPalette />);
      openPalette();
      
      const dialog = screen.getByRole('dialog');
      
      // Press down twice then up once
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.keyDown(dialog, { key: 'ArrowUp' });
      
      const buttons = screen.getAllByRole('button').filter(b => b.hasAttribute('data-selected'));
      const selectedButtons = buttons.filter(b => b.getAttribute('data-selected') === 'true');
      expect(selectedButtons.length).toBe(1);
    });

    it('executes command on Enter key', async () => {
      render(<CommandPalette />);
      openPalette();
      
      const dialog = screen.getByRole('dialog');
      
      // First command is "New Application" (index 0)
      fireEvent.keyDown(dialog, { key: 'Enter' });
      
      // Should have navigated to new application page
      expect(mockPush).toHaveBeenCalledWith('/applications/new');
    });
  });

  describe('command execution', () => {
    it('navigates to new application page', () => {
      render(<CommandPalette />);
      openPalette();
      
      fireEvent.click(screen.getByText('New Application'));
      
      expect(mockPush).toHaveBeenCalledWith('/applications/new');
    });

    it('navigates to dashboard page', () => {
      render(<CommandPalette />);
      openPalette();
      
      fireEvent.click(screen.getByText('Go to Dashboard'));
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('navigates to applications page', () => {
      render(<CommandPalette />);
      openPalette();
      
      fireEvent.click(screen.getByText('Go to Applications'));
      
      expect(mockPush).toHaveBeenCalledWith('/applications');
    });

    it('navigates to import page', () => {
      render(<CommandPalette />);
      openPalette();
      
      fireEvent.click(screen.getByText('Import Applications'));
      
      expect(mockPush).toHaveBeenCalledWith('/applications/import');
    });

    it('navigates to settings page', () => {
      render(<CommandPalette />);
      openPalette();
      
      fireEvent.click(screen.getByText('Go to Settings'));
      
      expect(mockPush).toHaveBeenCalledWith('/settings/account');
    });

    it('navigates to billing page', () => {
      render(<CommandPalette />);
      openPalette();
      
      fireEvent.click(screen.getByText('Go to Billing'));
      
      expect(mockPush).toHaveBeenCalledWith('/settings/billing');
    });

    it('toggles dark mode when clicking Toggle Dark Mode', () => {
      render(<CommandPalette />);
      openPalette();
      
      // Initially not dark
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      // Click toggle
      fireEvent.click(screen.getByText('Toggle Dark Mode'));
      
      // Should now be dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('toggles light mode when already in dark mode', () => {
      // Set up dark mode
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      
      render(<CommandPalette />);
      openPalette();
      
      // Click toggle
      fireEvent.click(screen.getByText('Toggle Dark Mode'));
      
      // Should now be light
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('closes dialog after executing command', () => {
      render(<CommandPalette />);
      openPalette();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Go to Dashboard'));
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('additional commands prop', () => {
    it('renders additional commands from props', () => {
      const additionalCommands = [
        {
          id: 'custom-cmd',
          label: 'Custom Command',
          icon: <span>🎯</span>,
          category: 'Custom',
          keywords: ['custom', 'special'],
          action: vi.fn(),
        },
      ];
      
      render(<CommandPalette additionalCommands={additionalCommands} />);
      openPalette();
      
      expect(screen.getByText('Custom Command')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument(); // Category header
    });

    it('executes custom command action', () => {
      const customAction = vi.fn();
      const additionalCommands = [
        {
          id: 'custom-cmd',
          label: 'Custom Action',
          icon: <span>🎯</span>,
          category: 'Custom',
          keywords: ['custom'],
          action: customAction,
        },
      ];
      
      render(<CommandPalette additionalCommands={additionalCommands} />);
      openPalette();
      
      fireEvent.click(screen.getByText('Custom Action'));
      
      expect(customAction).toHaveBeenCalled();
    });

    it('filters additional commands by search', async () => {
      const additionalCommands = [
        {
          id: 'custom-cmd',
          label: 'Special Feature',
          icon: <span>🎯</span>,
          category: 'Custom',
          keywords: ['unique', 'special'],
          action: vi.fn(),
        },
      ];
      
      render(<CommandPalette additionalCommands={additionalCommands} />);
      openPalette();
      
      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'unique');
      
      expect(screen.getByText('Special Feature')).toBeInTheDocument();
      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on dialog', () => {
      render(<CommandPalette />);
      openPalette();
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Command palette');
    });

    it('has focusable search input that receives focus on open', () => {
      render(<CommandPalette />);
      openPalette();
      
      const input = screen.getByPlaceholderText(/type a command/i);
      expect(input).toHaveFocus();
    });

    it('closes dialog when clicking backdrop', () => {
      render(<CommandPalette />);
      openPalette();
      
      // Find and click the backdrop (the overlay with bg-black/50)
      const backdrop = document.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);
      
      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('visual states', () => {
    it('highlights hovered command', () => {
      render(<CommandPalette />);
      openPalette();
      
      const dashboardButton = screen.getByText('Go to Dashboard').closest('button');
      
      fireEvent.mouseEnter(dashboardButton!);
      
      expect(dashboardButton).toHaveAttribute('data-selected', 'true');
    });

    it('displays footer with keyboard shortcuts', () => {
      render(<CommandPalette />);
      openPalette();
      
      // Footer should mention navigation hints
      expect(screen.getByText(/navigate/)).toBeInTheDocument();
      expect(screen.getByText(/select/)).toBeInTheDocument();
    });
  });
});
