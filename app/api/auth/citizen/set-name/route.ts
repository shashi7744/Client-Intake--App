import { NextResponse } from "next/server";
import { setCitizenName } from "@/lib/db";
import { getCurrentCitizenEmail } from "@/lib/session";

export async function POST(req: Request) {
  const email = getCurrentCitizenEmail();
  if (!email) {
    return NextResponse.json({ status: "error", message: "Not logged in" }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ status: "error", message: "Enter your name" }, { status: 400 });
  }

  await setCitizenName(email, name.trim().slice(0, 100));
  return NextResponse.json({ status: "success" });
}
