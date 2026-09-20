// Gmail SMTP email sender using Nodemailer.
//
// Completely free — 500 emails/day (15,000/month) with any Gmail account.
// No domain purchase needed. Works with any recipient email address.
//
// Setup:
// 1. Enable 2-Step Verification on your Gmail account.
// 2. Go to https://myaccount.google.com/apppasswords → create an app password.
// 3. Add to .env.local:
//      GMAIL_USER=your_email@gmail.com
//      GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
// 4. That's it — OTP emails will be sent to any user for free.
//
// The actual OTP code generation, storage, and expiry checking lives in
// lib/db.ts (generateOtp / createEmailOtp / verifyEmailOtp).

import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

export const emailConfigured = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

// Create a reusable transporter (connection is pooled automatically)
const transporter = emailConfigured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })
  : null;

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  if (!transporter) {
    return { success: false, message: "Email not configured" };
  }

  try {
    await transporter.sendMail({
      from: `"Client & Complaint Registry" <${GMAIL_USER}>`,
      to: email,
      subject: "Your verification code",
      html:
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">` +
        `<h2 style="color:#7c3aed;margin-bottom:16px;">Verification Code</h2>` +
        `<p style="color:#334155;">Your OTP for <strong>Client & Complaint Registry</strong> is:</p>` +
        `<p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#7c3aed;margin:24px 0;text-align:center;">${otp}</p>` +
        `<p style="color:#64748b;font-size:14px;">This code is valid for <strong>5 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>` +
        `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>` +
        `<p style="color:#94a3b8;font-size:12px;text-align:center;">Client & Complaint Registry App</p>` +
        `</div>`,
    });

    return { success: true, message: "OTP sent to your email" };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Gmail SMTP error:", errMsg);
    return {
      success: false,
      message: "Failed to send OTP email. Please try again.",
    };
  }
}
