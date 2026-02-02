/**
 * Email templates for the application.
 * Centralized templates with XSS protection built-in.
 */

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape URL for safe href usage
 */
export function escapeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "#invalid-url";
    }
    return escapeHtml(url);
  } catch {
    return "#invalid-url";
  }
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

/**
 * Password reset email template
 */
export function passwordResetTemplate(resetUrl: string): EmailTemplate {
  const safeUrl = escapeUrl(resetUrl);
  const displayUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your password - Job Tracker",
    text: `Reset your password

You requested to reset your password for your Job Tracker account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

---
Job Tracker Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">
                Reset your password
              </h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                You requested to reset your password for your Job Tracker account.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Click the button below to reset your password:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 6px; background-color: #18181b;">
                    <a href="${safeUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                Or copy and paste this link in your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #3b82f6; word-break: break-all;">
                <a href="${safeUrl}" style="color: #3b82f6; text-decoration: underline;">${displayUrl}</a>
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                This link will expire in <strong>1 hour</strong>.
              </p>
              <p style="margin: 0; font-size: 14px; color: #71717a;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          &copy; ${new Date().getFullYear()} Job Tracker. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

/**
 * Welcome email template (for future use)
 */
export function welcomeTemplate(userEmail: string): EmailTemplate {
  const safeEmail = escapeHtml(userEmail);

  return {
    subject: "Welcome to Job Tracker!",
    text: `Welcome to Job Tracker!

Hi there,

Thank you for signing up for Job Tracker. We're excited to help you organize your job search!

Get started by:
1. Adding your first job application
2. Setting up tasks and reminders
3. Tracking your progress

If you have any questions, feel free to reach out.

Best of luck with your job search!

---
Job Tracker Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Job Tracker</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">
                Welcome to Job Tracker! 🎉
              </h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Hi there,
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Thank you for signing up! We're excited to help you organize your job search.
              </p>
              <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                <strong>Get started by:</strong>
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #3f3f46;">
                <li>Adding your first job application</li>
                <li>Setting up tasks and reminders</li>
                <li>Tracking your progress</li>
              </ul>
              <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #3f3f46;">
                Best of luck with your job search! 🍀
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          &copy; ${new Date().getFullYear()} Job Tracker. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

/**
 * Follow-up reminder email template
 */
export interface ReminderItem {
  company: string;
  title: string;
  dueDate: string;
  taskTitle: string;
  applicationUrl: string;
}

export function followUpReminderTemplate(items: ReminderItem[], dashboardUrl: string): EmailTemplate {
  const safeDashboardUrl = escapeUrl(dashboardUrl);

  const taskListText = items.map(item => 
    `• ${item.company} - ${item.title}\n  Task: ${item.taskTitle}\n  Due: ${item.dueDate}`
  ).join("\n\n");

  const taskListHtml = items.map(item => {
    const safeAppUrl = escapeUrl(item.applicationUrl);
    return `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e4e4e7;">
        <div style="margin-bottom: 4px;">
          <a href="${safeAppUrl}" style="font-size: 16px; font-weight: 600; color: #18181b; text-decoration: none;">
            ${escapeHtml(item.company)}
          </a>
          <span style="color: #71717a;"> - ${escapeHtml(item.title)}</span>
        </div>
        <div style="font-size: 14px; color: #3f3f46; margin-bottom: 4px;">
          📋 ${escapeHtml(item.taskTitle)}
        </div>
        <div style="font-size: 13px; color: #f97316; font-weight: 500;">
          ⏰ Due: ${escapeHtml(item.dueDate)}
        </div>
      </td>
    </tr>`;
  }).join("");

  return {
    subject: `🔔 You have ${items.length} follow-up${items.length > 1 ? "s" : ""} due - Job Tracker`,
    text: `Follow-up Reminders

You have ${items.length} pending task${items.length > 1 ? "s" : ""} that need your attention:

${taskListText}

Log in to your dashboard to take action:
${dashboardUrl}

---
Job Tracker Team

Tip: Stay on top of your applications by completing follow-ups promptly!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow-up Reminders</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #18181b;">
                🔔 Follow-up Reminders
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #71717a;">
                You have ${items.length} pending task${items.length > 1 ? "s" : ""} that need your attention
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px; margin-bottom: 24px;">
                ${taskListHtml}
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #3b82f6;">
                    <a href="${safeDashboardUrl}" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #71717a; text-align: center;">
                💡 Tip: Stay on top of your applications by completing follow-ups promptly!
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          &copy; ${new Date().getFullYear()} Job Tracker. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

/**
 * Interview item for interview reminder emails
 */
export interface InterviewItem {
  company: string;
  title: string;
  interviewDate: Date;
  interviewType: string;
  location?: string;
  meetingLink?: string;
  applicationId: string;
}

/**
 * Interview reminder email template
 */
export function interviewReminderTemplate(
  interview: InterviewItem,
  dashboardUrl: string
): EmailTemplate {
  const safeCompany = escapeHtml(interview.company);
  const safeTitle = escapeHtml(interview.title);
  const safeType = escapeHtml(interview.interviewType);
  const safeLocation = interview.location ? escapeHtml(interview.location) : null;
  const safeDashboardUrl = escapeUrl(dashboardUrl);
  const safeMeetingLink = interview.meetingLink ? escapeUrl(interview.meetingLink) : null;
  
  const dateStr = interview.interviewDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = interview.interviewDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    subject: `Interview Reminder: ${interview.company} - ${interview.title}`,
    text: `Interview Reminder

You have an upcoming interview:

Company: ${interview.company}
Position: ${interview.title}
Type: ${interview.interviewType}
Date: ${dateStr}
Time: ${timeStr}
${interview.location ? `Location: ${interview.location}` : ""}
${interview.meetingLink ? `Meeting Link: ${interview.meetingLink}` : ""}

Good luck with your interview!

View in Dashboard: ${dashboardUrl}

---
Job Tracker Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #18181b;">
                📅 Interview Reminder
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #71717a;">
                You have an upcoming interview!
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #18181b;">
                      ${safeCompany}
                    </h2>
                    <p style="margin: 0 0 12px; font-size: 16px; color: #3f3f46;">
                      ${safeTitle}
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a; width: 80px;">Type:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #3f3f46;">${safeType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Date:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #3f3f46; font-weight: 600;">${escapeHtml(dateStr)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Time:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #3f3f46; font-weight: 600;">${escapeHtml(timeStr)}</td>
                      </tr>
                      ${safeLocation ? `
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Location:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #3f3f46;">${safeLocation}</td>
                      </tr>
                      ` : ""}
                    </table>
                    ${safeMeetingLink ? `
                    <a href="${safeMeetingLink}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #3b82f6; border-radius: 6px; text-decoration: none;">
                      Join Meeting
                    </a>
                    ` : ""}
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #18181b;">
                    <a href="${safeDashboardUrl}" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                      View Application
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #71717a; text-align: center;">
                🍀 Good luck with your interview!
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          &copy; \${new Date().getFullYear()} Job Tracker. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

/**
 * Digest statistics interface
 */
export interface DigestStats {
  totalApplications: number;
  newThisWeek: number;
  interviewsThisWeek: number;
  offersReceived: number;
  tasksDue: number;
  upcomingInterviews: Array<{ company: string; title: string; date: Date }>;
  staleApplications: Array<{ company: string; title: string; daysSinceUpdate: number }>;
}

/**
 * Weekly digest email template
 */
export function weeklyDigestTemplate(
  stats: DigestStats,
  dashboardUrl: string
): EmailTemplate {
  const safeDashboardUrl = escapeUrl(dashboardUrl);

  const upcomingHtml = stats.upcomingInterviews.length > 0
    ? stats.upcomingInterviews.map(i => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e4e4e7;">
          <span style="font-weight: 500; color: #18181b;">${escapeHtml(i.company)}</span>
          <span style="color: #71717a;"> - ${escapeHtml(i.title)}</span>
          <br>
          <span style="font-size: 12px; color: #3b82f6;">${escapeHtml(i.date.toLocaleDateString())}</span>
        </td>
      </tr>
    `).join("")
    : `<tr><td style="padding: 12px; color: #71717a; font-style: italic;">No upcoming interviews</td></tr>`;

  const staleHtml = stats.staleApplications.length > 0
    ? stats.staleApplications.slice(0, 5).map(a => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e4e4e7;">
          <span style="font-weight: 500; color: #18181b;">${escapeHtml(a.company)}</span>
          <span style="color: #71717a;"> - ${escapeHtml(a.title)}</span>
          <br>
          <span style="font-size: 12px; color: #f59e0b;">${a.daysSinceUpdate} days since update</span>
        </td>
      </tr>
    `).join("")
    : "";

  return {
    subject: `Your Weekly Job Search Summary - Job Tracker`,
    text: `Weekly Job Search Summary

Here's your weekly overview:

Applications: ${stats.totalApplications} total (${stats.newThisWeek} new this week)
Interviews: ${stats.interviewsThisWeek} this week
Offers: ${stats.offersReceived}
Tasks Due: ${stats.tasksDue}

View your dashboard: ${dashboardUrl}

---
Job Tracker Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Job Search Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #18181b;">
                📊 Weekly Summary
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #71717a;">
                Here's your job search overview for this week
              </p>
              
              <!-- Stats Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="width: 50%; padding: 12px; background-color: #f0f9ff; border-radius: 8px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #3b82f6;">${stats.totalApplications}</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">Total Applications</p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #22c55e;">+${stats.newThisWeek} this week</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="width: 50%; padding: 12px; background-color: #f0fdf4; border-radius: 8px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #22c55e;">${stats.interviewsThisWeek}</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">Interviews</p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #71717a;">this week</p>
                  </td>
                </tr>
                <tr><td colspan="3" style="height: 8px;"></td></tr>
                <tr>
                  <td style="width: 50%; padding: 12px; background-color: #fefce8; border-radius: 8px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #eab308;">${stats.offersReceived}</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">Offers Received</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="width: 50%; padding: 12px; background-color: #fdf4ff; border-radius: 8px;">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #a855f7;">${stats.tasksDue}</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">Tasks Due</p>
                  </td>
                </tr>
              </table>

              <!-- Upcoming Interviews -->
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">
                📅 Upcoming Interviews
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px; margin-bottom: 24px;">
                ${upcomingHtml}
              </table>

              ${stats.staleApplications.length > 0 ? `
              <!-- Stale Applications -->
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">
                ⏰ Needs Attention
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 8px; margin-bottom: 24px;">
                ${staleHtml}
              </table>
              ` : ""}

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #3b82f6;">
                    <a href="${safeDashboardUrl}" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #71717a; text-align: center;">
                Keep up the great work! 💪
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          &copy; \${new Date().getFullYear()} Job Tracker. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

/**
 * Task reminder email template
 */
export function taskReminderTemplate(
  tasks: Array<{ title: string; company: string; dueDate: Date }>,
  dashboardUrl: string
): EmailTemplate {
  const safeDashboardUrl = escapeUrl(dashboardUrl);

  const tasksHtml = tasks.map(t => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">
        <span style="font-weight: 500; color: #18181b;">${escapeHtml(t.title)}</span>
        <br>
        <span style="font-size: 13px; color: #71717a;">${escapeHtml(t.company)}</span>
        <span style="font-size: 12px; color: #f59e0b; margin-left: 8px;">Due: ${escapeHtml(t.dueDate.toLocaleDateString())}</span>
      </td>
    </tr>
  `).join("");

  return {
    subject: `Task Reminder: ${tasks.length} task${tasks.length > 1 ? "s" : ""} due soon`,
    text: `Task Reminder

You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} due soon:

${tasks.map(t => `- ${t.title} (${t.company}) - Due: ${t.dueDate.toLocaleDateString()}`).join("\n")}

View in Dashboard: ${dashboardUrl}

---
Job Tracker Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #18181b;">
                ✅ Task Reminder
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #71717a;">
                You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} due soon
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fefce8; border-radius: 8px; margin-bottom: 24px;">
                ${tasksHtml}
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #18181b;">
                    <a href="${safeDashboardUrl}" style="display: inline-block; padding: 12px 32px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">
                      View Tasks
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          &copy; \${new Date().getFullYear()} Job Tracker. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}
