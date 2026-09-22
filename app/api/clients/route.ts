import { NextResponse } from "next/server";
import { clientSchema, calculateAge } from "@/lib/schema";
import { getClients, saveClient, ClientRecord, getAccessRequests } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }
  const isAdmin = member.role === "admin";

  const clients = await getClients();

  // Members only see a client's phone number if they registered it
  // themselves or have been granted access by whoever did. Admins see all.
  // Fetch this member's access requests once instead of querying per client.
  const approvedClientIds = isAdmin
    ? null
    : new Set(
        (await getAccessRequests())
          .filter(
            (r) =>
              r.requesterEmail.toLowerCase() === member.email.toLowerCase() &&
              r.status === "approved"
          )
          .map((r) => r.clientId)
      );

  const withMaskedContact = clients.map((c) => {
    const canSeeContact = isAdmin
      ? true
      : c.submittedBy.toLowerCase() === member.email.toLowerCase() ||
        approvedClientIds!.has(c.id);
    return { ...c, contact: canSeeContact ? c.contact : null, contactAccess: canSeeContact };
  });

  return NextResponse.json({ status: "success", clients: withMaskedContact });
}

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { status: "error", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dob = `${data.dobYear}-${String(data.dobMonth).padStart(2, "0")}-${String(
    data.dobDay
  ).padStart(2, "0")}`;

  const record: ClientRecord = {
    id: "client-" + Math.random().toString(36).slice(2, 10),
    name: data.name,
    gender: data.gender,
    dob,
    age: calculateAge(data.dobDay, data.dobMonth, data.dobYear),
    contact: data.contact,
    reference: data.reference,
    post: data.post,
    address: data.address,
    state: data.state,
    district: data.district,
    taluka: data.taluka,
    city: data.city,
    ward: data.ward,
    submittedBy: member.email,
    submittedAt: new Date().toISOString(),
  };

  await saveClient(record);

  return NextResponse.json({ status: "success" });
}
