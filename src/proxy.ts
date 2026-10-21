import { NextResponse, type NextRequest } from "next/server";
import { databaseUrl } from "./lib/database-url.mjs";

// Until a database is connected, serve the setup instructions for every page
// instead of rendering pages that would fail.
export function proxy(request: NextRequest) {
  const configured = Boolean(databaseUrl());
  const onSetup = request.nextUrl.pathname === "/setup";
  if (!configured && !onSetup) return NextResponse.rewrite(new URL("/setup", request.url));
  if (configured && onSetup) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  // Skip Next.js assets and files in /public.
  matcher: ["/((?!_next/|art/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)"],
};
