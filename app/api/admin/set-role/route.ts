import { NextResponse } from "next/server";
import { countAdmins, findMemberByEmail, setMemberRole } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { notifyUser } from "@/lib/notify";

export async function POST(req: Request) {
  const admin = await getCurrentMember();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const { email, role } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string" || (role !== "admin" && role !== "member")) {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }

  const target = await findMemberByEmail(email);
  if (!target) {
    return NextResponse.json({ status: "error", message: "Member not found" }, { status: 404 });
  }

  if (role === "member") {
    if (target.email.toLowerCase() === admin.email.toLowerCase()) {
      return NextResponse.json(
        { status: "error", message: "You cannot remove your own admin access" },
        { status: 400 }
      );
    }
    if (target.role === "admin" && (await countAdmins()) <= 1) {
      return NextResponse.json(
        { status: "error", message: "At least one admin must remain" },
        { status: 400 }
      );
    }
  }

  await setMemberRole(target.email, role);
  await notifyUser("member", target.email, {
    kind: "role_change",
    title: role === "admin" ? "You are now an admin" : "Your admin access was removed",
    body: role === "admin" ? "New admin sections are available in your menu" : "",
    section: "overview",
  });
  return NextResponse.json({ status: "success", role });
}
