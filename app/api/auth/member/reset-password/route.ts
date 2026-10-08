import { NextResponse } from "next/server";
import { findMemberByEmail, verifyEmailOtp, setMemberPassword, deleteAllMemberDevices } from "@/lib/db";
import { emailConfigured } from "@/lib/email";

// Step 2 of "Forgot password?": check the emailed code and set the new password.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !otp) {
    return NextResponse.json({ status: "error", message: "Enter the code from your email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { status: "error", message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  let valid: boolean;
  if (emailConfigured) {
    valid = await verifyEmailOtp(email, otp);
  } else if (process.env.NODE_ENV !== "production") {
    valid = otp === "123456"; // local test mode only
  } else {
    valid = false;
  }

  const member = valid ? await findMemberByEmail(email) : undefined;
  if (!member) {
    return NextResponse.json({ status: "error", message: "Incorrect or expired code" }, { status: 400 });
  }

  await setMemberPassword(member.email, password);
  // Forget remembered devices: anyone using the old password must log in again.
  await deleteAllMemberDevices(member.email);

  return NextResponse.json({ status: "success", message: "Password changed. You can now log in." });
}
