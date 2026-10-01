import { NextResponse } from "next/server";
import { findMemberByEmail, createMember, saveClient, verifyEmailOtp } from "@/lib/db";
import { clientSchema } from "@/lib/schema";
import { buildClientRecord } from "@/lib/clientBuilder";
import { notifyAdmins } from "@/lib/notify";
import { emailConfigured } from "@/lib/email";
import { createSessionCookie } from "@/lib/sessionToken";

export async function POST(req: Request) {
  const { email, password, otp, client } = await req.json().catch(() => ({}));

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email address" },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { status: "error", message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }
  const parsedClient = clientSchema.safeParse(client);
  if (!parsedClient.success) {
    return NextResponse.json(
      { status: "error", message: "Please complete all your personal and location details" },
      { status: 400 }
    );
  }
  if (await findMemberByEmail(email)) {
    return NextResponse.json(
      { status: "error", message: "An account with this email already exists" },
      { status: 409 }
    );
  }

  if (!otp) {
    return NextResponse.json(
      { status: "error", message: "Enter the OTP sent to your email" },
      { status: 400 }
    );
  }
  if (emailConfigured) {
    const valid = await verifyEmailOtp(email, otp);
    if (!valid) {
      return NextResponse.json(
        { status: "error", message: "Incorrect or expired OTP" },
        { status: 400 }
      );
    }
  } else if (otp !== "123456") {
    return NextResponse.json(
      { status: "error", message: "Incorrect OTP. Try 123456 for this test build." },
      { status: 400 }
    );
  }

  // TODO: hash the password with bcrypt before storing, see lib/db.ts
  await createMember({
    email,
    password,
    isPaid: true,
    role: "member",
    createdAt: new Date().toISOString(),
  });
  await saveClient(buildClientRecord(parsedClient.data, email, true));

  await notifyAdmins({
    kind: "member_new",
    title: "New member signed up",
    body: `${parsedClient.data.name} (${email})`,
    section: "members",
  });

  const response = NextResponse.json({ status: "success", message: "Account created" });
  response.cookies.set("session", createSessionCookie("member", email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
