import { NextRequest, NextResponse } from "next/server";

function getSessionType(req: NextRequest): "member" | "citizen" | null {
  const raw = req.cookies.get("session")?.value;
  if (!raw) return null;
  if (raw.startsWith("member:")) return "member";
  if (raw.startsWith("citizen:")) return "citizen";
  return null;
}

export function middleware(req: NextRequest) {
  const sessionType = getSessionType(req);
  const { pathname } = req.nextUrl;

  const isPublicAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Not logged in at all -> only auth pages are reachable
  if (!sessionType && !isPublicAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in -> bounce away from login/register to the right home.
  // Admin is just a role on the member account, so it still lands on
  // /dashboard - the dashboard itself shows extra sections for admins.
  if (sessionType && isPublicAuthPage) {
    const home = sessionType === "member" ? "/dashboard" : "/citizen";
    return NextResponse.redirect(new URL(home, req.url));
  }

  // Members and citizens stay in their own separate areas
  if (sessionType === "citizen" && (pathname.startsWith("/dashboard") || pathname.startsWith("/membership"))) {
    return NextResponse.redirect(new URL("/citizen", req.url));
  }
  if (sessionType === "member" && pathname.startsWith("/citizen")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/clients/:path*",
    "/membership/:path*",
    "/citizen/:path*",
  ],
};
