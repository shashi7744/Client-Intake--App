import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: "success" });
  response.cookies.delete("session");
  return response;
}
