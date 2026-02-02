/**
 * API Route Tests: /api/tasks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPrisma, mockRequireUserOr401, mockAudit, mockEnforceRateLimit } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: { findFirst: vi.fn() },
    task: {
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

import { GET, POST, PATCH, DELETE } from '@/app/api/tasks/route';

const mockUserId = 'user-123';
const mockAppId = 'app-456';

function createMockTask(overrides = {}) {
  return {
    id: `task-${Date.now()}`,
    userId: mockUserId,
    applicationId: mockAppId,
    title: 'Follow up',
    dueDate: new Date('2026-02-15'),
    status: 'OPEN',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

describe('/api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSuccess();
  });

  describe('GET /api/tasks', () => {
    it('returns tasks for a valid application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({ id: mockAppId, userId: mockUserId });
      mockPrisma.task.findMany.mockResolvedValue([createMockTask(), createMockTask({ id: 'task-2' })]);

      const req = new NextRequest(`http://localhost/api/tasks?applicationId=${mockAppId}`);
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect((await response.json()).items).toHaveLength(2);
    });

    it('returns 404 for non-existent application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks?applicationId=invalid');
      expect((await GET(req)).status).toBe(404);
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest(`http://localhost/api/tasks?applicationId=${mockAppId}`);
      expect((await GET(req)).status).toBe(401);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task successfully', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({ id: mockAppId, userId: mockUserId });
      mockPrisma.task.create.mockResolvedValue(createMockTask());

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: mockAppId, title: 'Follow up' }),
      });

      expect((await POST(req)).status).toBe(201);
      expect(mockAudit).toHaveBeenCalled();
    });

    it('returns 400 for missing title', async () => {
      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: mockAppId }),
      });
      expect((await POST(req)).status).toBe(400);
    });
  });

  describe('PATCH /api/tasks', () => {
    it('updates task status', async () => {
      const task = createMockTask({ id: 'task-789' });
      mockPrisma.task.findFirst.mockResolvedValue(task);
      mockPrisma.task.update.mockResolvedValue({ ...task, status: 'DONE' });

      const req = new NextRequest('http://localhost/api/tasks?id=task-789', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });

      expect((await PATCH(req)).status).toBe(200);
    });

    it('returns 404 for non-existent task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks?id=invalid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      expect((await PATCH(req)).status).toBe(404);
    });

    it('returns 400 for missing task id', async () => {
      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      expect((await PATCH(req)).status).toBe(400);
    });
  });

  describe('DELETE /api/tasks', () => {
    it('soft deletes a task', async () => {
      const task = createMockTask({ id: 'task-789' });
      mockPrisma.task.findFirst.mockResolvedValue(task);
      mockPrisma.task.update.mockResolvedValue({ ...task, deletedAt: new Date() });

      const req = new NextRequest('http://localhost/api/tasks?id=task-789', { method: 'DELETE' });
      expect((await DELETE(req)).status).toBe(200);
    });

    it('returns 404 for non-existent task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks?id=invalid', { method: 'DELETE' });
      expect((await DELETE(req)).status).toBe(404);
    });
  });
});
