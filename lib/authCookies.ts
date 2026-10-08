import type { NextResponse } from "next/server";
import { createSessionCookie, SessionType } from "@/lib/sessionToken";

const ONE_YEAR = 60 * 60 * 24 * 365;

function options() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
  };
}

export const MEMBER_DEVICE_COOKIE = "member_device";
export const CITIZEN_DEVICE_COOKIE = "citizen_device";

// Logs the user in, and (when given) remembers this device for one-tap login.
export function setLoginCookies(
  response: NextResponse,
  type: SessionType,
  email: string,
  deviceToken?: string
) {
  response.cookies.set("session", createSessionCookie(type, email), options());
  if (deviceToken) {
    const name = type === "member" ? MEMBER_DEVICE_COOKIE : CITIZEN_DEVICE_COOKIE;
    response.cookies.set(name, deviceToken, options());
  }
}
