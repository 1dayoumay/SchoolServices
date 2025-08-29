import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/role-select",
    "/auth/login",
    "/auth/forgot-password",
    "/api/auth/login",
    "/api/auth/signup/principal",
    "/api/auth/signup/teacher",
    "/api/auth/check",
  ]
  const signupRoutes = ["/auth/signup/principal", "/auth/signup/teacher", "/auth/signup/student"]

  if (publicRoutes.includes(pathname) || signupRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Get session from cookie
  const sessionId = request.cookies.get("session-id")?.value

  if (!sessionId) {
    return NextResponse.redirect(new URL("/auth/role-select", request.url))
  }

  // For protected routes, we'll verify the session in the API route
  // The middleware just checks if a session cookie exists
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
