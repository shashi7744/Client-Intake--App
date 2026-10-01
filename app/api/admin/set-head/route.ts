import { NextResponse } from "next/server";
import { findMemberByEmail, setMemberHead } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { districts } from "@/lib/locationData";
import { notifyUser } from "@/lib/notify";

// Admin-only: make a member the head of a district or taluka (or clear it).
// POST { email, level: "district" | "taluka" | "none", district?, taluka? }
export async function POST(req: Request) {
  const admin = await getCurrentMember();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const { email, level, district, taluka } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string" || !["district", "taluka", "none"].includes(level)) {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
  const target = await findMemberByEmail(email);
  if (!target) {
    return NextResponse.json({ status: "error", message: "Member not found" }, { status: 404 });
  }

  if (level === "none") {
    await setMemberHead(target.email, null, null, null);
    return NextResponse.json({ status: "success", headLevel: null, headDistrict: null, headTaluka: null });
  }

  if (typeof district !== "string" || !districts.includes(district)) {
    return NextResponse.json({ status: "error", message: "Select a valid district" }, { status: 400 });
  }
  const cleanTaluka = typeof taluka === "string" ? taluka.trim().slice(0, 60) : "";
  if (level === "taluka" && !cleanTaluka) {
    return NextResponse.json({ status: "error", message: "Enter the taluka" }, { status: 400 });
  }

  await setMemberHead(target.email, level, district, level === "taluka" ? cleanTaluka : null);
  await notifyUser("member", target.email, {
    kind: "head_role",
    title:
      level === "district"
        ? `You are now District Head of ${district}`
        : `You are now Taluka Head of ${cleanTaluka}, ${district}`,
    body: "A badge now shows next to your name in All Clients.",
    section: "all-clients",
  });

  return NextResponse.json({
    status: "success",
    headLevel: level,
    headDistrict: district,
    headTaluka: level === "taluka" ? cleanTaluka : null,
  });
}
