import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCitizenDeviceToken } from "@/lib/db";
import { setLoginCookies, CITIZEN_DEVICE_COOKIE } from "@/lib/authCookies";

// Restores a citizen session on a device that previously completed OTP.
// Identity comes ONLY from the httpOnly citizen_device cookie, verified
// against a server-side hash. A client-supplied email is never trusted.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = (await cookies()).get(CITIZEN_DEVICE_COOKIE)?.value;
    const citizen = rawToken ? await verifyCitizenDeviceToken(rawToken) : undefined;

    const shownEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    if (!citizen || (shownEmail && shownEmail !== citizen.email.toLowerCase())) {
      return NextResponse.json(
        { status: "error", message: "Please verify your email with OTP." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      status: "success",
      message: "Welcome back",
      email: citizen.email,
      name: citizen.name,
    });
    setLoginCookies(response, "citizen", citizen.email);
    return response;
  } catch (err: any) {
    console.error("Citizen remembered login error:", err);
    return NextResponse.json(
      { status: "error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
