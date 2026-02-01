import nodemailer from "nodemailer";

/**
 * Escape HTML entities to prevent XSS in email templates
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape URL for use in href attributes
 * Only allows http/https URLs to prevent javascript: protocol attacks
 */
function escapeUrl(url: string): string {
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

function hasSmtp() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPasswordResetEmail(opts: { to: string; resetUrl: string }) {
  const from = process.env.EMAIL_FROM || "no-reply@localhost";

  // Dev fallback: log instead of sending
  if (!hasSmtp()) {
    console.log(`[DEV] Password reset link for ${opts.to}: ${opts.resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    }
  });

  // Escape URL for safe HTML embedding
  const safeUrl = escapeUrl(opts.resetUrl);
  const displayUrl = escapeHtml(opts.resetUrl);

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: "Reset your password",
    text: `Reset your password: ${opts.resetUrl}`,
    html: `
      <p>Reset your password:</p>
      <p><a href="${safeUrl}">${displayUrl}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `
  });
}
