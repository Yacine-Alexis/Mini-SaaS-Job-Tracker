/**
 * Component Tests: FiltersBar
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FiltersBar from '@/components/FiltersBar';
import { ApplicationStage } from '@prisma/client';

describe('FiltersBar', () => {
  const defaultProps = {
    q: '',
    stage: '' as '' | ApplicationStage,
    onQChange: vi.fn(),
    onStageChange: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search input', () => {
    it('renders search input with placeholder', () => {
      render(<FiltersBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search company, title, location…')).toBeInTheDocument();
    });

    it('displays current search value', () => {
      render(<FiltersBar {...defaultProps} q="Google" />);
      const input = screen.getByPlaceholderText('Search company, title, location…');
      expect(input).toHaveValue('Google');
    });

    it('calls onQChange when typing', () => {
      render(<FiltersBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search company, title, location…');
      fireEvent.change(input, { target: { value: 'Microsoft' } });
      expect(defaultProps.onQChange).toHaveBeenCalledWith('Microsoft');
    });
  });

  describe('stage dropdown', () => {
    it('renders stage dropdown with "All stages" option', () => {
      render(<FiltersBar {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('All stages')).toBeInTheDocument();
    });

    it('renders all ApplicationStage options', () => {
      render(<FiltersBar {...defaultProps} />);
      Object.values(ApplicationStage).forEach((stage) => {
        expect(screen.getByRole('option', { name: stage })).toBeInTheDocument();
      });
    });

    it('displays current stage value', () => {
      render(<FiltersBar {...defaultProps} stage={ApplicationStage.INTERVIEW} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue(ApplicationStage.INTERVIEW);
    });

    it('calls onStageChange when selecting a stage', () => {
      render(<FiltersBar {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: ApplicationStage.APPLIED } });
      expect(defaultProps.onStageChange).toHaveBeenCalledWith(ApplicationStage.APPLIED);
    });
  });

  describe('clear filters button', () => {
    it('does not show clear button when no filters applied', () => {
      render(<FiltersBar {...defaultProps} />);
      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });

    it('shows clear button when search is active', () => {
      render(<FiltersBar {...defaultProps} q="test" />);
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('shows clear button when stage is selected', () => {
      render(<FiltersBar {...defaultProps} stage={ApplicationStage.OFFER} />);
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('shows clear button when both filters are active', () => {
      render(<FiltersBar {...defaultProps} q="test" stage={ApplicationStage.SAVED} />);
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('calls onReset when clicking clear button', () => {
      render(<FiltersBar {...defaultProps} q="test" />);
      fireEvent.click(screen.getByText('Clear filters'));
      expect(defaultProps.onReset).toHaveBeenCalled();
    });

    it('does not show clear button when onReset is not provided', () => {
      render(<FiltersBar {...defaultProps} q="test" onReset={undefined} />);
      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible input elements', () => {
      render(<FiltersBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search company, title, location…')).toHaveClass('input');
      expect(screen.getByRole('combobox')).toHaveClass('input');
    });
  });
});
