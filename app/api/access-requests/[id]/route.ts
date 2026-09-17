import { NextResponse } from "next/server";
import { respondToAccessRequest } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const member = await getCurrentMember();
  if (!member || (!member.isPaid && member.role !== "admin")) {
    return NextResponse.json({ status: "error", message: "Membership required" }, { status: 403 });
  }

  const { action } = await req.json().catch(() => ({}));
  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  }

  const updated = await respondToAccessRequest(params.id, member.email, action === "approve");
  if (!updated) {
    return NextResponse.json(
      { status: "error", message: "Request not found or not yours to respond to" },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "success", request: updated });
}
