import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMemberDeviceToken } from "@/lib/db";
import { setLoginCookies, MEMBER_DEVICE_COOKIE } from "@/lib/authCookies";

// One-tap "continue as ..." login on a device where this member previously
// logged in with their password. Identity comes ONLY from the httpOnly
// member_device cookie, checked against a server-side hash - an email sent
// by the browser is never enough on its own.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = (await cookies()).get(MEMBER_DEVICE_COOKIE)?.value;
    const member = rawToken ? await verifyMemberDeviceToken(rawToken) : undefined;

    // No valid device token, or it belongs to a different account than the
    // one shown on screen (someone else logged in on this device since).
    const shownEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    if (!member || (shownEmail && shownEmail !== member.email.toLowerCase())) {
      return NextResponse.json(
        { status: "error", message: "Please log in with your password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      status: "success",
      message: "Login successful",
      email: member.email,
      isPaid: member.isPaid,
    });
    setLoginCookies(response, "member", member.email);
    return response;
  } catch (err: any) {
    console.error("Member remembered login error:", err);
    return NextResponse.json(
      { status: "error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
