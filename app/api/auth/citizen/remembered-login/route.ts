import { NextResponse } from "next/server";
import { findCitizenByEmail } from "@/lib/db";

// Restores session for a previously registered citizen on this device.
// Once registered via OTP, the citizen is remembered and can log in without OTP.
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ status: "error", message: "Email required" }, { status: 400 });
  }

  const citizen = await findCitizenByEmail(email.toLowerCase().trim());
  if (!citizen) {
    return NextResponse.json(
      { status: "error", message: "Citizen not registered yet. Please verify with OTP first." },
      { status: 404 }
    );
  }

  const response = NextResponse.json({
    status: "success",
    message: "Welcome back",
    email: citizen.email,
    name: citizen.name,
  });

  response.cookies.set("session", "citizen:" + citizen.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
