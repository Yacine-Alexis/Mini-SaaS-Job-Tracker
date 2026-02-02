/**
 * Component Tests: KanbanBoard
 * 
 * Tests Kanban board functionality including:
 * - Rendering columns and cards
 * - Drag and drop interactions
 * - Keyboard navigation
 * - Accessibility attributes
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { KanbanBoard, StageSelector } from '@/components/KanbanBoard';
import { ApplicationStage } from '@prisma/client';
import { ToastProvider } from '@/components/ui/Toast';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Helper to render with ToastProvider
const renderWithToast = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

type MockApplication = {
  id: string;
  company: string;
  title: string;
  stage: ApplicationStage;
  location?: string | null;
};

const createMockApplication = (overrides: Partial<MockApplication> = {}): MockApplication => ({
  id: `app-${Math.random().toString(36).substr(2, 9)}`,
  company: 'Test Company',
  title: 'Software Engineer',
  stage: ApplicationStage.SAVED,
  location: null,
  ...overrides,
});

describe('KanbanBoard', () => {
  const mockOnStageChange = vi.fn().mockResolvedValue(undefined);
  const mockOnRefresh = vi.fn();

  const defaultApplications: MockApplication[] = [
    createMockApplication({ id: 'app-1', company: 'Google', title: 'Frontend Dev', stage: ApplicationStage.SAVED }),
    createMockApplication({ id: 'app-2', company: 'Microsoft', title: 'Backend Dev', stage: ApplicationStage.APPLIED }),
    createMockApplication({ id: 'app-3', company: 'Apple', title: 'iOS Dev', stage: ApplicationStage.INTERVIEW }),
    createMockApplication({ id: 'app-4', company: 'Amazon', title: 'Cloud Engineer', stage: ApplicationStage.OFFER }),
    createMockApplication({ id: 'app-5', company: 'Meta', title: 'ML Engineer', stage: ApplicationStage.REJECTED }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all five stage columns', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByRole('listbox', { name: /saved column/i })).toBeInTheDocument();
      expect(screen.getByRole('listbox', { name: /applied column/i })).toBeInTheDocument();
      expect(screen.getByRole('listbox', { name: /interview column/i })).toBeInTheDocument();
      expect(screen.getByRole('listbox', { name: /offer column/i })).toBeInTheDocument();
      expect(screen.getByRole('listbox', { name: /rejected column/i })).toBeInTheDocument();
    });

    it('renders application cards in correct columns', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const savedColumn = screen.getByRole('listbox', { name: /saved column/i });
      expect(within(savedColumn).getByText('Google')).toBeInTheDocument();

      const appliedColumn = screen.getByRole('listbox', { name: /applied column/i });
      expect(within(appliedColumn).getByText('Microsoft')).toBeInTheDocument();
    });

    it('displays company name and job title', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    });

    it('displays location when provided', () => {
      const appsWithLocation = [
        createMockApplication({
          id: 'app-loc',
          company: 'Remote Co',
          title: 'Remote Dev',
          stage: ApplicationStage.SAVED,
          location: 'San Francisco, CA',
        }),
      ];

      renderWithToast(
        <KanbanBoard
          applications={appsWithLocation}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByText(/San Francisco, CA/)).toBeInTheDocument();
    });

    it('displays empty state when column has no applications', () => {
      const singleApp = [
        createMockApplication({ id: 'app-1', stage: ApplicationStage.SAVED }),
      ];

      renderWithToast(
        <KanbanBoard
          applications={singleApp}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getAllByText('No applications').length).toBeGreaterThan(0);
    });
  });

  describe('drag and drop', () => {
    it('cards are draggable', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const cards = screen.getAllByRole('option');
      cards.forEach(card => {
        expect(card).toHaveAttribute('draggable', 'true');
      });
    });

    it('handles dragStart event', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleCard = screen.getByText('Google').closest('[role="option"]')!;
      
      fireEvent.dragStart(googleCard, {
        dataTransfer: { setData: vi.fn() }
      });

      expect(googleCard).toHaveClass('opacity-50');
    });

    it('handles dragEnd event', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleCard = screen.getByText('Google').closest('[role="option"]')!;
      
      fireEvent.dragStart(googleCard, {
        dataTransfer: { setData: vi.fn() }
      });
      
      fireEvent.dragEnd(googleCard);

      expect(googleCard).not.toHaveClass('opacity-50');
    });
  });

  describe('keyboard navigation', () => {
    it('cards are focusable', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const cards = screen.getAllByRole('option');
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('enters move mode with Space key', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleCard = screen.getByText('Google').closest('[role="option"]')!;
      googleCard.focus();
      
      fireEvent.keyDown(googleCard, { key: ' ' });
      
      expect(googleCard).toHaveAttribute('aria-selected', 'true');
    });

    it('exits move mode with Escape key', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleCard = screen.getByText('Google').closest('[role="option"]')!;
      googleCard.focus();
      
      fireEvent.keyDown(googleCard, { key: ' ' });
      expect(googleCard).toHaveAttribute('aria-selected', 'true');
      
      fireEvent.keyDown(googleCard, { key: 'Escape' });
      expect(googleCard).toHaveAttribute('aria-selected', 'false');
    });

    it('moves card to next stage with ArrowRight in move mode', async () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleCard = screen.getByText('Google').closest('[role="option"]')!;
      googleCard.focus();
      
      fireEvent.keyDown(googleCard, { key: ' ' });
      fireEvent.keyDown(googleCard, { key: 'ArrowRight' });
      
      expect(mockOnStageChange).toHaveBeenCalledWith('app-1', ApplicationStage.APPLIED);
    });
  });

  describe('accessibility', () => {
    it('has proper role="application" on board', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByRole('application')).toBeInTheDocument();
    });

    it('has proper aria-label on board', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByRole('application')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Kanban board')
      );
    });

    it('has proper role="listbox" on columns', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const listboxes = screen.getAllByRole('listbox');
      expect(listboxes.length).toBe(5);
    });

    it('has proper role="option" on cards', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(5);
    });

    it('provides descriptive aria-label on cards', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleCard = screen.getByText('Google').closest('[role="option"]')!;
      expect(googleCard).toHaveAttribute('aria-label', expect.stringContaining('Google'));
      expect(googleCard).toHaveAttribute('aria-label', expect.stringContaining('Frontend Dev'));
    });

    it('links navigate to application detail page', () => {
      renderWithToast(
        <KanbanBoard
          applications={defaultApplications}
          onStageChange={mockOnStageChange}
          onRefresh={mockOnRefresh}
        />
      );

      const googleLink = screen.getByText('Google').closest('a');
      expect(googleLink).toHaveAttribute('href', '/applications/app-1');
    });
  });
});

describe('StageSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all stage buttons', () => {
    render(
      <StageSelector
        currentStage={ApplicationStage.SAVED}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /applied/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /interview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /offer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument();
  });

  it('highlights current stage', () => {
    render(
      <StageSelector
        currentStage={ApplicationStage.INTERVIEW}
        onChange={mockOnChange}
      />
    );

    const interviewButton = screen.getByRole('button', { name: /interview/i });
    expect(interviewButton).toHaveClass('bg-white');
  });

  it('calls onChange when clicking a stage', () => {
    render(
      <StageSelector
        currentStage={ApplicationStage.SAVED}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /applied/i }));
    
    expect(mockOnChange).toHaveBeenCalledWith(ApplicationStage.APPLIED);
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <StageSelector
        currentStage={ApplicationStage.SAVED}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('does not call onChange when clicking disabled button', () => {
    render(
      <StageSelector
        currentStage={ApplicationStage.SAVED}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /applied/i }));
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
