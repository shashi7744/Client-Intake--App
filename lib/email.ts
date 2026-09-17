// Thin wrapper around Resend's email API (https://resend.com/docs/api-reference/emails/send-email).
//
// Unlike MSG91, Resend only sends the email - it has no concept of an OTP.
// The actual code generation, storage, and expiry checking lives in
// lib/db.ts (generateOtp / createEmailOtp / verifyEmailOtp).
//
// Setup:
// 1. Create a free account at https://resend.com (3,000 emails/month free,
//    no credit card required).
// 2. Get an API key from the dashboard (API Keys section).
// 3. Add to .env.local:
//      RESEND_API_KEY=your_api_key
//      RESEND_FROM_EMAIL=onboarding@resend.dev
//    The onboarding@resend.dev address works immediately with no setup for
//    testing. To send from your own domain (e.g. noreply@yourdomain.com),
//    verify that domain in Resend's dashboard first, then use that address.
// 4. That's it - citizen login automatically switches from mock OTP
//    ("123456") to real emails once RESEND_API_KEY is set.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const resendConfigured = Boolean(RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Your verification code",
      html:
        `<p>Your OTP for <strong>Client &amp; Complaint Registry</strong> is:</p>` +
        `<p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${otp}</p>` +
        `<p>This code is valid for 5 minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  });

  if (res.ok) {
    return { success: true, message: "OTP sent to your email" };
  }
  const data = await res.json().catch(() => ({}));
  return {
    success: false,
    message: data.message || "Failed to send OTP email. Please try again.",
  };
}
