import { NextResponse } from "next/server";
import { findMemberByEmail, generateOtp, createEmailOtp, otpSentRecently } from "@/lib/db";
import { emailConfigured, sendOtpEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

// Step 1 of "Forgot password?": email a 6-digit code to the member.
// The reply is the same whether or not an account exists, so this can't be
// used to find out who is registered.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ status: "error", message: "Enter a valid email address" }, { status: 400 });
  }

  // Without real email, the test code 123456 would let anyone reset any
  // password - only allow that mode on a local dev server.
  if (!emailConfigured && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "error", message: "Password reset is not available right now. Please contact the admin." },
      { status: 503 }
    );
  }

  const sent = {
    status: "otp_sent",
    message: emailConfigured
      ? "If an account exists for this email, we've sent a 6-digit code to it."
      : "Test mode: use code 123456.",
  };

  if (await otpSentRecently(email, RESEND_COOLDOWN_SECONDS)) {
    return NextResponse.json(
      { status: "error", message: "A code was just sent. Please wait a minute before asking again." },
      { status: 429 }
    );
  }

  const member = await findMemberByEmail(email);
  if (!member || !emailConfigured) return NextResponse.json(sent);

  const otp = generateOtp();
  await createEmailOtp(email, otp);
  const result = await sendOtpEmail(email, otp);
  if (!result.success) {
    return NextResponse.json({ status: "error", message: result.message }, { status: 502 });
  }
  return NextResponse.json(sent);
}
