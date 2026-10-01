import { NextResponse } from "next/server";
import { respondToAccessRequest } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json().catch(() => ({}));
  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  }

  const updated = await respondToAccessRequest(
    params.id,
    member.email,
    action === "approve",
    member.role === "admin"
  );
  if (!updated) {
    return NextResponse.json(
      { status: "error", message: "Request not found or not yours to respond to" },
      { status: 404 }
    );
  }

  await notifyUser("member", updated.requesterEmail, {
    kind: "access_response",
    title: action === "approve" ? "Phone number request approved" : "Phone number request denied",
    body: `Your request for ${updated.clientName}'s number was ${action === "approve" ? "approved" : "denied"}`,
    section: "all-clients",
  });

  return NextResponse.json({ status: "success", request: updated });
}
