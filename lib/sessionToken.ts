import crypto from "crypto";

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length > 0) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PRIVATE_KEY.trim().length > 0) {
    return process.env.VAPID_PRIVATE_KEY;
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return crypto.createHash("sha256").update(`client-intake:${process.env.DATABASE_URL}`).digest("hex");
  }
  return "client-intake-session-salt-fallback-secret-2026";
}

function sign(payload: string): string {
  const secret = getSessionSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
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
  if (!raw) return null;

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
