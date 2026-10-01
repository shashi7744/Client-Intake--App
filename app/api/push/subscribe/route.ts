import { NextResponse } from "next/server";
import { savePushSubscription, deletePushSubscription } from "@/lib/db";
import { getRecipient } from "@/lib/session";

// Saves this phone/browser as a push target for the logged-in user.
export async function POST(req: Request) {
  const who = getRecipient();
  if (!who) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }
  const { subscription } = await req.json().catch(() => ({}));
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (
    typeof endpoint !== "string" || !endpoint.startsWith("https://") ||
    typeof p256dh !== "string" || typeof auth !== "string"
  ) {
    return NextResponse.json({ status: "error", message: "Invalid subscription" }, { status: 400 });
  }
  await savePushSubscription(who.type, who.email, { endpoint, p256dh, auth });
  return NextResponse.json({ status: "success" });
}

// Called on logout so a shared phone stops receiving the previous user's alerts.
export async function DELETE(req: Request) {
  const who = getRecipient();
  if (!who) return NextResponse.json({ status: "success" });
  const { endpoint } = await req.json().catch(() => ({}));
  if (typeof endpoint === "string") {
    await deletePushSubscription(endpoint, who.email, who.type);
  }
  return NextResponse.json({ status: "success" });
}
