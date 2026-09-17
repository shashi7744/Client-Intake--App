import { cookies } from "next/headers";
import { findMemberByEmail, Member } from "@/lib/db";

// Session cookie format: "member:<email>" or "citizen:<email>"
// There is no separate admin session type - admin is just a role on a
// Member record (member.role === "admin"), checked via getCurrentMember().

export type Session =
  | { type: "member"; email: string }
  | { type: "citizen"; email: string }
  | null;

export function getSession(): Session {
  const raw = cookies().get("session")?.value;
  if (!raw) return null;

  if (raw.startsWith("member:")) {
    return { type: "member", email: raw.slice("member:".length) };
  }
  if (raw.startsWith("citizen:")) {
    return { type: "citizen", email: raw.slice("citizen:".length) };
  }
  return null;
}

export async function getCurrentMember(): Promise<Member | null> {
  const session = getSession();
  if (!session || session.type !== "member") return null;
  return (await findMemberByEmail(session.email)) || null;
}

export function getCurrentCitizenEmail(): string | null {
  const session = getSession();
  if (!session || session.type !== "citizen") return null;
  return session.email;
}

export function isAdmin(member: Member | null): boolean {
  return member?.role === "admin";
}
