import nodemailer from "nodemailer";
import { 
  passwordResetTemplate, 
  welcomeTemplate, 
  followUpReminderTemplate, 
  interviewReminderTemplate,
  weeklyDigestTemplate,
  taskReminderTemplate,
  type EmailTemplate, 
  type ReminderItem,
  type InterviewItem,
  type DigestStats,
} from "./emailTemplates";
import { withEmailRetry } from "./retry";
import { logger, generateRequestId } from "./logger";

function hasSmtp(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    }
  });
}

async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  const from = process.env.EMAIL_FROM || "no-reply@localhost";

  // Dev fallback: log instead of sending
  if (!hasSmtp()) {
    logger.info("Email sent (dev mode - no SMTP)", {
      requestId: generateRequestId(),
      to: to.split("@")[0] + "@...", // Partial email for privacy
      subject: template.subject,
      preview: template.text.slice(0, 100),
    });
    return;
  }

  const transporter = createTransporter();
  
  // Use retry for SMTP sending
  await withEmailRetry(
    () => transporter.sendMail({
      from,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    }),
    `send-email-to-${to.split("@")[0]}` // Don't log full email
  );
}

export async function sendPasswordResetEmail(opts: { to: string; resetUrl: string }): Promise<void> {
  const template = passwordResetTemplate(opts.resetUrl);
  await sendEmail(opts.to, template);
}

export async function sendWelcomeEmail(opts: { to: string }): Promise<void> {
  const template = welcomeTemplate(opts.to);
  await sendEmail(opts.to, template);
}

export async function sendFollowUpReminderEmail(opts: { to: string; items: ReminderItem[]; dashboardUrl: string }): Promise<void> {
  const template = followUpReminderTemplate(opts.items, opts.dashboardUrl);
  await sendEmail(opts.to, template);
}

export async function sendInterviewReminderEmail(opts: { to: string; interview: InterviewItem; dashboardUrl: string }): Promise<void> {
  const template = interviewReminderTemplate(opts.interview, opts.dashboardUrl);
  await sendEmail(opts.to, template);
}

export async function sendWeeklyDigestEmail(opts: { to: string; stats: DigestStats; dashboardUrl: string }): Promise<void> {
  const template = weeklyDigestTemplate(opts.stats, opts.dashboardUrl);
  await sendEmail(opts.to, template);
}

export async function sendTaskReminderEmail(opts: { to: string; tasks: Array<{ title: string; company: string; dueDate: Date }>; dashboardUrl: string }): Promise<void> {
  const template = taskReminderTemplate(opts.tasks, opts.dashboardUrl);
  await sendEmail(opts.to, template);
}
