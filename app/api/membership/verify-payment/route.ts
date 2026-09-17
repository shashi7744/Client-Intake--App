import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentMember } from "@/lib/session";
import { setMemberPaid } from "@/lib/db";

// Verifies the signature Razorpay's checkout returns after a successful
// payment (razorpay_order_id, razorpay_payment_id, razorpay_signature).
// Falls back to trusting the client in mock mode (no RAZORPAY_KEY_SECRET
// set), matching the create-order route's mock behaviour.

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json(
      { status: "error", message: "Not logged in as a member" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({} as Record<string, string>));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as Record<
    string,
    string
  >;

  if (RAZORPAY_KEY_SECRET) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { status: "error", message: "Missing payment confirmation details" },
        { status: 400 }
      );
    }
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { status: "error", message: "Payment verification failed" },
        { status: 400 }
      );
    }
  }
  // else: Razorpay not configured -> mock mode, nothing to verify.

  await setMemberPaid(member.email, true);
  return NextResponse.json({ status: "success", message: "Membership activated" });
}
