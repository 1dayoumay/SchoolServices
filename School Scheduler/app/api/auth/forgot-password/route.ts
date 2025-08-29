import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserByEmail } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Имейл адресът е задължителен" }, { status: 400 })
    }

    // Check if user exists
    const user = await getUserByEmail(email)

    // Always return success message for security reasons (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: "Ако този имейл адрес съществува в системата, ще получите инструкции за възстановяване на паролата.",
      })
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
      ON CONFLICT (user_id) DO UPDATE SET
        token = ${resetToken},
        expires_at = ${expiresAt},
        used = FALSE,
        created_at = CURRENT_TIMESTAMP
    `

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, integrate with email service)
    console.log(`Password reset link for ${email}: /auth/reset-password?token=${resetToken}`)

    return NextResponse.json({
      message: "Ако този имейл адрес съществува в системата, ще получите инструкции за възстановяване на паролата.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "Възникна грешка при обработката на заявката" }, { status: 500 })
  }
}
