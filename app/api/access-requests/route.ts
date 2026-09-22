import { NextResponse } from "next/server";
import { getClients, getAccessRequests, requestClientAccess } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

// POST { clientId } - a member requests to see a client's phone number.
// Auto-approved instantly if the requester is the client's own owner.
export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await req.json().catch(() => ({}));
  const client = (await getClients()).find((c) => c.id === clientId);
  if (!client) {
    return NextResponse.json({ status: "error", message: "Client not found" }, { status: 404 });
  }

  // Owners always have access to their own clients - no approval needed.
  if (client.submittedBy.toLowerCase() === member.email.toLowerCase() || member.role === "admin") {
    return NextResponse.json({ status: "approved", ownRecord: true });
  }

  const request = await requestClientAccess(client, member.email);
  return NextResponse.json({ status: request.status, request });
}

// GET - returns the current member's incoming requests and outgoing requests,
// and if admin, returns all requests in the system.
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const all = await getAccessRequests();
  const incoming = all.filter((r) => r.ownerEmail.toLowerCase() === member.email.toLowerCase());
  const outgoing = all.filter((r) => r.requesterEmail.toLowerCase() === member.email.toLowerCase());

  return NextResponse.json({
    status: "success",
    incoming,
    outgoing,
    allRequests: member.role === "admin" ? all : undefined,
  });
}
