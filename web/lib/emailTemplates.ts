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

