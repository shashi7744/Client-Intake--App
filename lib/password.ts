import crypto from "crypto";
import { promisify } from "util";

// Member passwords are stored as salted scrypt hashes:
//   scrypt$<salt hex>$<hash hex>
// Older accounts were stored as plain text; verifyPassword still accepts those
// and tells the caller to re-save the password hashed.

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LEN = 64;
const PREFIX = "scrypt$";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LEN);
  return `${PREFIX}${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (isHashed(stored)) {
    const [, saltHex, hashHex] = stored.split("$");
    if (!saltHex || !hashHex) return { ok: false, needsRehash: false };
    const expected = Buffer.from(hashHex, "hex");
    const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
    return { ok: crypto.timingSafeEqual(actual, expected), needsRehash: false };
  }
  // Legacy plain-text password.
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { ok, needsRehash: ok };
}
