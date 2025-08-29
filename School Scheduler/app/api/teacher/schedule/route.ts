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

    // Get teacher record
    const teachers = await sql`
      SELECT * FROM teachers WHERE user_id = ${user.id} LIMIT 1
    `

    if (teachers.length === 0) {
      return NextResponse.json({ message: "Учителският профил не е намерен" }, { status: 404 })
    }

    const teacher = teachers[0]

    // Get teacher's schedule
    const schedules = await sql`
      SELECT 
        s.*,
        sub.name as subject_name,
        c.name as class_name
      FROM schedules s
      JOIN subjects sub ON s.subject_id = sub.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.teacher_id = ${teacher.id}
      ORDER BY s.day_of_week, s.start_time
    `

    const transformedSchedule = schedules.map((s: any) => ({
      id: s.id.toString(),
      day: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      subject: s.subject_name,
      className: s.class_name,
      classId: s.class_id.toString(),
    }))

    return NextResponse.json({ schedule: transformedSchedule })
  } catch (error) {
    console.error("Error fetching teacher schedule:", error)
    return NextResponse.json({ message: "Възникна грешка при зареждането на разписанието" }, { status: 500 })
  }
}
