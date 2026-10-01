import { NextResponse } from "next/server";
import { updateComplaintStatus, ComplaintStatus } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { notifyUser } from "@/lib/notify";

const VALID_STATUSES: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const member = await getCurrentMember();
  if (!member || member.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { status: "error", message: "Invalid status value" },
      { status: 400 }
    );
  }

  const updated = await updateComplaintStatus(params.id, status);
  if (!updated) {
    return NextResponse.json(
      { status: "error", message: "Complaint not found" },
      { status: 404 }
    );
  }

  await notifyUser("citizen", updated.contact, {
    kind: "complaint_status",
    title: `Your complaint is now ${updated.status}`,
    body: updated.description.slice(0, 100),
    section: "mine",
  });

  return NextResponse.json({ status: "success", complaint: updated });
}
