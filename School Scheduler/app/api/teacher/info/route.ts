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
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ message: "Нямате права за достъп" }, { status: 403 })
    }

    // Get teacher record with schedule count
    const teachers = await sql`
      SELECT 
        t.*,
        COUNT(s.id) as total_weekly_hours
      FROM teachers t
      LEFT JOIN schedules s ON t.id = s.teacher_id
      WHERE t.user_id = ${user.id}
      GROUP BY t.id
      LIMIT 1
    `

    if (teachers.length === 0) {
      return NextResponse.json({ message: "Учителският профил не е намерен" }, { status: 404 })
    }

    const teacher = teachers[0]

    const teacherInfo = {
      id: teacher.id,
      name: user.name,
      email: user.email,
      maxHoursPerWeek: teacher.max_hours_per_week,
      totalWeeklyHours: teacher.total_weekly_hours || 0,
    }

    return NextResponse.json({ teacher: teacherInfo })
  } catch (error) {
    console.error("Error fetching teacher info:", error)
    return NextResponse.json({ message: "Възникна грешка при зареждането на информацията" }, { status: 500 })
  }
}
