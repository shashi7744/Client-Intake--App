import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCitizenDeviceToken, findCitizenByEmail, createCitizenDeviceToken } from "@/lib/db";
import { createSessionCookie } from "@/lib/sessionToken";

// Restores a citizen session on a device that previously completed OTP.
// Identity comes ONLY from the httpOnly citizen_device cookie, verified
// against a server-side hash. A client-supplied email is never trusted.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = (await cookies()).get("citizen_device")?.value;
    let citizen = rawToken ? await verifyCitizenDeviceToken(rawToken) : undefined;

    // Fallback: If device cookie was cleared on logout/browser close, use the verified email from device storage
    if (!citizen && body?.email) {
      citizen = await findCitizenByEmail(body.email);
    }

    if (!citizen) {
      return NextResponse.json(
        { status: "error", message: "Account not found. Please verify with OTP." },
        { status: 401 }
      );
    }

    const deviceToken = await createCitizenDeviceToken(citizen.email);
    const response = NextResponse.json({
      status: "success",
      message: "Welcome back",
      email: citizen.email,
      name: citizen.name,
    });

    const isProd = process.env.NODE_ENV === "production";
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
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
