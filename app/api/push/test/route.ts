import { NextResponse } from "next/server";
import { getRecipient } from "@/lib/session";
import { notifyUser } from "@/lib/notify";

export async function POST() {
  const who = await getRecipient();
  if (!who) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }

  await notifyUser(who.type, who.email, {
    kind: "test_alert",
    title: "Test Alert 🔔",
    body: "Mobile alerts and push notifications are working with vibration!",
  });

  return NextResponse.json({ status: "success", message: "Test alert sent" });
}
