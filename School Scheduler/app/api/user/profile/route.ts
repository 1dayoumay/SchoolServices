import { type NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session-id")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Не сте влезли в системата" }, { status: 401 })
    }

    const user = await getSessionUser(sessionId)
    if (!user) {
      return NextResponse.json({ message: "Невалидна сесия" }, { status: 401 })
    }

    let school = null

    // Get school data based on user role
    if (user.role === "principal") {
      const schools = await sql`
        SELECT * FROM schools WHERE principal_id = ${user.id}
      `
      school = schools[0] || null
    } else if (user.role === "teacher") {
      // Get school through teacher record
      const teacherSchools = await sql`
        SELECT s.* FROM schools s
        JOIN teachers t ON s.id = t.school_id
        WHERE t.user_id = ${user.id}
      `
      school = teacherSchools[0] || null
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      school,
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json({ message: "Възникна грешка при зареждането на профила" }, { status: 500 })
  }
}
