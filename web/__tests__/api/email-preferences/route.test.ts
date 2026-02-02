/**
 * API Route Tests: /api/email-preferences
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPrisma, mockRequireUserOr401, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    emailPreferences: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
  mockRequireUserOr401: vi.fn(),
  mockAudit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ requireUserOr401: mockRequireUserOr401 }));
vi.mock('@/lib/audit', () => ({ audit: mockAudit }));

import { GET, PATCH } from '@/app/api/email-preferences/route';

const mockUserId = 'user-123';

function createMockPreferences(overrides = {}) {
  return {
    id: 'prefs-123',
    userId: mockUserId,
    interviewReminder: true,
    interviewReminderHours: 24,
    taskReminder: true,
    taskReminderHours: 24,
    followUpReminder: true,
    statusChangeNotify: true,
    digestFrequency: 'WEEKLY',
    digestDay: 1,
    digestHour: 9,
    staleAlertEnabled: true,
    staleAlertDays: 14,
    marketingEmails: false,
    unsubscribedAll: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function authSuccess() {
  mockRequireUserOr401.mockResolvedValue({ userId: mockUserId, error: null });
}

function authFail() {
  mockRequireUserOr401.mockResolvedValue({
    userId: null,
    error: new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  });
}

describe('/api/email-preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSuccess();
  });

  describe('GET /api/email-preferences', () => {
    it('returns existing preferences', async () => {
      mockPrisma.emailPreferences.findUnique.mockResolvedValue(createMockPreferences());

      const req = new NextRequest('http://localhost/api/email-preferences');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.preferences).toBeDefined();
      expect(data.preferences.interviewReminder).toBe(true);
    });

    it('creates default preferences for new user', async () => {
      mockPrisma.emailPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.emailPreferences.create.mockResolvedValue(createMockPreferences());

      const req = new NextRequest('http://localhost/api/email-preferences');
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockPrisma.emailPreferences.create).toHaveBeenCalled();
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest('http://localhost/api/email-preferences');
      expect((await GET(req)).status).toBe(401);
    });

    it('handles database errors', async () => {
      mockPrisma.emailPreferences.findUnique.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost/api/email-preferences');
      const response = await GET(req);

      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/email-preferences', () => {
    it('updates preferences successfully', async () => {
      const updated = createMockPreferences({ interviewReminder: false });
      mockPrisma.emailPreferences.upsert.mockResolvedValue(updated);

      const req = new NextRequest('http://localhost/api/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewReminder: false }),
      });

      const response = await PATCH(req);
      expect(response.status).toBe(200);
      expect(mockAudit).toHaveBeenCalled();
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest('http://localhost/api/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewReminder: false }),
      });
      expect((await PATCH(req)).status).toBe(401);
    });

    it('returns 400 for invalid data type', async () => {
      const req = new NextRequest('http://localhost/api/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewReminderHours: 'not-a-number' }),
      });
      expect((await PATCH(req)).status).toBe(400);
    });

    it('handles database errors', async () => {
      mockPrisma.emailPreferences.upsert.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost/api/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewReminder: false }),
      });

      const response = await PATCH(req);
      expect(response.status).toBe(500);
    });
  });
});
