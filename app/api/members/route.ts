import { NextResponse } from "next/server";
import { getMembers, getClients } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

// Admin-only: list every member with all client details they've registered.
export async function GET() {
  const member = await getCurrentMember();
  if (!member || member.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const members = await getMembers();
  const clients = await getClients();

  const enriched = members
    .map((m) => {
      const memberClients = clients.filter(
        (c) => c.submittedBy.toLowerCase() === m.email.toLowerCase()
      );
      return {
        email: m.email,
        phone: m.phone || null,
        role: m.role,
        createdAt: m.createdAt,
        clientCount: memberClients.length,
        clients: memberClients,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ status: "success", members: enriched });
}
