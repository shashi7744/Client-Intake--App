import { neon } from "@neondatabase/serverless";

// Real database via Neon (serverless Postgres). Every function here is now
// async - see lib/schema.sql for the table definitions and
// scripts/migrate.js to create them in your own Neon project.
//
// TODO: hash member passwords with bcrypt before going live - they're
// stored as plain text right now, same as the mock version this replaced.

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local - see .env.local.example."
    );
  }
  return neon(process.env.DATABASE_URL);
}

// ---------- Members (email + password login, can pay for full access) ----------

export type MemberRole = "member" | "admin";

export type Member = {
  email: string;
  password: string;
  phone?: string;
  isPaid: boolean;
  role: MemberRole;
  memberSince?: string;
  createdAt: string;
};

function rowToMember(row: any): Member {
  return {
    email: row.email,
    password: row.password,
    phone: row.phone || undefined,
    isPaid: row.is_paid,
    role: row.role,
    memberSince: row.member_since ? new Date(row.member_since).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getMembers(): Promise<Member[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM members ORDER BY created_at DESC`;
  return rows.map(rowToMember);
}

export async function findMemberByEmail(email: string): Promise<Member | undefined> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM members WHERE lower(email) = lower(${email}) LIMIT 1`;
  return rows[0] ? rowToMember(rows[0]) : undefined;
}

export async function createMember(member: Member): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO members (email, password, phone, is_paid, role, member_since, created_at)
    VALUES (
      ${member.email}, ${member.password}, ${member.phone || null},
      TRUE, ${member.role || "member"},
      now(), ${member.createdAt}
    )
  `;
}

export async function setMemberPaid(email: string, isPaid: boolean): Promise<void> {
  const sql = getSql();
  if (isPaid) {
    await sql`
      UPDATE members SET is_paid = TRUE, member_since = now()
      WHERE lower(email) = lower(${email})
    `;
  } else {
    await sql`UPDATE members SET is_paid = FALSE WHERE lower(email) = lower(${email})`;
  }
}

export async function setMemberRole(email: string, role: MemberRole): Promise<Member | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE members SET role = ${role} WHERE lower(email) = lower(${email})
    RETURNING *
  `;
  return rows[0] ? rowToMember(rows[0]) : null;
}

// ---------- Citizens (email OTP only, no account setup, used to file complaints) ----------

export type Citizen = {
  email: string;
  name?: string;
  createdAt: string;
};

export async function findCitizenByEmail(email: string): Promise<Citizen | undefined> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM citizens WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (!rows[0]) return undefined;
  return {
    email: rows[0].email,
    name: rows[0].name || undefined,
    createdAt: new Date(rows[0].created_at).toISOString(),
  };
}

export async function findOrCreateCitizen(email: string): Promise<Citizen> {
  const sql = getSql();
  const normalized = email.toLowerCase();
  const rows = await sql`
    INSERT INTO citizens (email, created_at)
    VALUES (${normalized}, now())
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING *
  `;
  return {
    email: rows[0].email,
    name: rows[0].name || undefined,
    createdAt: new Date(rows[0].created_at).toISOString(),
  };
}

export async function setCitizenName(email: string, name: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE citizens SET name = ${name} WHERE lower(email) = lower(${email})`;
}

// ---------- Email OTPs ----------
// Resend (or any email API) only sends messages - it doesn't generate or
// verify codes like MSG91 did. So we handle that ourselves here: generate a
// 6-digit code, store it with a 5-minute expiry, and check it at verify time.

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createEmailOtp(email: string, otp: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO email_otps (email, otp, expires_at, created_at)
    VALUES (${email.toLowerCase()}, ${otp}, now() + interval '5 minutes', now())
    ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = now()
  `;
}

export async function verifyEmailOtp(email: string, otp: string): Promise<boolean> {
  const sql = getSql();
  const normalized = email.toLowerCase();
  const rows = await sql`
    SELECT 1 FROM email_otps
    WHERE lower(email) = ${normalized} AND otp = ${otp} AND expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return false;
  await sql`DELETE FROM email_otps WHERE lower(email) = ${normalized}`;
  return true;
}

// ---------- Client records (created by paid members) ----------

export type ClientRecord = {
  id: string;
  name: string;
  gender: string;
  dob: string; // YYYY-MM-DD
  age: number;
  contact: string;
  reference?: string;
  post: string;
  address: string;
  state: string;
  district: string;
  taluka: string;
  city: string;
  ward: string;
  submittedBy: string; // member email
  submittedAt: string;
};

function rowToClient(row: any): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    dob: row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : row.dob,
    age: row.age,
    contact: row.contact,
    reference: row.reference || undefined,
    post: row.post,
    address: row.address,
    state: row.state,
    district: row.district,
    taluka: row.taluka,
    city: row.city,
    ward: row.ward,
    submittedBy: row.submitted_by,
    submittedAt: new Date(row.submitted_at).toISOString(),
  };
}

export async function getClients(): Promise<ClientRecord[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM clients ORDER BY submitted_at DESC`;
  return rows.map(rowToClient);
}

export async function saveClient(client: ClientRecord): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO clients (
      id, name, gender, dob, age, contact, reference, post, address,
      state, district, taluka, city, ward, submitted_by, submitted_at
    ) VALUES (
      ${client.id}, ${client.name}, ${client.gender}, ${client.dob}, ${client.age},
      ${client.contact}, ${client.reference || null}, ${client.post}, ${client.address},
      ${client.state}, ${client.district}, ${client.taluka},
      ${client.city}, ${client.ward}, ${client.submittedBy}, ${client.submittedAt}
    )
  `;
}

// ---------- Complaints (filed by citizens, managed by paid members) ----------

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";

export type Complaint = {
  id: string;
  category: string;
  description: string;
  photo?: string; // data URL of an optional photo attached to the complaint
  state: string;
  district: string;
  taluka: string;
  city: string;
  ward: string;
  contact: string; // citizen's email address
  citizenName?: string; // looked up from citizens table, if they've set one
  status: ComplaintStatus;
  submittedAt: string;
  updatedAt?: string;
};

function rowToComplaint(row: any): Complaint {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    photo: row.photo || undefined,
    state: row.state,
    district: row.district,
    taluka: row.taluka,
    city: row.city,
    ward: row.ward,
    contact: row.contact,
    citizenName: row.citizen_name || undefined,
    status: row.status,
    submittedAt: new Date(row.submitted_at).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function getComplaints(): Promise<Complaint[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT complaints.*, citizens.name AS citizen_name
    FROM complaints
    LEFT JOIN citizens ON citizens.email = complaints.contact
    ORDER BY complaints.submitted_at DESC
  `;
  return rows.map(rowToComplaint);
}

export async function saveComplaint(complaint: Complaint): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO complaints (
      id, category, description, photo, state, district, taluka, city, ward,
      contact, status, submitted_at
    ) VALUES (
      ${complaint.id}, ${complaint.category}, ${complaint.description}, ${complaint.photo || null},
      ${complaint.state}, ${complaint.district}, ${complaint.taluka}, ${complaint.city},
      ${complaint.ward}, ${complaint.contact}, ${complaint.status}, ${complaint.submittedAt}
    )
  `;
}

export async function getComplaintsByEmail(email: string): Promise<Complaint[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT complaints.*, citizens.name AS citizen_name
    FROM complaints
    LEFT JOIN citizens ON citizens.email = complaints.contact
    WHERE lower(complaints.contact) = lower(${email})
    ORDER BY complaints.submitted_at DESC
  `;
  return rows.map(rowToComplaint);
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<Complaint | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE complaints SET status = ${status}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? rowToComplaint(rows[0]) : null;
}

// ---------- Phone-number access requests ----------
// A client's phone number is hidden by default in the "All Clients" list.
// A member has to request access; the member who originally registered that
// client (the "owner") gets notified and can approve or deny. Owners always
// have access to their own clients' numbers (see canSeeClientContact below).

export type AccessRequestStatus = "pending" | "approved" | "denied";

export type AccessRequest = {
  id: string;
  clientId: string;
  clientName: string; // denormalized for easy display in notifications
  requesterEmail: string;
  ownerEmail: string;
  status: AccessRequestStatus;
  createdAt: string;
  respondedAt?: string;
};

function rowToAccessRequest(row: any): AccessRequest {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    requesterEmail: row.requester_email,
    ownerEmail: row.owner_email,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    respondedAt: row.responded_at ? new Date(row.responded_at).toISOString() : undefined,
  };
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM access_requests ORDER BY created_at DESC`;
  return rows.map(rowToAccessRequest);
}

export async function findAccessRequest(
  clientId: string,
  requesterEmail: string
): Promise<AccessRequest | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM access_requests
    WHERE client_id = ${clientId} AND lower(requester_email) = lower(${requesterEmail})
    LIMIT 1
  `;
  return rows[0] ? rowToAccessRequest(rows[0]) : undefined;
}

// Creates a new pending request, or re-opens an existing denied one so the
// requester can try again. Returns the existing request unchanged if it's
// already pending or approved.
export async function requestClientAccess(
  client: ClientRecord,
  requesterEmail: string
): Promise<AccessRequest> {
  const sql = getSql();
  const existing = await findAccessRequest(client.id, requesterEmail);

  if (existing && existing.status !== "denied") {
    return existing;
  }
  if (existing && existing.status === "denied") {
    const rows = await sql`
      UPDATE access_requests
      SET status = 'pending', created_at = now(), responded_at = NULL
      WHERE id = ${existing.id}
      RETURNING *
    `;
    return rowToAccessRequest(rows[0]);
  }

  const id = "req-" + Math.random().toString(36).slice(2, 10);
  const rows = await sql`
    INSERT INTO access_requests (id, client_id, client_name, requester_email, owner_email, status, created_at)
    VALUES (${id}, ${client.id}, ${client.name}, ${requesterEmail}, ${client.submittedBy}, 'pending', now())
    RETURNING *
  `;
  return rowToAccessRequest(rows[0]);
}

export async function respondToAccessRequest(
  id: string,
  ownerEmail: string,
  approve: boolean,
  isAdmin: boolean = false
): Promise<AccessRequest | null> {
  const sql = getSql();
  const rows = isAdmin
    ? await sql`
        UPDATE access_requests
        SET status = ${approve ? "approved" : "denied"}, responded_at = now()
        WHERE id = ${id}
        RETURNING *
      `
    : await sql`
        UPDATE access_requests
        SET status = ${approve ? "approved" : "denied"}, responded_at = now()
        WHERE id = ${id} AND lower(owner_email) = lower(${ownerEmail})
        RETURNING *
      `;
  return rows[0] ? rowToAccessRequest(rows[0]) : null;
}

// A member can see a client's phone number if they registered that client
// themselves, if they are an admin, or if an access request was approved.
export async function canSeeClientContact(
  client: ClientRecord,
  memberEmail: string
): Promise<boolean> {
  const member = await findMemberByEmail(memberEmail);
  if (member?.role === "admin") return true;
  if (client.submittedBy.toLowerCase() === memberEmail.toLowerCase()) return true;
  const request = await findAccessRequest(client.id, memberEmail);
  return request?.status === "approved";
}
