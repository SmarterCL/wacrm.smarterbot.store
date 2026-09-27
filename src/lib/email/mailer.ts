// ============================================================
// Mailer — thin nodemailer wrapper over the SMTP config in .env.production
//
// SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM / SMTP_FROM_NAME
// are set in .env.production on the server. Never imported client-side.
// ============================================================

import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_AUTH_ENABLED === 'true'
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail({ to, subject, html, replyTo }: SendMailOptions) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? 'SmarterCRM'}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
    replyTo,
  });
}
