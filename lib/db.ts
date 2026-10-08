import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";

// Real database via Neon (serverless Postgres). Every function here is now
// async - see lib/schema.sql for the table definitions and
// scripts/migrate.js to create them in your own Neon project.
//
// Member passwords are stored hashed (see lib/password.ts).

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
  headLevel?: "district" | "taluka";
  headDistrict?: string;
  headTaluka?: string;
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
    headLevel: row.head_level || undefined,
    headDistrict: row.head_district || undefined,
    headTaluka: row.head_taluka || undefined,
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

// `member.password` is the plain password; it is hashed before storing.
export async function createMember(member: Member): Promise<void> {
  const sql = getSql();
  const hashed = await hashPassword(member.password);
  await sql`
    INSERT INTO members (email, password, phone, is_paid, role, member_since, created_at)
    VALUES (
      ${member.email}, ${hashed}, ${member.phone || null},
      TRUE, ${member.role || "member"},
      now(), ${member.createdAt}
    )
  `;
}

export async function setMemberPassword(email: string, password: string): Promise<void> {
  const sql = getSql();
  const hashed = await hashPassword(password);
  await sql`UPDATE members SET password = ${hashed} WHERE lower(email) = lower(${email})`;
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

export async function setMemberHead(
  email: string,
  level: "district" | "taluka" | null,
  district: string | null,
  taluka: string | null
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE members
    SET head_level = ${level}, head_district = ${level ? district : null}, head_taluka = ${level === "taluka" ? taluka : null}
    WHERE lower(email) = lower(${email})
  `;
}

// ---------- Citizens (email OTP only, no account setup, used to file complaints) ----------

export type Citizen = {
  email: string;
  name?: string;
  phone?: string;
  createdAt: string;
};

export async function findCitizenByEmail(email: string): Promise<Citizen | undefined> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM citizens WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (!rows[0]) return undefined;
  return {
    email: rows[0].email,
    name: rows[0].name || undefined,
    phone: rows[0].phone || undefined,
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
    phone: rows[0].phone || undefined,
    createdAt: new Date(rows[0].created_at).toISOString(),
  };
}

export async function setCitizenPhone(email: string, phone: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE citizens SET phone = ${phone} WHERE lower(email) = lower(${email})`;
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
  return crypto.randomInt(100000, 1000000).toString();
}

// True if a code was sent to this email within the last `seconds` (resend cooldown).
export async function otpSentRecently(email: string, seconds: number): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT 1 FROM email_otps
    WHERE lower(email) = lower(${email}) AND created_at > now() - make_interval(secs => ${seconds})
    LIMIT 1
  `;
  return rows.length > 0;
}

// Wrong guesses allowed per code before it is thrown away.
const MAX_OTP_ATTEMPTS = 5;

export async function createEmailOtp(email: string, otp: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO email_otps (email, otp, expires_at, created_at, attempts)
    VALUES (${email.toLowerCase()}, ${otp}, now() + interval '5 minutes', now(), 0)
    ON CONFLICT (email) DO UPDATE
      SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, created_at = now(), attempts = 0
  `;
}

export async function verifyEmailOtp(email: string, otp: string): Promise<boolean> {
  const sql = getSql();
  const normalized = email.toLowerCase();
  // Count this attempt first, then check - so parallel guesses can't exceed
  // the limit.
  const rows = await sql`
    UPDATE email_otps SET attempts = attempts + 1
    WHERE lower(email) = ${normalized} AND expires_at > now()
    RETURNING otp, attempts
  `;
  if (rows.length === 0) return false;
  const { otp: expected, attempts } = rows[0] as { otp: string; attempts: number };
  if (attempts > MAX_OTP_ATTEMPTS) {
    await sql`DELETE FROM email_otps WHERE lower(email) = ${normalized}`;
    return false;
  }
  if (String(otp) !== expected) return false;
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
  isProfile?: boolean; // true = this is the member's own profile record
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
    isProfile: !!row.is_profile,
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
      state, district, taluka, city, ward, submitted_by, submitted_at, is_profile
    ) VALUES (
      ${client.id}, ${client.name}, ${client.gender}, ${client.dob}, ${client.age},
      ${client.contact}, ${client.reference || null}, ${client.post}, ${client.address},
      ${client.state}, ${client.district}, ${client.taluka},
      ${client.city}, ${client.ward}, ${client.submittedBy}, ${client.submittedAt}, ${client.isProfile ?? false}
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
  phone?: string; // citizen's mobile number, for admin to WhatsApp / call
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
    phone: row.phone || undefined,
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
      contact, phone, status, submitted_at
    ) VALUES (
      ${complaint.id}, ${complaint.category}, ${complaint.description}, ${complaint.photo || null},
      ${complaint.state}, ${complaint.district}, ${complaint.taluka}, ${complaint.city},
      ${complaint.ward}, ${complaint.contact}, ${complaint.phone || null}, ${complaint.status}, ${complaint.submittedAt}
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


// ---------- Profile check ----------
export async function hasClientProfile(email: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`SELECT 1 FROM clients WHERE lower(submitted_by) = lower(${email}) LIMIT 1`;
  return rows.length > 0;
}

export async function countAdmins(): Promise<number> {
  const sql = getSql();
  const rows = await sql`SELECT count(*)::int AS n FROM members WHERE role = 'admin'`;
  return rows[0].n;
}

// ---------- Citizen "remember this device" tokens ----------
// Only a SHA-256 hash of a random token is stored; the raw token lives in an
// httpOnly cookie. Identity is never taken from client-supplied data.
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createCitizenDeviceToken(email: string): Promise<string> {
  const sql = getSql();
  const raw = crypto.randomBytes(32).toString("hex");
  await sql`
    INSERT INTO citizen_devices (token_hash, citizen_email)
    VALUES (${hashToken(raw)}, ${email.toLowerCase()})
  `;
  return raw;
}

export async function verifyCitizenDeviceToken(raw: string): Promise<Citizen | undefined> {
  if (!raw) return undefined;
  const sql = getSql();
  const rows = await sql`
    SELECT c.* FROM citizen_devices d
    JOIN citizens c ON c.email = d.citizen_email
    WHERE d.token_hash = ${hashToken(raw)} LIMIT 1
  `;
  if (!rows[0]) return undefined;
  return {
    email: rows[0].email,
    name: rows[0].name || undefined,
    phone: rows[0].phone || undefined,
    createdAt: new Date(rows[0].created_at).toISOString(),
  };
}

export async function deleteCitizenDeviceToken(raw: string): Promise<void> {
  if (!raw) return;
  const sql = getSql();
  await sql`DELETE FROM citizen_devices WHERE token_hash = ${hashToken(raw)}`;
}

// Same idea for members: issued on password login / registration.
export async function createMemberDeviceToken(email: string): Promise<string> {
  const sql = getSql();
  const raw = crypto.randomBytes(32).toString("hex");
  await sql`
    INSERT INTO member_devices (token_hash, member_email)
    VALUES (${hashToken(raw)}, ${email.toLowerCase()})
  `;
  return raw;
}

export async function verifyMemberDeviceToken(raw: string): Promise<Member | undefined> {
  if (!raw) return undefined;
  const sql = getSql();
  const rows = await sql`
    SELECT m.* FROM member_devices d
    JOIN members m ON m.email = d.member_email
    WHERE d.token_hash = ${hashToken(raw)} LIMIT 1
  `;
  return rows[0] ? rowToMember(rows[0]) : undefined;
}

export async function deleteMemberDeviceToken(raw: string): Promise<void> {
  if (!raw) return;
  const sql = getSql();
  await sql`DELETE FROM member_devices WHERE token_hash = ${hashToken(raw)}`;
}

// After a password reset, every remembered device must log in again.
export async function deleteAllMemberDevices(email: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM member_devices WHERE lower(member_email) = lower(${email})`;
}

// ---------- Announcements (posted by admins, shown to all members) ----------
export type Announcement = {
  id: string;
  title: string;
  description: string;
  link?: string;
  photo?: string;
  createdBy: string;
  createdAt: string;
};

function rowToAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    link: row.link || undefined,
    photo: row.photo || undefined,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM announcements ORDER BY created_at DESC`;
  return rows.map(rowToAnnouncement);
}

export async function createAnnouncement(a: {
  title: string;
  description: string;
  link?: string;
  photo?: string;
  createdBy: string;
}): Promise<Announcement> {
  const sql = getSql();
  const id = "ann-" + Math.random().toString(36).slice(2, 10);
  const rows = await sql`
    INSERT INTO announcements (id, title, description, link, photo, created_by)
    VALUES (${id}, ${a.title}, ${a.description}, ${a.link || null}, ${a.photo || null}, ${a.createdBy})
    RETURNING *
  `;
  return rowToAnnouncement(rows[0]);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM announcements WHERE id = ${id}`;
}


// ---------- Notifications (in-app bell + web push) ----------
export type RecipientType = "member" | "citizen";

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  section?: string;
  createdAt: string;
  read: boolean;
};

export type NotificationPayload = {
  kind: string;
  title: string;
  body?: string;
  section?: string;
};

function rowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body || "",
    section: row.section || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    read: !!row.read_at,
  };
}

function newNotificationId(): string {
  return "ntf-" + crypto.randomBytes(8).toString("hex");
}

export async function insertNotification(
  type: RecipientType,
  email: string,
  p: NotificationPayload
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO notifications (id, recipient_type, recipient_email, kind, title, body, section)
    VALUES (${newNotificationId()}, ${type}, ${email.toLowerCase()}, ${p.kind}, ${p.title}, ${p.body || ""}, ${p.section || null})
  `;
}

// Inserts one notification per member (all members, or just admins).
// Returns the emails that were notified so push can be sent to them.
export async function insertMemberNotifications(
  audience: "all" | "admins",
  exceptEmail: string | null,
  p: NotificationPayload
): Promise<string[]> {
  const sql = getSql();
  const adminsOnly = audience === "admins";
  const except = (exceptEmail || "").toLowerCase();
  const rows = await sql`
    INSERT INTO notifications (id, recipient_type, recipient_email, kind, title, body, section)
    SELECT 'ntf-' || md5(random()::text || email || clock_timestamp()::text),
           'member', lower(email), ${p.kind}, ${p.title}, ${p.body || ""}, ${p.section || null}
    FROM members
    WHERE (${adminsOnly}::boolean = FALSE OR role = 'admin')
      AND lower(email) <> ${except}
    RETURNING recipient_email
  `;
  return rows.map((r: any) => r.recipient_email as string);
}

export async function getNotifications(
  type: RecipientType,
  email: string,
  limit = 30
): Promise<{ notifications: AppNotification[]; unread: number }> {
  const sql = getSql();
  const e = email.toLowerCase();
  const rows = await sql`
    SELECT * FROM notifications
    WHERE recipient_type = ${type} AND recipient_email = ${e}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  const c = await sql`
    SELECT count(*)::int AS n FROM notifications
    WHERE recipient_type = ${type} AND recipient_email = ${e} AND read_at IS NULL
  `;
  return { notifications: rows.map(rowToNotification), unread: c[0].n };
}

export async function markNotificationsRead(
  type: RecipientType,
  email: string,
  id: string | null
): Promise<void> {
  const sql = getSql();
  const e = email.toLowerCase();
  if (id) {
    await sql`
      UPDATE notifications SET read_at = now()
      WHERE id = ${id} AND recipient_type = ${type} AND recipient_email = ${e} AND read_at IS NULL
    `;
  } else {
    await sql`
      UPDATE notifications SET read_at = now()
      WHERE recipient_type = ${type} AND recipient_email = ${e} AND read_at IS NULL
    `;
  }
}

// ---------- Push subscriptions ----------
export type PushSub = { endpoint: string; p256dh: string; auth: string };

export async function savePushSubscription(
  type: RecipientType,
  email: string,
  sub: PushSub
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO push_subscriptions (endpoint, recipient_type, recipient_email, p256dh, auth)
    VALUES (${sub.endpoint}, ${type}, ${email.toLowerCase()}, ${sub.p256dh}, ${sub.auth})
    ON CONFLICT (endpoint) DO UPDATE SET
      recipient_type = EXCLUDED.recipient_type,
      recipient_email = EXCLUDED.recipient_email,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth
  `;
}

export async function deletePushSubscription(
  endpoint: string,
  email?: string,
  type?: RecipientType
): Promise<void> {
  const sql = getSql();
  if (email && type) {
    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint} AND recipient_type = ${type} AND recipient_email = ${email.toLowerCase()}
    `;
  } else {
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
  }
}

export async function getPushSubscriptions(
  type: RecipientType,
  emails: string[]
): Promise<PushSub[]> {
  if (emails.length === 0) return [];
  const sql = getSql();
  const lowered = emails.map((e) => e.toLowerCase());
  const rows = await sql`
    SELECT endpoint, p256dh, auth FROM push_subscriptions
    WHERE recipient_type = ${type} AND recipient_email = ANY(${lowered})
  `;
  return rows.map((r: any) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
}
