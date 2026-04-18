import { NextRequest, NextResponse } from "next/server";
import { LOGIN_PATH, REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (!token && pathname !== LOGIN_PATH) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
