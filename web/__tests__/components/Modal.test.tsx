/**
 * Component Tests: Modal
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';

describe('Modal', () => {
  let originalBodyOverflow: string;

  beforeEach(() => {
    originalBodyOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalBodyOverflow;
  });

  describe('Basic rendering', () => {
    it('renders when open is true', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <Modal open={false} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test Title">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <Modal 
          open={true} 
          onClose={() => {}} 
          title="Title"
          description="Test description"
        >
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });

  describe('Close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );
      
      // Click on the backdrop (the element with aria-hidden="true")
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside modal content', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <button>Inside button</button>
        </Modal>
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Inside button' }));
      // Should only be called if backdrop or close button is clicked
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body overflow', () => {
    it('sets body overflow to hidden when open', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when closed', () => {
      const { rerender } = render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <Modal open={false} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Size variants', () => {
    it('applies small size class', () => {
      render(
        <Modal open={true} onClose={() => {}} size="sm">
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('max-w-sm');
    });

    it('applies medium size class by default', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('max-w-md');
    });

    it('applies large size class', () => {
      render(
        <Modal open={true} onClose={() => {}} size="lg">
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('max-w-lg');
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title provided', () => {
      render(
        <Modal open={true} onClose={() => {}} title="My Title">
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('has aria-describedby when description provided', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Title" description="Description">
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    });
  });
});

describe('ConfirmModal', () => {
  it('renders with message', () => {
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        message="Sure?"
      />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Confirm"
        message="Sure?"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open={true}
        onClose={onClose}
        onConfirm={() => {}}
        title="Confirm"
        message="Sure?"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading is true', () => {
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm"
        message="Sure?"
        loading={true}
      />
    );
    
    // The confirm button should show loading text or be disabled
    const confirmButton = screen.getByRole('button', { name: /confirm|deleting|loading/i });
    expect(confirmButton).toBeInTheDocument();
  });

  it('applies danger variant styling', () => {
    const { container } = render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete"
        message="Delete this item?"
        variant="danger"
      />
    );
    
    // Look for red/danger styling class
    const confirmButton = screen.getByRole('button', { name: /confirm|delete/i });
    expect(confirmButton.className).toMatch(/red|danger/i);
  });

  it('uses custom confirm text', () => {
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete"
        message="Sure?"
        confirmText="Yes, delete"
      />
    );
    
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
  });
});
