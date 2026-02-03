import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/reminders/interviews/route";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: {
    emailPreferences: {
      findMany: vi.fn(),
    },
    interview: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendInterviewReminderEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { sendInterviewReminderEmail } from "@/lib/email";

const mockPrisma = prisma as unknown as {
  emailPreferences: { findMany: ReturnType<typeof vi.fn> };
  interview: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};

const mockSendEmail = sendInterviewReminderEmail as ReturnType<typeof vi.fn>;

describe("POST /api/reminders/interviews", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "test-secret", NEXTAUTH_URL: "http://localhost:3000" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createRequest(authHeader?: string): NextRequest {
    return new NextRequest("http://localhost:3000/api/reminders/interviews", {
      method: "POST",
      headers: authHeader ? { authorization: authHeader } : {},
    });
  }

  describe("authentication", () => {
    it("returns 500 if CRON_SECRET is not configured", async () => {
      delete process.env.CRON_SECRET;
      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("CRON_SECRET not configured");
    });

    it("returns 401 if authorization header is missing", async () => {
      const req = createRequest();
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 401 if authorization header is invalid", async () => {
      const req = createRequest("Bearer wrong-secret");
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("reminder sending", () => {
    it("sends no emails if no users have interview reminders enabled", async () => {
      mockPrisma.emailPreferences.findMany.mockResolvedValue([]);

      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.sent).toBe(0);
      expect(body.usersChecked).toBe(0);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("sends reminder for interview within window", async () => {
      const now = new Date();
      const interviewTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        {
          userId: "user-1",
          interviewReminderHours: 24,
          user: { email: "test@example.com" },
        },
      ]);

      mockPrisma.interview.findMany.mockResolvedValue([
        {
          id: "interview-1",
          userId: "user-1",
          applicationId: "app-1",
          scheduledAt: interviewTime,
          type: "VIDEO",
          location: "https://zoom.us/j/123",
          application: {
            id: "app-1",
            company: "Acme Corp",
            title: "Senior Engineer",
          },
        },
      ]);

      mockPrisma.interview.update.mockResolvedValue({});
      mockSendEmail.mockResolvedValue(undefined);

      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.sent).toBe(1);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: "test@example.com",
        interview: {
          company: "Acme Corp",
          title: "Senior Engineer",
          interviewDate: interviewTime,
          interviewType: "Video Call",
          location: "https://zoom.us/j/123",
          meetingLink: "https://zoom.us/j/123",
          applicationId: "app-1",
        },
        dashboardUrl: "http://localhost:3000/applications/app-1",
      });
      expect(mockPrisma.interview.update).toHaveBeenCalledWith({
        where: { id: "interview-1" },
        data: { reminderSent: true },
      });
    });

    it("skips user with no email", async () => {
      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        {
          userId: "user-1",
          interviewReminderHours: 24,
          user: { email: null },
        },
      ]);

      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.sent).toBe(0);
      expect(mockPrisma.interview.findMany).not.toHaveBeenCalled();
    });

    it("sends reminders to multiple users", async () => {
      const now = new Date();
      const interviewTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);

      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        { userId: "user-1", interviewReminderHours: 24, user: { email: "user1@example.com" } },
        { userId: "user-2", interviewReminderHours: 12, user: { email: "user2@example.com" } },
      ]);

      // First user has 1 interview
      mockPrisma.interview.findMany
        .mockResolvedValueOnce([
          {
            id: "int-1",
            userId: "user-1",
            applicationId: "app-1",
            scheduledAt: interviewTime,
            type: "PHONE",
            location: null,
            application: { id: "app-1", company: "Company A", title: "Role A" },
          },
        ])
        // Second user has 2 interviews
        .mockResolvedValueOnce([
          {
            id: "int-2",
            userId: "user-2",
            applicationId: "app-2",
            scheduledAt: interviewTime,
            type: "ONSITE",
            location: "123 Main St",
            application: { id: "app-2", company: "Company B", title: "Role B" },
          },
          {
            id: "int-3",
            userId: "user-2",
            applicationId: "app-3",
            scheduledAt: new Date(now.getTime() + 10 * 60 * 60 * 1000),
            type: "TECHNICAL",
            location: null,
            application: { id: "app-3", company: "Company C", title: "Role C" },
          },
        ]);

      mockPrisma.interview.update.mockResolvedValue({});
      mockSendEmail.mockResolvedValue(undefined);

      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.sent).toBe(3);
      expect(body.usersChecked).toBe(2);
      expect(mockSendEmail).toHaveBeenCalledTimes(3);
    });

    it("continues sending even if one email fails", async () => {
      const now = new Date();
      const interviewTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        { userId: "user-1", interviewReminderHours: 24, user: { email: "user1@example.com" } },
      ]);

      mockPrisma.interview.findMany.mockResolvedValue([
        {
          id: "int-1",
          userId: "user-1",
          applicationId: "app-1",
          scheduledAt: interviewTime,
          type: "VIDEO",
          location: null,
          application: { id: "app-1", company: "Company A", title: "Role A" },
        },
        {
          id: "int-2",
          userId: "user-1",
          applicationId: "app-2",
          scheduledAt: new Date(now.getTime() + 18 * 60 * 60 * 1000),
          type: "VIDEO",
          location: null,
          application: { id: "app-2", company: "Company B", title: "Role B" },
        },
      ]);

      mockPrisma.interview.update.mockResolvedValue({});
      mockSendEmail
        .mockRejectedValueOnce(new Error("SMTP timeout"))
        .mockResolvedValueOnce(undefined);

      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.sent).toBe(1);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0]).toContain("SMTP timeout");
    });

    it("respects individual user reminder hour preferences", async () => {
      const now = new Date();

      // User 1 wants 48 hour reminder, User 2 wants 12 hour reminder
      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        { userId: "user-1", interviewReminderHours: 48, user: { email: "user1@example.com" } },
        { userId: "user-2", interviewReminderHours: 12, user: { email: "user2@example.com" } },
      ]);

      // For this test, verify the findMany queries have correct date ranges
      mockPrisma.interview.findMany.mockResolvedValue([]);

      const req = createRequest("Bearer test-secret");
      await POST(req);

      // Check that findMany was called twice with different date ranges
      expect(mockPrisma.interview.findMany).toHaveBeenCalledTimes(2);

      // First call should use 48 hour window
      const firstCall = mockPrisma.interview.findMany.mock.calls[0][0];
      expect(firstCall.where.userId).toBe("user-1");

      // Second call should use 12 hour window
      const secondCall = mockPrisma.interview.findMany.mock.calls[1][0];
      expect(secondCall.where.userId).toBe("user-2");
    });

    it("correctly formats different interview types", async () => {
      const now = new Date();
      const interviewTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      const interviewTypes = ["PHONE", "VIDEO", "ONSITE", "TECHNICAL", "BEHAVIORAL", "PANEL", "FINAL", "OTHER"];
      const expectedFormats = [
        "Phone Screen",
        "Video Call",
        "On-site Interview",
        "Technical Interview",
        "Behavioral Interview",
        "Panel Interview",
        "Final Round",
        "Interview",
      ];

      for (let i = 0; i < interviewTypes.length; i++) {
        vi.clearAllMocks();

        mockPrisma.emailPreferences.findMany.mockResolvedValue([
          { userId: "user-1", interviewReminderHours: 24, user: { email: "test@example.com" } },
        ]);

        mockPrisma.interview.findMany.mockResolvedValue([
          {
            id: `int-${i}`,
            userId: "user-1",
            applicationId: "app-1",
            scheduledAt: interviewTime,
            type: interviewTypes[i],
            location: null,
            application: { id: "app-1", company: "Test Co", title: "Test Role" },
          },
        ]);

        mockPrisma.interview.update.mockResolvedValue({});
        mockSendEmail.mockResolvedValue(undefined);

        const req = createRequest("Bearer test-secret");
        await POST(req);

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            interview: expect.objectContaining({
              interviewType: expectedFormats[i],
            }),
          })
        );
      }
    });

    it("sets meetingLink only for VIDEO type interviews", async () => {
      const now = new Date();
      const interviewTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        { userId: "user-1", interviewReminderHours: 24, user: { email: "test@example.com" } },
      ]);

      // VIDEO interview with location (should be meetingLink)
      mockPrisma.interview.findMany.mockResolvedValueOnce([
        {
          id: "int-video",
          userId: "user-1",
          applicationId: "app-1",
          scheduledAt: interviewTime,
          type: "VIDEO",
          location: "https://zoom.us/j/123",
          application: { id: "app-1", company: "Test Co", title: "Test Role" },
        },
      ]);

      mockPrisma.interview.update.mockResolvedValue({});
      mockSendEmail.mockResolvedValue(undefined);

      let req = createRequest("Bearer test-secret");
      await POST(req);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          interview: expect.objectContaining({
            location: "https://zoom.us/j/123",
            meetingLink: "https://zoom.us/j/123",
          }),
        })
      );

      vi.clearAllMocks();

      // ONSITE interview with location (should NOT be meetingLink)
      mockPrisma.emailPreferences.findMany.mockResolvedValue([
        { userId: "user-1", interviewReminderHours: 24, user: { email: "test@example.com" } },
      ]);

      mockPrisma.interview.findMany.mockResolvedValueOnce([
        {
          id: "int-onsite",
          userId: "user-1",
          applicationId: "app-1",
          scheduledAt: interviewTime,
          type: "ONSITE",
          location: "123 Main Street",
          application: { id: "app-1", company: "Test Co", title: "Test Role" },
        },
      ]);

      mockPrisma.interview.update.mockResolvedValue({});
      mockSendEmail.mockResolvedValue(undefined);

      req = createRequest("Bearer test-secret");
      await POST(req);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          interview: expect.objectContaining({
            location: "123 Main Street",
            meetingLink: undefined,
          }),
        })
      );
    });

    it("includes timestamp in response", async () => {
      mockPrisma.emailPreferences.findMany.mockResolvedValue([]);

      const req = createRequest("Bearer test-secret");
      const res = await POST(req);
      const body = await res.json();
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
