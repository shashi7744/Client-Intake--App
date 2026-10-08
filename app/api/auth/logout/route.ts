import { NextResponse } from "next/server";

// Ends the session. The device cookies (member_device / citizen_device) are
// kept so the login page can offer one-tap "continue as ..." on this device;
// logging in as someone else on it replaces them.
export async function POST() {
  const response = NextResponse.json({ status: "success" });
  response.cookies.delete("session");
  return response;
}
