/**
 * Component Tests: DarkModeToggle
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DarkModeToggle from '@/components/DarkModeToggle';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia for this test file
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

describe('DarkModeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset document classes
    document.documentElement.classList.remove('dark');
    // Reset matchMedia mock to default (light mode)
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<DarkModeToggle />);
    // Component shows "Toggle theme" button during initial mount
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders toggle button after mounting', async () => {
    render(<DarkModeToggle />);
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('defaults to light mode without stored preference', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });
  });

  it('respects stored dark mode preference', async () => {
    localStorageMock.getItem.mockReturnValue('dark');
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });
  });

  it('toggles from light to dark mode on click', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('toggles from dark to light mode on click', async () => {
    localStorageMock.getItem.mockReturnValue('dark');
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });
});
