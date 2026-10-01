import { cookies } from "next/headers";
import { findMemberByEmail, Member } from "@/lib/db";
import { parseSessionString, createSessionCookie, SessionPayload } from "@/lib/sessionToken";

export type Session = SessionPayload;
export { createSessionCookie };

export function getSession(): Session {
  const raw = cookies().get("session")?.value;
  return parseSessionString(raw);
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

export function getRecipient(): { type: "member" | "citizen"; email: string } | null {
  const session = getSession();
  if (!session) return null;
  return { type: session.type, email: session.email };
}
