import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("note_jwt_token")?.value;

  const pathName = request.nextUrl.pathname;

  if (pathName.startsWith("/login")) {
    if (token) {
      return NextResponse.redirect(new URL(`/`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*", "/"],
};
