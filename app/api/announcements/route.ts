import { NextResponse } from "next/server";
import { createAnnouncement, getAnnouncements } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { notifyAllMembers } from "@/lib/notify";

const ALLOWED_LINK_HOSTS = [
  "facebook.com", "fb.com", "fb.watch",
  "instagram.com", "instagr.am",
  "youtube.com", "youtu.be",
];

function isAllowedLink(link: string): boolean {
  try {
    const url = new URL(link);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_LINK_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json({ status: "success", announcements: await getAnnouncements() });
}

export async function POST(req: Request) {
  const admin = await getCurrentMember();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ status: "error", message: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const link = typeof body.link === "string" ? body.link.trim() : "";
  const photo = typeof body.photo === "string" && body.photo.startsWith("data:image/") ? body.photo : undefined;

  if (!title || !description) {
    return NextResponse.json(
      { status: "error", message: "Header and description are required" },
      { status: 400 }
    );
  }
  if (title.length > 150 || description.length > 3000) {
    return NextResponse.json({ status: "error", message: "Text is too long" }, { status: 400 });
  }
  if (link && !isAllowedLink(link)) {
    return NextResponse.json(
      { status: "error", message: "Link must be a Facebook, Instagram or YouTube URL" },
      { status: 400 }
    );
  }

  const announcement = await createAnnouncement({
    title,
    description,
    link: link || undefined,
    photo,
    createdBy: admin.email,
  });
  await notifyAllMembers(
    {
      kind: "announcement",
      title: `New announcement: ${title}`,
      body: description.slice(0, 100),
      section: "overview",
    },
    admin.email
  );
  return NextResponse.json({ status: "success", announcement });
}
