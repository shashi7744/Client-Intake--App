import crypto from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.VAPID_PRIVATE_KEY ||
  "client-intake-session-salt-default";

export type SessionType = "member" | "citizen";

export type SessionPayload =
  | { type: "member"; email: string }
  | { type: "citizen"; email: string }
  | null;

export function createSessionCookie(type: SessionType, email: string): string {
  const payload = `${type}:${email.toLowerCase().trim()}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export function parseSessionString(raw: string | undefined | null): SessionPayload {
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) {
    // Legacy fallback during migration
    if (raw.startsWith("member:")) {
      return { type: "member", email: raw.slice("member:".length) };
    }
    if (raw.startsWith("citizen:")) {
      return { type: "citizen", email: raw.slice("citizen:".length) };
    }
    return null;
  }

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");

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
