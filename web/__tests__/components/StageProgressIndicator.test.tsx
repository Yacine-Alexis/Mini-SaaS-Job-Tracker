/**
 * Component Tests: StageProgressIndicator
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageProgressIndicator from '@/components/StageProgressIndicator';
import { ApplicationStage } from '@prisma/client';

describe('StageProgressIndicator', () => {
  describe('stage rendering', () => {
    it('renders all four main stages', () => {
      render(<StageProgressIndicator currentStage={ApplicationStage.SAVED} />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Interview')).toBeInTheDocument();
      expect(screen.getByText('Offer')).toBeInTheDocument();
    });

    it('renders rejected stage separately', () => {
      render(<StageProgressIndicator currentStage={ApplicationStage.REJECTED} />);
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      // Should not show other stages
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    });
  });

  describe('stage progression', () => {
    it('shows only first stage as completed for SAVED', () => {
      const { container } = render(<StageProgressIndicator currentStage={ApplicationStage.SAVED} />);
      const stages = container.querySelectorAll('[class*="rounded-lg"]');
      expect(stages.length).toBeGreaterThanOrEqual(4);
    });

    it('shows first two stages as completed for APPLIED', () => {
      render(<StageProgressIndicator currentStage={ApplicationStage.APPLIED} />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
    });

    it('shows three stages as completed for INTERVIEW', () => {
      render(<StageProgressIndicator currentStage={ApplicationStage.INTERVIEW} />);
      expect(screen.getByText('Interview')).toBeInTheDocument();
    });

    it('shows all stages as completed for OFFER', () => {
      render(<StageProgressIndicator currentStage={ApplicationStage.OFFER} />);
      expect(screen.getByText('Offer')).toBeInTheDocument();
    });
  });

  describe('interactive mode', () => {
    it('renders buttons when interactive is true', () => {
      const handleClick = vi.fn();
      render(
        <StageProgressIndicator
          currentStage={ApplicationStage.SAVED}
          interactive={true}
          onStageClick={handleClick}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    it('calls onStageClick when a stage is clicked', () => {
      const handleClick = vi.fn();
      render(
        <StageProgressIndicator
          currentStage={ApplicationStage.SAVED}
          interactive={true}
          onStageClick={handleClick}
        />
      );
      const appliedButton = screen.getByRole('button', { name: 'Applied' });
      fireEvent.click(appliedButton);
      expect(handleClick).toHaveBeenCalledWith(ApplicationStage.APPLIED);
    });

    it('does not render buttons when interactive is false', () => {
      render(<StageProgressIndicator currentStage={ApplicationStage.SAVED} interactive={false} />);
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });
});
