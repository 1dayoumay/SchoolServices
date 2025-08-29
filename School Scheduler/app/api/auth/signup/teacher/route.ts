import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSession, hashPassword } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
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

    // Find teacher record with matching name and email
    const teacherRecords = await sql`
      SELECT t.*, u.name as existing_user_name, u.id as existing_user_id
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id IN (
        SELECT t2.id FROM teachers t2
        JOIN users u2 ON t2.user_id = u2.id
        WHERE LOWER(u2.name) = LOWER(${name}) AND LOWER(u2.email) = LOWER(${email})
      )
    `

    if (teacherRecords.length === 0) {
      return NextResponse.json(
        {
          message: "Не е намерен учителски профил с това име и имейл. Моля свържете се с администрацията на училището.",
        },
        { status: 404 },
      )
    }

    const teacherRecord = teacherRecords[0]

    // Check if the teacher record already has a real user account (not temp_password)
    const existingUserAccount = await sql`
      SELECT * FROM users WHERE id = ${teacherRecord.existing_user_id} AND password_hash != 'temp_password'
    `

    if (existingUserAccount.length > 0) {
      return NextResponse.json(
        { message: "Вече съществува акаунт за този учител. Използвайте страницата за влизане." },
        { status: 400 },
      )
    }

    // Update the existing user record with real password
    const hashedPassword = await hashPassword(password)
    await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teacherRecord.existing_user_id}
    `

    // Get the updated user
    const users = await sql`
      SELECT * FROM users WHERE id = ${teacherRecord.existing_user_id}
    `

    const user = users[0]

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
    })
  } catch (error) {
    console.error("Teacher signup error:", error)
    return NextResponse.json({ message: "Възникна грешка при създаването на акаунта" }, { status: 500 })
  }
}
