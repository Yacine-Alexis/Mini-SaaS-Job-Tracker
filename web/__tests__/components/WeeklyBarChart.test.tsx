/**
 * Component Tests: WeeklyBarChart
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeeklyBarChart from '@/components/WeeklyBarChart';

describe('WeeklyBarChart', () => {
  const mockData = [
    { weekStart: '2026-01-06', count: 5 },
    { weekStart: '2026-01-13', count: 10 },
    { weekStart: '2026-01-20', count: 3 },
  ];

  it('renders the chart title', () => {
    render(<WeeklyBarChart data={mockData} />);
    expect(screen.getByText('Weekly applications (last 8 weeks)')).toBeInTheDocument();
  });

  it('renders an SVG element', () => {
    const { container } = render(<WeeklyBarChart data={mockData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders correct number of bar groups', () => {
    const { container } = render(<WeeklyBarChart data={mockData} />);
    const groups = container.querySelectorAll('g');
    expect(groups).toHaveLength(mockData.length);
  });

  it('renders date labels (MM-DD format)', () => {
    render(<WeeklyBarChart data={mockData} />);
    // Labels are sliced to show 'MM-DD' format (slice(5))
    expect(screen.getByText('01-06')).toBeInTheDocument();
    expect(screen.getByText('01-13')).toBeInTheDocument();
    expect(screen.getByText('01-20')).toBeInTheDocument();
  });

  it('renders count values above bars', () => {
    render(<WeeklyBarChart data={mockData} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    const { container } = render(<WeeklyBarChart data={[]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const groups = container.querySelectorAll('g');
    expect(groups).toHaveLength(0);
  });

  it('handles data with all zero counts', () => {
    const zeroData = [
      { weekStart: '2026-01-06', count: 0 },
      { weekStart: '2026-01-13', count: 0 },
    ];
    render(<WeeklyBarChart data={zeroData} />);
    // Should still render without errors (max defaults to 1 for zero counts)
    const zeroTexts = screen.getAllByText('0');
    expect(zeroTexts).toHaveLength(2);
  });

  it('renders bars with rounded corners (rx, ry attributes)', () => {
    const { container } = render(<WeeklyBarChart data={mockData} />);
    const rects = container.querySelectorAll('rect');
    rects.forEach((rect) => {
      expect(rect).toHaveAttribute('rx', '8');
      expect(rect).toHaveAttribute('ry', '8');
    });
  });
});
