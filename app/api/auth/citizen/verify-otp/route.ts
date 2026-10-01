import { NextResponse } from "next/server";
import { createCitizenDeviceToken, findOrCreateCitizen, verifyEmailOtp } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { createSessionCookie } from "@/lib/sessionToken";

export async function POST(req: Request) {
  const { email, otp } = await req.json().catch(() => ({}));

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
  const deviceToken = await createCitizenDeviceToken(citizen.email);

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({
    status: "success",
    message: "Login successful",
    needsName: !citizen.name,
  });
  response.cookies.set("session", createSessionCookie("citizen", citizen.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set("citizen_device", deviceToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
