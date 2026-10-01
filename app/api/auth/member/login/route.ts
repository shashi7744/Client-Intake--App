import { NextResponse } from "next/server";
import { findMemberByEmail } from "@/lib/db";
import { createSessionCookie } from "@/lib/sessionToken";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { status: "error", message: "Email and password are required" },
      { status: 400 }
    );
  }

  const member = await findMemberByEmail(email);

  if (!member || member.password !== password) {
    return NextResponse.json(
      { status: "error", message: "Invalid email or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    status: "success",
    message: "Login successful",
    isPaid: member.isPaid,
  });

  response.cookies.set("session", createSessionCookie("member", member.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
