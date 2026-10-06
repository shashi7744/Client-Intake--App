import { NextResponse } from "next/server";
import { findMemberByEmail } from "@/lib/db";
import { createSessionCookie } from "@/lib/sessionToken";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json(
        { status: "error", message: "Email is required" },
        { status: 400 }
      );
    }

    const member = await findMemberByEmail(email);
    if (!member) {
      return NextResponse.json(
        { status: "error", message: "Account not found. Please log in with your password." },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      status: "success",
      message: "Login successful",
      email: member.email,
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
  } catch (err: any) {
    console.error("Member remembered login error:", err);
    return NextResponse.json(
      { status: "error", message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
