import { NextResponse } from "next/server";
import { findMemberByEmail, setMemberPassword, createMemberDeviceToken } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setLoginCookies } from "@/lib/authCookies";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json().catch(() => ({}));

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { status: "error", message: "Email and password are required" },
        { status: 400 }
      );
    }

    const member = await findMemberByEmail(email);
    const check = member ? await verifyPassword(password, member.password) : { ok: false, needsRehash: false };

    if (!member || !check.ok) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Accounts created before hashing still hold a plain-text password:
    // replace it with a hash now that we know it's correct.
    if (check.needsRehash) {
      await setMemberPassword(member.email, password);
    }

    const response = NextResponse.json({
      status: "success",
      message: "Login successful",
      isPaid: member.isPaid,
    });
    setLoginCookies(response, "member", member.email, await createMemberDeviceToken(member.email));
    return response;
  } catch (err: any) {
    console.error("Member login error:", err);
    return NextResponse.json(
      { status: "error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
