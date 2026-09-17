import { NextResponse } from "next/server";
import { getComplaintsByEmail } from "@/lib/db";
import { getCurrentCitizenEmail } from "@/lib/session";

export async function GET() {
  const email = getCurrentCitizenEmail();
  if (!email) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }

  const complaints = await getComplaintsByEmail(email);
  return NextResponse.json({ status: "success", complaints });
}
