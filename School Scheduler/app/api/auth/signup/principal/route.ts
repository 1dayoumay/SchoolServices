import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createUser, createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, schoolName, schoolAddress } = await request.json()

    // Validate input
    if (!name || !email || !password || !schoolName || !schoolAddress) {
      return NextResponse.json({ message: "Всички полета са задължителни" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Паролата трябва да бъде поне 6 символа" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ message: "Потребител с този имейл вече съществува" }, { status: 400 })
    }

    // Create user
    const user = await createUser(email, password, "principal", name)

    // Create school
    const schools = await sql`
      INSERT INTO schools (name, address, principal_id)
      VALUES (${schoolName}, ${schoolAddress}, ${user.id})
      RETURNING *
    `

    const school = schools[0]

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
      message: "Акаунтът е създаден успешно",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      school: {
        id: school.id,
        name: school.name,
        address: school.address,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Възникна грешка при създаването на акаунта" }, { status: 500 })
  }
}
