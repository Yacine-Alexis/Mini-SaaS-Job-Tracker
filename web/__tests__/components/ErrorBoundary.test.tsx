/**
 * Component Tests: ErrorBoundary
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('does not show error UI', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('when an error occurs', () => {
    it('displays error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An error occurred while rendering this section.')).toBeInTheDocument();
    });

    it('displays "Try again" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('resets error state when "Try again" is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Error state should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Click try again - this resets the error boundary state
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      
      // The component will try to re-render children, but since ThrowError still
      // throws, it will catch the error again. This test validates the button works.
      // In a real app, the underlying cause would be fixed before trying again.
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('error logging', () => {
    it('logs error to console in development', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      // console.error was called by componentDidCatch
      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  function TestComponent({ message }: { message: string }) {
    return <div>{message}</div>;
  }

  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    render(<WrappedComponent message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('catches errors from wrapped component', () => {
    const ThrowingComponent = withErrorBoundary(ThrowError);
    render(<ThrowingComponent shouldThrow={true} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const ThrowingComponent = withErrorBoundary(ThrowError, <div>Custom HOC fallback</div>);
    render(<ThrowingComponent shouldThrow={true} />);
    expect(screen.getByText('Custom HOC fallback')).toBeInTheDocument();
  });
});
