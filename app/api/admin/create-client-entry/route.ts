import { NextResponse } from "next/server";
import { createMember, findMemberByEmail, saveClient } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { clientSchema } from "@/lib/schema";
import { buildClientRecord } from "@/lib/clientBuilder";

// Admin-only: creates a member account (email + password, no OTP - the admin
// is trusted) together with that person's client record.
export async function POST(req: Request) {
  const admin = await getCurrentMember();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const { email, password, client } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ status: "error", message: "Enter a valid email address" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { status: "error", message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }
  const parsed = clientSchema.safeParse(client);
  if (!parsed.success) {
    return NextResponse.json({ status: "error", message: "Client details are incomplete" }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (await findMemberByEmail(cleanEmail)) {
    return NextResponse.json(
      { status: "error", message: "An account with this email already exists" },
      { status: 409 }
    );
  }

  await createMember({
    email: cleanEmail,
    password,
    isPaid: true,
    role: "member",
    createdAt: new Date().toISOString(),
  });
  await saveClient(buildClientRecord(parsed.data, cleanEmail, true));

  return NextResponse.json({ status: "success" });
}
