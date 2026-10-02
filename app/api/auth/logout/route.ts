import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteCitizenDeviceToken } from "@/lib/db";

export async function POST() {
  const rawToken = (await cookies()).get("citizen_device")?.value;
  if (rawToken) {
    await deleteCitizenDeviceToken(rawToken).catch(() => {});
  }
  const response = NextResponse.json({ status: "success" });
  response.cookies.delete("session");
  response.cookies.delete("citizen_device");
  return response;
}
