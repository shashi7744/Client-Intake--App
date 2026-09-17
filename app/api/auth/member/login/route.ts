import { NextResponse } from "next/server";
import { findMemberByEmail } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const member = await findMemberByEmail(email || "");

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

  response.cookies.set("session", "member:" + member.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // ~1 year - stay logged in until they log out
  });

  return response;
}
