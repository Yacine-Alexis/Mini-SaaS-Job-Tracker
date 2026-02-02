/**
 * Component Tests: InterviewCalendar
 * 
 * Tests interview calendar functionality including:
 * - Month/Week/Agenda view switching
 * - Navigation (prev/next, today button)
 * - Interview display and grouping by date
 * - Selected date detail panel
 * - Loading state
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { InterviewCalendar, CalendarInterview } from '@/components/InterviewCalendar';
import { InterviewType, InterviewResult } from '@prisma/client';
import { format, addDays, subDays, startOfMonth, addMonths } from 'date-fns';

// Mock next/link - preserve className and other props
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

const createMockInterview = (overrides: Partial<CalendarInterview> = {}): CalendarInterview => {
  const today = new Date();
  return {
    id: `interview-${Math.random().toString(36).substr(2, 9)}`,
    scheduledAt: today.toISOString(),
    duration: 60,
    type: InterviewType.VIDEO,
    location: null,
    result: InterviewResult.PENDING,
    application: {
      id: 'app-1',
      company: 'Test Company',
      title: 'Software Engineer',
    },
    ...overrides,
  };
};

describe('InterviewCalendar', () => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers to control "today"
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading state', () => {
    it('displays skeleton loading state when loading', () => {
      render(<InterviewCalendar interviews={[]} loading={true} />);

      // Should show animated pulse elements
      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('does not show loading state when not loading', () => {
      render(<InterviewCalendar interviews={[]} loading={false} />);

      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBe(0);
    });
  });

  describe('view mode switching', () => {
    it('defaults to month view', () => {
      render(<InterviewCalendar interviews={[]} />);

      // Month view shows weekday headers
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('switches to week view when clicking Week button', () => {
      render(<InterviewCalendar interviews={[]} />);

      fireEvent.click(screen.getByRole('button', { name: 'Week' }));

      // Week view shows time slots
      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
    });

    it('switches to agenda view when clicking Agenda button', () => {
      render(<InterviewCalendar interviews={[]} />);

      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      // Agenda view shows "Upcoming Interviews" header
      expect(screen.getByText('Upcoming Interviews')).toBeInTheDocument();
    });

    it('highlights active view mode button', () => {
      render(<InterviewCalendar interviews={[]} />);

      const monthButton = screen.getByRole('button', { name: 'Month' });
      expect(monthButton).toHaveClass('bg-white');

      fireEvent.click(screen.getByRole('button', { name: 'Week' }));
      
      const weekButton = screen.getByRole('button', { name: 'Week' });
      expect(weekButton).toHaveClass('bg-white');
      expect(monthButton).not.toHaveClass('bg-white');
    });
  });

  describe('navigation', () => {
    it('displays current month and year in month view', () => {
      render(<InterviewCalendar interviews={[]} />);

      const currentMonthYear = format(today, 'MMMM yyyy');
      expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
    });

    it('navigates to previous month', () => {
      render(<InterviewCalendar interviews={[]} />);

      const prevButton = screen.getByRole('button', { name: 'Previous' });
      fireEvent.click(prevButton);

      const previousMonth = format(addMonths(today, -1), 'MMMM yyyy');
      expect(screen.getByText(previousMonth)).toBeInTheDocument();
    });

    it('navigates to next month', () => {
      render(<InterviewCalendar interviews={[]} />);

      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);

      const nextMonth = format(addMonths(today, 1), 'MMMM yyyy');
      expect(screen.getByText(nextMonth)).toBeInTheDocument();
    });

    it('returns to today when clicking Today button', () => {
      render(<InterviewCalendar interviews={[]} />);

      // Navigate away
      const nextButton = screen.getByRole('button', { name: 'Next' });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Click Today
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));

      const currentMonthYear = format(today, 'MMMM yyyy');
      expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
    });
  });

  describe('month view - calendar grid', () => {
    it('displays all days of the calendar grid', () => {
      render(<InterviewCalendar interviews={[]} />);

      // Should have 7 columns × several rows of days (28+ for month, can be exactly 28 in Feb)
      const dayNumbers = screen.getAllByText(/^[1-9]$|^[12][0-9]$|^3[01]$/);
      expect(dayNumbers.length).toBeGreaterThanOrEqual(28); // At least a month worth
    });

    it('highlights today', () => {
      render(<InterviewCalendar interviews={[]} />);

      // Find the day number that matches today
      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      
      // One of them should have the highlight class
      const highlighted = todayElements.find(el => 
        el.classList.contains('bg-blue-600') && el.classList.contains('text-white')
      );
      expect(highlighted).toBeTruthy();
    });

    it('displays interviews on their scheduled dates', () => {
      const interviewDate = today;
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: interviewDate.toISOString(),
          application: { id: 'app-1', company: 'Google', title: 'SWE' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      expect(screen.getByText(/Google/)).toBeInTheDocument();
    });

    it('shows "+N more" when day has more than 3 interviews', () => {
      const interviewDate = today;
      const interviews = [
        createMockInterview({ id: 'int-1', scheduledAt: interviewDate.toISOString(), application: { id: 'app-1', company: 'Company A', title: 'Role' } }),
        createMockInterview({ id: 'int-2', scheduledAt: interviewDate.toISOString(), application: { id: 'app-2', company: 'Company B', title: 'Role' } }),
        createMockInterview({ id: 'int-3', scheduledAt: interviewDate.toISOString(), application: { id: 'app-3', company: 'Company C', title: 'Role' } }),
        createMockInterview({ id: 'int-4', scheduledAt: interviewDate.toISOString(), application: { id: 'app-4', company: 'Company D', title: 'Role' } }),
        createMockInterview({ id: 'int-5', scheduledAt: interviewDate.toISOString(), application: { id: 'app-5', company: 'Company E', title: 'Role' } }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('selects a day when clicked', () => {
      render(<InterviewCalendar interviews={[]} />);

      // Click on a day (today)
      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      const dayCell = todayElements[0].closest('[class*="cursor-pointer"]');
      
      fireEvent.click(dayCell!);

      // Should show detail panel with full date
      const expectedDateFormat = format(today, 'EEEE, MMMM d, yyyy');
      expect(screen.getByText(expectedDateFormat)).toBeInTheDocument();
    });

    it('shows "No interviews scheduled" for day without interviews', () => {
      render(<InterviewCalendar interviews={[]} />);

      // Click on a day
      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      const dayCell = todayElements[0].closest('[class*="cursor-pointer"]');
      
      fireEvent.click(dayCell!);

      expect(screen.getByText('No interviews scheduled')).toBeInTheDocument();
    });

    it('deselects day when clicking same day again', () => {
      render(<InterviewCalendar interviews={[]} />);

      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      const dayCell = todayElements[0].closest('[class*="cursor-pointer"]');
      
      // Click to select
      fireEvent.click(dayCell!);
      expect(screen.getByText('No interviews scheduled')).toBeInTheDocument();

      // Click again to deselect
      fireEvent.click(dayCell!);
      expect(screen.queryByText('No interviews scheduled')).not.toBeInTheDocument();
    });
  });

  describe('week view', () => {
    it('shows time slots from 8am to 7pm', () => {
      render(<InterviewCalendar interviews={[]} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Week' }));

      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText('17:00')).toBeInTheDocument();
    });

    it('navigates by week instead of month', () => {
      render(<InterviewCalendar interviews={[]} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Week' }));

      // Header should say "Week of..."
      expect(screen.getByText(/Week of/)).toBeInTheDocument();
    });

    it('displays interviews in correct time slot', () => {
      const interviewAt10AM = new Date(today);
      interviewAt10AM.setHours(10, 30, 0, 0);
      
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: interviewAt10AM.toISOString(),
          application: { id: 'app-1', company: 'Morning Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Week' }));

      expect(screen.getByText('Morning Co')).toBeInTheDocument();
    });
  });

  describe('agenda view', () => {
    it('shows empty state when no upcoming interviews', () => {
      render(<InterviewCalendar interviews={[]} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      expect(screen.getByText('No upcoming interviews')).toBeInTheDocument();
      expect(screen.getByText('Schedule interviews from your job applications')).toBeInTheDocument();
    });

    it('shows upcoming interviews sorted by date', () => {
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: addDays(today, 3).toISOString(),
          application: { id: 'app-1', company: 'Later Co', title: 'Dev' },
        }),
        createMockInterview({
          id: 'int-2',
          scheduledAt: addDays(today, 1).toISOString(),
          application: { id: 'app-2', company: 'Sooner Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      const companies = screen.getAllByText(/Co$/);
      // Sooner should come before Later
      expect(companies[0]).toHaveTextContent('Sooner Co');
      expect(companies[1]).toHaveTextContent('Later Co');
    });

    it('excludes past interviews from agenda', () => {
      vi.useRealTimers();
      const pastDate = subDays(new Date(), 2);
      
      const interviews = [
        createMockInterview({
          id: 'int-past',
          scheduledAt: pastDate.toISOString(),
          application: { id: 'app-1', company: 'Past Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      expect(screen.queryByText('Past Co')).not.toBeInTheDocument();
      expect(screen.getByText('No upcoming interviews')).toBeInTheDocument();
    });

    it('excludes cancelled interviews from agenda', () => {
      const interviews = [
        createMockInterview({
          id: 'int-cancelled',
          scheduledAt: addDays(today, 1).toISOString(),
          result: InterviewResult.CANCELLED,
          application: { id: 'app-1', company: 'Cancelled Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      expect(screen.queryByText('Cancelled Co')).not.toBeInTheDocument();
    });

    it('shows interview type and duration', () => {
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: addDays(today, 1).toISOString(),
          type: InterviewType.TECHNICAL,
          duration: 90,
          application: { id: 'app-1', company: 'Tech Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      expect(screen.getByText('Tech Co')).toBeInTheDocument();
      expect(screen.getByText('90 min', { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/Technical/)).toBeInTheDocument();
    });

    it('shows interview result badge', () => {
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: addDays(today, 1).toISOString(),
          result: InterviewResult.PENDING,
          application: { id: 'app-1', company: 'Pending Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
  });

  describe('interview type styling', () => {
    const typeTests: { type: InterviewType; expectedClass: string }[] = [
      { type: InterviewType.PHONE, expectedClass: 'bg-blue-500' },
      { type: InterviewType.VIDEO, expectedClass: 'bg-purple-500' },
      { type: InterviewType.ONSITE, expectedClass: 'bg-orange-500' },
      { type: InterviewType.TECHNICAL, expectedClass: 'bg-cyan-500' },
      { type: InterviewType.BEHAVIORAL, expectedClass: 'bg-pink-500' },
      { type: InterviewType.FINAL, expectedClass: 'bg-emerald-500' },
      { type: InterviewType.OTHER, expectedClass: 'bg-zinc-500' },
    ];

    typeTests.forEach(({ type, expectedClass }) => {
      it(`displays correct color for ${type} interview type`, () => {
        const interviews = [
          createMockInterview({
            id: `int-${type}`,
            scheduledAt: today.toISOString(),
            type,
            application: { id: 'app-1', company: `${type} Co`, title: 'Dev' },
          }),
        ];

        render(<InterviewCalendar interviews={interviews} />);

        // The interview pill is a link with the color class directly on it
        const interviewLink = screen.getByRole('link', { name: new RegExp(`${type} Co`) });
        expect(interviewLink).toHaveClass(expectedClass);
      });
    });
  });

  describe('interview result styling', () => {
    it('applies correct styling for PASSED result', () => {
      const interviews = [
        createMockInterview({
          id: 'int-passed',
          scheduledAt: addDays(today, 1).toISOString(),
          result: InterviewResult.PASSED,
          application: { id: 'app-1', company: 'Passed Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      const badge = screen.getByText('PASSED');
      expect(badge).toHaveClass('text-green-700');
    });

    it('applies correct styling for FAILED result', () => {
      const interviews = [
        createMockInterview({
          id: 'int-failed',
          scheduledAt: addDays(today, 1).toISOString(),
          result: InterviewResult.FAILED,
          application: { id: 'app-1', company: 'Failed Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      const badge = screen.getByText('FAILED');
      expect(badge).toHaveClass('text-red-700');
    });

    it('applies strikethrough for CANCELLED result', () => {
      const interviews = [
        createMockInterview({
          id: 'int-cancelled',
          scheduledAt: today.toISOString(),
          result: InterviewResult.CANCELLED,
          application: { id: 'app-1', company: 'Cancelled Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      // In month view, check the detail panel
      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      const dayCell = todayElements[0].closest('[class*="cursor-pointer"]');
      fireEvent.click(dayCell!);

      const badge = screen.getByText('CANCELLED');
      expect(badge).toHaveClass('line-through');
    });
  });

  describe('interview links', () => {
    it('links to application detail page in month view', () => {
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: today.toISOString(),
          application: { id: 'app-link-test', company: 'Link Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      const link = screen.getByText(/Link Co/).closest('a');
      expect(link).toHaveAttribute('href', '/applications/app-link-test');
    });

    it('links to application detail page in agenda view', () => {
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: addDays(today, 1).toISOString(),
          application: { id: 'app-agenda-link', company: 'Agenda Link Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      const link = screen.getByText('Agenda Link Co').closest('a');
      expect(link).toHaveAttribute('href', '/applications/app-agenda-link');
    });
  });

  describe('selected day detail panel', () => {
    it('shows all interviews for selected day', () => {
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: today.toISOString(),
          application: { id: 'app-1', company: 'First Co', title: 'Dev' },
        }),
        createMockInterview({
          id: 'int-2',
          scheduledAt: today.toISOString(),
          application: { id: 'app-2', company: 'Second Co', title: 'Eng' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      // Click on today
      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      const dayCell = todayElements[0].closest('[class*="cursor-pointer"]');
      fireEvent.click(dayCell!);

      // Both should be shown in detail panel
      expect(screen.getAllByText('First Co').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Second Co').length).toBeGreaterThan(0);
    });

    it('displays interview time in detail panel', () => {
      const interviewAt2PM = new Date(today);
      interviewAt2PM.setHours(14, 30, 0, 0);
      
      const interviews = [
        createMockInterview({
          id: 'int-1',
          scheduledAt: interviewAt2PM.toISOString(),
          application: { id: 'app-1', company: 'Timed Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      // Click on today
      const todayNumber = format(today, 'd');
      const todayElements = screen.getAllByText(todayNumber);
      const dayCell = todayElements[0].closest('[class*="cursor-pointer"]');
      fireEvent.click(dayCell!);

      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    });
  });

  describe('interview sorting', () => {
    it('sorts interviews within a day by time', () => {
      const interviewDay = addDays(today, 1); // Use tomorrow to ensure it appears in agenda
      const morning = new Date(interviewDay);
      morning.setHours(9, 0, 0, 0);
      const afternoon = new Date(interviewDay);
      afternoon.setHours(15, 0, 0, 0);
      
      const interviews = [
        createMockInterview({
          id: 'int-afternoon',
          scheduledAt: afternoon.toISOString(),
          application: { id: 'app-1', company: 'Afternoon Co', title: 'Dev' },
        }),
        createMockInterview({
          id: 'int-morning',
          scheduledAt: morning.toISOString(),
          application: { id: 'app-2', company: 'Morning Co', title: 'Dev' },
        }),
      ];

      render(<InterviewCalendar interviews={interviews} />);

      // Switch to Agenda view which shows interviews sorted by time
      fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));

      // Get all interview links - they should be in chronological order
      const interviewLinks = screen.getAllByRole('link');
      const morningIndex = interviewLinks.findIndex(el => el.textContent?.includes('Morning Co'));
      const afternoonIndex = interviewLinks.findIndex(el => el.textContent?.includes('Afternoon Co'));
      
      expect(morningIndex).toBeLessThan(afternoonIndex);
    });
  });
});
