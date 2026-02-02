/**
 * Component Tests: Toast
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast, useToastActions } from '@/components/ui/Toast';

// Test component that uses the toast hook
function TestComponent() {
  const { addToast, toasts } = useToast();
  
  return (
    <div>
      <button 
        onClick={() => addToast({ type: 'success', title: 'Success!' })}
        data-testid="add-success"
      >
        Add Success
      </button>
      <button 
        onClick={() => addToast({ type: 'error', title: 'Error!', message: 'Something went wrong' })}
        data-testid="add-error"
      >
        Add Error
      </button>
      <span data-testid="toast-count">{toasts.length}</span>
    </div>
  );
}

// Test component using convenience methods
function TestActionsComponent() {
  const { success, error, info, warning } = useToastActions();
  
  return (
    <div>
      <button onClick={() => success('Success toast message')} data-testid="success">Trigger Success</button>
      <button onClick={() => error('Error toast message')} data-testid="error">Trigger Error</button>
      <button onClick={() => info('Info toast message')} data-testid="info">Trigger Info</button>
      <button onClick={() => warning('Warning toast message')} data-testid="warning">Trigger Warning</button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides toast context to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    // Should not throw and should render
    expect(screen.getByTestId('add-success')).toBeInTheDocument();
  });

  it('renders toast container with aria-live', () => {
    render(
      <ToastProvider>
        <div>Content</div>
      </ToastProvider>
    );
    
    const container = screen.getByLabelText('Notifications');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});

describe('useToast', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    function BadComponent() {
      useToast();
      return null;
    }
    
    expect(() => render(<BadComponent />)).toThrow('useToast must be used within ToastProvider');
    
    consoleSpy.mockRestore();
  });

  it('adds toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    
    fireEvent.click(screen.getByTestId('add-success'));
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('adds toast with message', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('add-error'));
    
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('can add multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('add-success'));
    fireEvent.click(screen.getByTestId('add-error'));
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
  });
});

describe('useToastActions', () => {
  it('provides convenience methods', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    // All buttons should be present
    expect(screen.getByTestId('success')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('info')).toBeInTheDocument();
    expect(screen.getByTestId('warning')).toBeInTheDocument();
  });

  it('success() adds success toast', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('success'));
    expect(screen.getByText('Success toast message')).toBeInTheDocument();
  });

  it('error() adds error toast', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('error'));
    expect(screen.getByText('Error toast message')).toBeInTheDocument();
  });

  it('info() adds info toast', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('info'));
    expect(screen.getByText('Info toast message')).toBeInTheDocument();
  });

  it('warning() adds warning toast', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('warning'));
    expect(screen.getByText('Warning toast message')).toBeInTheDocument();
  });
});

describe('Toast item', () => {
  it('displays dismiss button', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('add-success'));
    
    // Look for dismiss button (aria-label="Dismiss")
    const dismissButton = screen.getByLabelText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
  });

  it('removes toast when dismiss button clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('add-success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
    
    const dismissButton = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  it('renders toast with role alert for accessibility', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('add-success'));
    
    // Toast should have role="alert" for screen readers
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('Toast styling', () => {
  it('renders toast container for success', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('success'));
    
    // Verify toast appears in the notification container
    const container = screen.getByLabelText('Notifications');
    expect(container).toBeInTheDocument();
  });

  it('renders toast container for error', () => {
    render(
      <ToastProvider>
        <TestActionsComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByTestId('error'));
    
    const container = screen.getByLabelText('Notifications');
    expect(container).toBeInTheDocument();
  });
});
