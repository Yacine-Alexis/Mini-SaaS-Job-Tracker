/**
 * Component Tests: SalaryDisplay
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SalaryDisplay, { SalaryRangeBar } from '@/components/SalaryDisplay';

describe('SalaryDisplay', () => {
  describe('formatCurrency', () => {
    it('displays "Not specified" when both min and max are null', () => {
      render(<SalaryDisplay min={null} max={null} />);
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('displays single value when min equals max', () => {
      render(<SalaryDisplay min={100000} max={100000} />);
      expect(screen.getByText('$100k')).toBeInTheDocument();
    });

    it('displays range when min and max differ', () => {
      render(<SalaryDisplay min={80000} max={120000} />);
      expect(screen.getByText('$80k – $120k')).toBeInTheDocument();
    });

    it('displays "From X" when only min is specified', () => {
      render(<SalaryDisplay min={90000} max={null} />);
      expect(screen.getByText('From $90k')).toBeInTheDocument();
    });

    it('displays "Up to X" when only max is specified', () => {
      render(<SalaryDisplay min={null} max={150000} />);
      expect(screen.getByText('Up to $150k')).toBeInTheDocument();
    });

    it('formats millions correctly', () => {
      render(<SalaryDisplay min={1500000} max={1500000} />);
      expect(screen.getByText('$1.5M')).toBeInTheDocument();
    });

    it('formats small values without k suffix', () => {
      render(<SalaryDisplay min={500} max={500} />);
      expect(screen.getByText('$500')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      render(<SalaryDisplay min={100000} max={100000} className="my-custom-class" />);
      const element = screen.getByText('$100k');
      expect(element).toHaveClass('my-custom-class');
    });
  });
});

describe('SalaryRangeBar', () => {
  it('returns null when both min and max are null', () => {
    const { container } = render(<SalaryRangeBar min={null} max={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders range bar with valid values', () => {
    render(<SalaryRangeBar min={100000} max={150000} />);
    // Should show market range indicators
    expect(screen.getByText('$50k')).toBeInTheDocument(); // market min
    expect(screen.getByText('$200k')).toBeInTheDocument(); // market max
  });

  it('uses custom market range values', () => {
    render(<SalaryRangeBar min={100000} max={150000} marketMin={80000} marketMax={250000} />);
    expect(screen.getByText('$80k')).toBeInTheDocument();
    expect(screen.getByText('$250k')).toBeInTheDocument();
  });
});
