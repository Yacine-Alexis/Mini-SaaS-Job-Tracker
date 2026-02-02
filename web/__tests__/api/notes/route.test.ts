/**
 * API Route Tests: /api/notes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockPrisma, mockRequireUserOr401, mockAudit, mockEnforceRateLimit } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: { findFirst: vi.fn() },
    note: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockRequireUserOr401: vi.fn(),
  mockAudit: vi.fn(),
  mockEnforceRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ requireUserOr401: mockRequireUserOr401 }));
vi.mock('@/lib/audit', () => ({ audit: mockAudit }));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimitAsync: mockEnforceRateLimit }));

import { GET, POST, PATCH, DELETE } from '@/app/api/notes/route';

const mockUserId = 'user-123';
const mockAppId = 'app-456';

function createMockNote(overrides = {}) {
  return {
    id: `note-${Date.now()}`,
    userId: mockUserId,
    applicationId: mockAppId,
    content: 'Test note content',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createMockApp() {
  return { id: mockAppId, userId: mockUserId };
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

describe('/api/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSuccess();
  });

  describe('GET /api/notes', () => {
    it('returns notes for a valid application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(createMockApp());
      mockPrisma.note.findMany.mockResolvedValue([createMockNote(), createMockNote({ id: 'note-2' })]);

      const req = new NextRequest(`http://localhost/api/notes?applicationId=${mockAppId}`);
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(2);
    });

    it('returns 404 for non-existent application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/notes?applicationId=invalid-id');
      expect((await GET(req)).status).toBe(404);
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest(`http://localhost/api/notes?applicationId=${mockAppId}`);
      expect((await GET(req)).status).toBe(401);
    });

    it('returns 400 for missing applicationId', async () => {
      const req = new NextRequest('http://localhost/api/notes');
      expect((await GET(req)).status).toBe(400);
    });
  });

  describe('POST /api/notes', () => {
    it('creates a note successfully', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(createMockApp());
      mockPrisma.note.create.mockResolvedValue(createMockNote());

      const req = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: mockAppId, content: 'Test note' }),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);
      expect(mockAudit).toHaveBeenCalled();
    });

    it('returns 404 for non-existent application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: 'invalid', content: 'Test' }),
      });
      expect((await POST(req)).status).toBe(404);
    });

    it('returns 400 for missing content', async () => {
      const req = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: mockAppId }),
      });
      expect((await POST(req)).status).toBe(400);
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: mockAppId, content: 'Test' }),
      });
      expect((await POST(req)).status).toBe(401);
    });
  });

  describe('PATCH /api/notes', () => {
    it('updates a note successfully', async () => {
      const note = createMockNote({ id: 'note-789' });
      mockPrisma.note.findFirst.mockResolvedValue(note);
      mockPrisma.note.update.mockResolvedValue({ ...note, content: 'Updated' });

      const req = new NextRequest('http://localhost/api/notes?id=note-789', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated' }),
      });

      const response = await PATCH(req);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.item.content).toBe('Updated');
    });

    it('returns 404 for non-existent note', async () => {
      mockPrisma.note.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/notes?id=invalid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated' }),
      });
      expect((await PATCH(req)).status).toBe(404);
    });

    it('returns 400 for missing note id', async () => {
      const req = new NextRequest('http://localhost/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated' }),
      });
      expect((await PATCH(req)).status).toBe(400);
    });
  });

  describe('DELETE /api/notes', () => {
    it('soft deletes a note', async () => {
      const note = createMockNote({ id: 'note-789' });
      mockPrisma.note.findFirst.mockResolvedValue(note);
      mockPrisma.note.update.mockResolvedValue({ ...note, deletedAt: new Date() });

      const req = new NextRequest('http://localhost/api/notes?id=note-789', { method: 'DELETE' });
      const response = await DELETE(req);
      expect(response.status).toBe(200);
      expect((await response.json()).ok).toBe(true);
    });

    it('returns 404 for non-existent note', async () => {
      mockPrisma.note.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/notes?id=invalid', { method: 'DELETE' });
      expect((await DELETE(req)).status).toBe(404);
    });

    it('returns 400 for missing note id', async () => {
      const req = new NextRequest('http://localhost/api/notes', { method: 'DELETE' });
      expect((await DELETE(req)).status).toBe(400);
    });
  });
});
