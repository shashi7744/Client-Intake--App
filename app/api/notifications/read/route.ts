import { NextResponse } from "next/server";
import { markNotificationsRead } from "@/lib/db";
import { getRecipient } from "@/lib/session";

// POST { id } marks one notification read; POST { all: true } marks all read.
export async function POST(req: Request) {
  const who = getRecipient();
  if (!who) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }
  const { id, all } = await req.json().catch(() => ({}));
  if (!all && (!id || typeof id !== "string")) {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
  await markNotificationsRead(who.type, who.email, all ? null : id);
  return NextResponse.json({ status: "success" });
}
