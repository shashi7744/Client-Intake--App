import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/db";
import { getRecipient } from "@/lib/session";

export async function GET() {
  const who = await getRecipient();
  if (!who) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }
  const data = await getNotifications(who.type, who.email);
  return NextResponse.json({ status: "success", ...data });
}
