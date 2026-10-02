import { NextResponse } from "next/server";
import { deleteAnnouncement } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const admin = await getCurrentMember();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }
  await deleteAnnouncement(params.id);
  return NextResponse.json({ status: "success" });
}
