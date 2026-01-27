import nodemailer from "nodemailer";

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

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: "Reset your password",
    text: `Reset your password: ${opts.resetUrl}`,
    html: `
      <p>Reset your password:</p>
      <p><a href="${opts.resetUrl}">${opts.resetUrl}</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    `
  });
}
