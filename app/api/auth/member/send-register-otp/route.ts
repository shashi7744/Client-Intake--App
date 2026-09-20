import { NextResponse } from "next/server";
import { findMemberByEmail, generateOtp, createEmailOtp } from "@/lib/db";
import { emailConfigured, sendOtpEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email } = await req.json();

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email address" },
      { status: 400 }
    );
  }
  if (await findMemberByEmail(email)) {
    return NextResponse.json(
      { status: "error", message: "An account with this email already exists" },
      { status: 409 }
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
