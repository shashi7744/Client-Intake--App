import { NextResponse } from "next/server";
import { getMembers, getClients } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

// Admin-only: list every member with a computed count of clients they've
// registered. Admin is just a role on a Member record now (role === "admin"),
// not a separate account.
export async function GET() {
  const member = await getCurrentMember();
  if (!member || member.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const members = await getMembers();
  const clients = await getClients();

  const enriched = members
    .map((m) => ({
      email: m.email,
      phone: m.phone || null,
      isPaid: m.isPaid,
      role: m.role,
      memberSince: m.memberSince || null,
      createdAt: m.createdAt,
      clientCount: clients.filter((c) => c.submittedBy === m.email).length,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ status: "success", members: enriched });
}
