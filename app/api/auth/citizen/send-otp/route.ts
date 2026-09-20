import { NextResponse } from "next/server";
import { generateOtp, createEmailOtp } from "@/lib/db";
import { emailConfigured, sendOtpEmail } from "@/lib/email";

// Uses Resend when configured (see lib/email.ts), otherwise falls back to a
// mock OTP ("123456") for local development. Unlike MSG91, Resend only
// sends the email - the OTP itself is generated and stored here.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email } = await req.json();

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email address" },
      { status: 400 }
    );
  }

  if (emailConfigured) {
    const otp = generateOtp();
    await createEmailOtp(email, otp);
    const result = await sendOtpEmail(email, otp);
    if (!result.success) {
      return NextResponse.json({ status: "error", message: result.message }, { status: 502 });
    }
    return NextResponse.json({ status: "otp_sent", message: result.message });
  }

  return NextResponse.json({
    status: "otp_sent",
    message: "OTP sent to your email (use 123456 to test) - Resend not configured, running in mock mode",
  });
}
