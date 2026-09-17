import { NextResponse } from "next/server";
import { complaintSchema } from "@/lib/schema";
import { getComplaints, saveComplaint, Complaint } from "@/lib/db";
import { getCurrentMember, getCurrentCitizenEmail } from "@/lib/session";

export async function GET() {
  const member = await getCurrentMember();
  if (!member || member.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const complaints = await getComplaints();
  return NextResponse.json({ status: "success", complaints });
}

export async function POST(req: Request) {
  const email = getCurrentCitizenEmail();
  if (!email) {
    return NextResponse.json(
      { status: "error", message: "Please log in with your email to file a complaint" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = complaintSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { status: "error", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const complaint: Complaint = {
    id: "complaint-" + Math.random().toString(36).slice(2, 10),
    category: data.category,
    description: data.description,
    photo: data.photo || undefined,
    state: data.state,
    district: data.district,
    taluka: data.taluka,
    city: data.city,
    ward: data.ward,
    contact: email,
    status: "Pending",
    submittedAt: new Date().toISOString(),
  };

  await saveComplaint(complaint);

  return NextResponse.json({ status: "success" });
}
