"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, CheckCircle2, Loader2 } from "lucide-react";

const BENEFITS = [
  "Register unlimited client entries",
  "View all submitted client records",
  "See and manage all civic complaints in your area",
  "Priority support",
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function MembershipCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finishUp = async (verifyBody: Record<string, string> = {}) => {
    const verifyRes = await fetch("/api/membership/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verifyBody),
    });
    const data = await verifyRes.json();
    setLoading(false);

    if (verifyRes.ok && data.status === "success") {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(data.message || "Payment verification failed");
    }
  };

  const pay = async () => {
    setError("");
    setLoading(true);

    const orderRes = await fetch("/api/membership/create-order", { method: "POST" });
    const order = await orderRes.json();
    if (!orderRes.ok || order.status !== "success") {
      setError(order.message || "Could not start payment. Try again.");
      setLoading(false);
      return;
    }

    if (order.mock) {
      // No Razorpay keys configured - simulate a brief payment delay.
      await new Promise((r) => setTimeout(r, 900));
      await finishUp();
      return;
    }

    // Real Razorpay flow: open the checkout modal.
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setError("Could not load the payment window. Check your connection and try again.");
      setLoading(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Client & Complaint Registry",
      description: "Membership",
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        await finishUp(response);
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
      theme: { color: "#7c3aed" },
    });
    razorpay.open();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-md mx-auto">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-6 py-8 text-center text-white">
        <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-3 animate-scaleIn">
          <Crown size={26} />
        </div>
        <h2 className="text-2xl font-bold">Become a Member</h2>
        <p className="text-white/80 text-sm mt-1">One-time payment, lifetime access</p>
      </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-slate-900">₹499</span>
          <span className="text-gray-500 text-sm"> one-time</span>
        </div>

        <ul className="space-y-2.5 mb-6">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              {b}
            </li>
          ))}
        </ul>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={pay}
          disabled={loading}
          className="w-full bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing payment...
            </>
          ) : (
            "Pay ₹499 & Become a Member"
          )}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          Payments are processed by Razorpay. In mock mode (no API keys set), no real payment is
          charged.
        </p>
      </div>
    </div>
  );
}
