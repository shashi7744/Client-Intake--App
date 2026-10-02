import crypto from "crypto";

// No hard-coded default: a default committed to the repo would let anyone
// sign their own session cookies. Without a secret, logins fail closed.
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.VAPID_PRIVATE_KEY || "";

function sign(payload: string): string {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET (or VAPID_PRIVATE_KEY) must be set to sign session cookies");
  }
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export type SessionType = "member" | "citizen";

export type SessionPayload =
  | { type: "member"; email: string }
  | { type: "citizen"; email: string }
  | null;

export function createSessionCookie(type: SessionType, email: string): string {
  const payload = `${type}:${email.toLowerCase().trim()}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSessionString(raw: string | undefined | null): SessionPayload {
  if (!raw || !SESSION_SECRET) return null;

  // Only signed cookies are accepted - an unsigned "member:<email>" cookie
  // could be forged by anyone.
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  const expected = sign(payload);

  try {
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }

  if (payload.startsWith("member:")) {
    return { type: "member", email: payload.slice("member:".length) };
  }
  if (payload.startsWith("citizen:")) {
    return { type: "citizen", email: payload.slice("citizen:".length) };
  }
  return null;
}
