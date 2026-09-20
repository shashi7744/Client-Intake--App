import { NextResponse } from "next/server";
import { findOrCreateCitizen, verifyEmailOtp } from "@/lib/db";
import { emailConfigured } from "@/lib/email";

export async function POST(req: Request) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json(
      { status: "error", message: "Missing email or OTP" },
      { status: 400 }
    );
  }

  if (emailConfigured) {
    const valid = await verifyEmailOtp(email, otp);
    if (!valid) {
      return NextResponse.json(
        { status: "failed", message: "Incorrect or expired OTP" },
        { status: 400 }
      );
    }
  } else if (otp !== "123456") {
    return NextResponse.json(
      { status: "failed", message: "Incorrect OTP. Try 123456 for this test build." },
      { status: 400 }
    );
  }

  const citizen = await findOrCreateCitizen(email);

  const response = NextResponse.json({
    status: "success",
    message: "Login successful",
    needsName: !citizen.name,
  });
  response.cookies.set("session", "citizen:" + citizen.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // ~1 year - stay logged in until they log out
  });
  return response;
}
