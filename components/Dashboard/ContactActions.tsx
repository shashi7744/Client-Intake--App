"use client";

import { MessageCircle, Phone } from "lucide-react";

// WhatsApp + Call buttons for a complainant's mobile number (India, +91).
export default function ContactActions({ phone }: { phone?: string }) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const intl = digits.length === 10 ? "91" + digits : digits;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-xs font-mono text-slate-700">{digits}</span>
      <a
        href={`https://wa.me/${intl}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full"
      >
        <MessageCircle size={12} /> WhatsApp
      </a>
      <a
        href={`tel:+${intl}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full"
      >
        <Phone size={12} /> Call
      </a>
    </div>
  );
}
