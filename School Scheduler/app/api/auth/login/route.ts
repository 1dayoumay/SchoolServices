import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword, createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Имейл и парола са задължителни" }, { status: 400 })
    }

    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ message: "Невалиден имейл или парола" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ message: "Невалиден имейл или парола" }, { status: 401 })
    }

    // Create session
    const sessionId = await createSession(user.id)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session-id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      message: "Успешно влизане",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      role: user.role,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Възникна грешка при влизането" }, { status: 500 })
  }
}
