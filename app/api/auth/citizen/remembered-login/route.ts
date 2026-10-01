import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCitizenDeviceToken } from "@/lib/db";
import { createSessionCookie } from "@/lib/sessionToken";

// Restores a citizen session on a device that previously completed OTP.
// Identity comes ONLY from the httpOnly citizen_device cookie, verified
// against a server-side hash. A client-supplied email is never trusted.
export async function POST() {
  const rawToken = cookies().get("citizen_device")?.value;
  const citizen = rawToken ? await verifyCitizenDeviceToken(rawToken) : undefined;

  if (!citizen) {
    return NextResponse.json(
      { status: "error", message: "This device is not recognised. Please verify with OTP." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    status: "success",
    message: "Welcome back",
    email: citizen.email,
    name: citizen.name,
  });
  response.cookies.set("session", createSessionCookie("citizen", citizen.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
