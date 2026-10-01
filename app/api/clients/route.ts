import { NextResponse } from "next/server";
import { clientSchema } from "@/lib/schema";
import { getClients, saveClient, getAccessRequests, getMembers, hasClientProfile } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { buildClientRecord } from "@/lib/clientBuilder";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }
  const isAdmin = member.role === "admin";

  const clients = await getClients();

  // District / taluka heads: attach the submitter's head role to their own
  // profile record so the UI can show a badge and list them first.
  const headByEmail = new Map(
    (await getMembers())
      .filter((m) => m.headLevel && m.headDistrict)
      .map((m) => [
        m.email.toLowerCase(),
        { level: m.headLevel!, district: m.headDistrict!, taluka: m.headTaluka ?? null },
      ])
  );

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
    const head = c.isProfile ? headByEmail.get(c.submittedBy.toLowerCase()) ?? null : null;
    return { ...c, contact: canSeeContact ? c.contact : null, contactAccess: canSeeContact, head };
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

  // A member's first record is their own profile (see CompleteProfileForm).
  const record = buildClientRecord(parsed.data, member.email, !(await hasClientProfile(member.email)));

  await saveClient(record);

  return NextResponse.json({ status: "success" });
}
