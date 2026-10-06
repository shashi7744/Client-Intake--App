import webpush from "web-push";
import {
  RecipientType,
  NotificationPayload,
  insertNotification,
  insertMemberNotifications,
  getPushSubscriptions,
  deletePushSubscription,
} from "@/lib/db";

// Web push needs a VAPID key pair - generate one with `npm run vapid` and put
// the values in .env.local. Without them, notifications still appear in the
// in-app bell; only the phone pop-ups are skipped.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

export const pushConfigured = !!(PUBLIC_KEY && PRIVATE_KEY);

if (pushConfigured) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY!, PRIVATE_KEY!);
}

async function sendPush(type: RecipientType, emails: string[], p: NotificationPayload) {
  if (!pushConfigured || emails.length === 0) return;
  const subs = await getPushSubscriptions(type, emails);
  const baseUrl = type === "member" ? "/dashboard" : "/citizen";
  const url = p.section ? `${baseUrl}?section=${encodeURIComponent(p.section)}` : baseUrl;
  const payload = JSON.stringify({
    title: p.title,
    body: p.body || "",
    url,
    tag: `${p.kind}-${Date.now()}`,
  });
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err: any) {
        // 404/410 = the phone/browser no longer wants pushes - forget it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await deletePushSubscription(s.endpoint).catch(() => {});
        }
      }
    })
  );
}

// Notifications are best-effort: a failure here must never break the action
// (filing a complaint, changing a status...) that triggered it.
export async function notifyUser(type: RecipientType, email: string, p: NotificationPayload) {
  try {
    await insertNotification(type, email, p);
    await sendPush(type, [email], p);
  } catch (err) {
    console.error("notifyUser failed", err);
  }
}

export async function notifyAdmins(p: NotificationPayload, exceptEmail?: string) {
  try {
    const emails = await insertMemberNotifications("admins", exceptEmail ?? null, p);
    await sendPush("member", emails, p);
  } catch (err) {
    console.error("notifyAdmins failed", err);
  }
}

export async function notifyAllMembers(p: NotificationPayload, exceptEmail?: string) {
  try {
    const emails = await insertMemberNotifications("all", exceptEmail ?? null, p);
    await sendPush("member", emails, p);
  } catch (err) {
    console.error("notifyAllMembers failed", err);
  }
}
