import nodemailer from "nodemailer";
import { passwordResetTemplate, welcomeTemplate, followUpReminderTemplate, type EmailTemplate, type ReminderItem } from "./emailTemplates";

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
    console.log(`[DEV] Email to ${to}:`);
    console.log(`  Subject: ${template.subject}`);
    console.log(`  Text: ${template.text.slice(0, 100)}...`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
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
