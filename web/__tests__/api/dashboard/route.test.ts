/**
 * API Route Tests: /api/dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPrisma, mockRequireUserOr401 } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
  mockRequireUserOr401: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ requireUserOr401: mockRequireUserOr401 }));

import { GET } from '@/app/api/dashboard/route';

const mockUserId = 'user-123';

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

describe('/api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSuccess();
    // Default mock responses
    mockPrisma.jobApplication.count.mockResolvedValue(0);
    mockPrisma.jobApplication.groupBy.mockResolvedValue([]);
    mockPrisma.jobApplication.findMany.mockResolvedValue([]);
    mockPrisma.$queryRaw.mockResolvedValue([]);
  });

  describe('GET /api/dashboard', () => {
    it('returns dashboard stats successfully', async () => {
      // Total count
      mockPrisma.jobApplication.count.mockResolvedValue(10);
      // Stage groupBy
      mockPrisma.jobApplication.groupBy.mockResolvedValue([
        { stage: 'SAVED', _count: { stage: 3 } },
        { stage: 'APPLIED', _count: { stage: 4 } },
        { stage: 'INTERVIEW', _count: { stage: 2 } },
        { stage: 'OFFER', _count: { stage: 1 } },
      ]);
      // Activity dates
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        { createdAt: new Date() },
      ]);
      // Top tags
      mockPrisma.$queryRaw.mockResolvedValue([
        { tag: 'remote', count: BigInt(5) },
      ]);

      const req = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total).toBe(10);
      expect(data.stageCounts).toBeDefined();
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest('http://localhost/api/dashboard');
      expect((await GET(req)).status).toBe(401);
    });

    it('returns empty dashboard for new user', async () => {
      const req = new NextRequest('http://localhost/api/dashboard');
      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total).toBe(0);
    });
  });
});
