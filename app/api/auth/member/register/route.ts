import { NextResponse } from "next/server";
import { findMemberByEmail, createMember, verifyEmailOtp } from "@/lib/db";
import { resendConfigured } from "@/lib/email";

export async function POST(req: Request) {
  const { email, password, otp } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email address" },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { status: "error", message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }
  if (await findMemberByEmail(email)) {
    return NextResponse.json(
      { status: "error", message: "An account with this email already exists" },
      { status: 409 }
    );
  }

  if (!otp) {
    return NextResponse.json(
      { status: "error", message: "Enter the OTP sent to your email" },
      { status: 400 }
    );
  }
  if (resendConfigured) {
    const valid = await verifyEmailOtp(email, otp);
    if (!valid) {
      return NextResponse.json(
        { status: "error", message: "Incorrect or expired OTP" },
        { status: 400 }
      );
    }
  } else if (otp !== "123456") {
    return NextResponse.json(
      { status: "error", message: "Incorrect OTP. Try 123456 for this test build." },
      { status: 400 }
    );
  }

  // TODO: hash the password with bcrypt before storing, see lib/db.ts
  await createMember({
    email,
    password,
    isPaid: false,
    role: "member",
    createdAt: new Date().toISOString(),
  });

  const response = NextResponse.json({ status: "success", message: "Account created" });
  response.cookies.set("session", "member:" + email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // ~1 year - stay logged in until they log out
  });
  return response;
}
