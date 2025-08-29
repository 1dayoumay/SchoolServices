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
    if (!user || user.role !== "principal") {
      return NextResponse.json({ message: "Нямате права за достъп" }, { status: 403 })
    }

    // Get school
    const schools = await sql`
      SELECT * FROM schools WHERE principal_id = ${user.id} LIMIT 1
    `

    if (schools.length === 0) {
      return NextResponse.json({ message: "Училището не е намерено" }, { status: 404 })
    }

    const school = schools[0]

    // Get all teacher absences for this school
    const absences = await sql`
      SELECT 
        ta.*,
        u.name as teacher_name
      FROM teacher_absences ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE t.school_id = ${school.id}
      ORDER BY ta.created_at DESC
    `

    const transformedAbsences = absences.map((a: any) => ({
      id: a.id.toString(),
      teacherName: a.teacher_name,
      teacherId: a.teacher_id.toString(),
      type: a.type,
      startDate: a.start_date,
      endDate: a.end_date,
      startTime: a.start_time,
      endTime: a.end_time,
      reason: a.reason,
      status: a.status,
      createdAt: a.created_at,
      responseNote: a.response_note,
    }))

    return NextResponse.json({ absences: transformedAbsences })
  } catch (error) {
    console.error("Error fetching teacher absences:", error)
    return NextResponse.json({ message: "Възникна грешка при зареждането на отсъствията" }, { status: 500 })
  }
}
