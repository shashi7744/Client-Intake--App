import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Real Razorpay integration.
//
// Setup:
// 1. Create a Razorpay account at https://razorpay.com and grab your
//    API keys from Settings -> API Keys.
// 2. Add to .env.local:
//      RAZORPAY_KEY_ID=your_key_id
//      RAZORPAY_KEY_SECRET=your_key_secret
// 3. That's it - this route (and verify-payment) automatically switch from
//    mock mode to real orders once these env vars are set. MembershipCard.tsx
//    opens Razorpay's checkout modal whenever a real key_id comes back.

const MEMBERSHIP_FEE_INR = 499;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST() {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    try {
      const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
      const order = await razorpay.orders.create({
        amount: MEMBERSHIP_FEE_INR * 100, // amount is in paise
        currency: "INR",
        receipt: "membership_" + Date.now(),
      });

      return NextResponse.json({
        status: "success",
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        mock: false,
      });
    } catch (err) {
      console.error("Razorpay order creation failed", err);
      return NextResponse.json(
        { status: "error", message: "Could not start payment. Try again." },
        { status: 502 }
      );
    }
  }

  // --- Mock fallback (no Razorpay keys configured) ---
  const mockOrderId = "mock-order-" + Math.random().toString(36).slice(2, 10);
  return NextResponse.json({
    status: "success",
    order_id: mockOrderId,
    amount: MEMBERSHIP_FEE_INR * 100,
    currency: "INR",
    key_id: null,
    mock: true,
  });
}
