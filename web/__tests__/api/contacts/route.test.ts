/**
 * API Route Tests: /api/contacts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPrisma, mockRequireUserOr401, mockAudit, mockEnforceRateLimit } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: { findFirst: vi.fn() },
    contact: {
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

import { GET, POST, PATCH, DELETE } from '@/app/api/contacts/route';

const mockUserId = 'user-123';
const mockAppId = 'app-456';

function createMockContact(overrides = {}) {
  return {
    id: `contact-${Date.now()}`,
    userId: mockUserId,
    applicationId: mockAppId,
    name: 'John Doe',
    role: 'Recruiter',
    email: 'john@company.com',
    phone: '555-1234',
    notes: 'Met at career fair',
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

describe('/api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSuccess();
  });

  describe('GET /api/contacts', () => {
    it('returns contacts for a valid application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({ id: mockAppId, userId: mockUserId });
      mockPrisma.contact.findMany.mockResolvedValue([createMockContact(), createMockContact({ id: 'contact-2' })]);

      const req = new NextRequest(`http://localhost/api/contacts?applicationId=${mockAppId}`);
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect((await response.json()).items).toHaveLength(2);
    });

    it('returns 404 for non-existent application', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/contacts?applicationId=invalid');
      expect((await GET(req)).status).toBe(404);
    });

    it('returns 401 for unauthenticated user', async () => {
      authFail();
      const req = new NextRequest(`http://localhost/api/contacts?applicationId=${mockAppId}`);
      expect((await GET(req)).status).toBe(401);
    });
  });

  describe('POST /api/contacts', () => {
    it('creates a contact successfully', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({ id: mockAppId, userId: mockUserId });
      mockPrisma.contact.create.mockResolvedValue(createMockContact());

      const req = new NextRequest('http://localhost/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: mockAppId,
          name: 'John Doe',
          role: 'Recruiter',
        }),
      });

      expect((await POST(req)).status).toBe(201);
      expect(mockAudit).toHaveBeenCalled();
    });

    it('returns 400 for missing name', async () => {
      const req = new NextRequest('http://localhost/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: mockAppId }),
      });
      expect((await POST(req)).status).toBe(400);
    });
  });

  describe('PATCH /api/contacts', () => {
    it('updates contact info', async () => {
      const contact = createMockContact({ id: 'contact-789' });
      mockPrisma.contact.findFirst.mockResolvedValue(contact);
      mockPrisma.contact.update.mockResolvedValue({ ...contact, name: 'Jane Doe' });

      const req = new NextRequest('http://localhost/api/contacts?id=contact-789', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane Doe' }),
      });

      expect((await PATCH(req)).status).toBe(200);
    });

    it('returns 404 for non-existent contact', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/contacts?id=invalid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane' }),
      });
      expect((await PATCH(req)).status).toBe(404);
    });

    it('returns 400 for missing contact id', async () => {
      const req = new NextRequest('http://localhost/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane' }),
      });
      expect((await PATCH(req)).status).toBe(400);
    });
  });

  describe('DELETE /api/contacts', () => {
    it('soft deletes a contact', async () => {
      const contact = createMockContact({ id: 'contact-789' });
      mockPrisma.contact.findFirst.mockResolvedValue(contact);
      mockPrisma.contact.update.mockResolvedValue({ ...contact, deletedAt: new Date() });

      const req = new NextRequest('http://localhost/api/contacts?id=contact-789', { method: 'DELETE' });
      expect((await DELETE(req)).status).toBe(200);
    });

    it('returns 404 for non-existent contact', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/contacts?id=invalid', { method: 'DELETE' });
      expect((await DELETE(req)).status).toBe(404);
    });
  });
});
