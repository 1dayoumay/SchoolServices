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

    // Get teacher's absences
    const absences = await sql`
      SELECT * FROM teacher_absences 
      WHERE teacher_id = ${teacher.id} 
      ORDER BY created_at DESC
    `

    const transformedAbsences = absences.map((a: any) => ({
      id: a.id.toString(),
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

export async function POST(request: NextRequest) {
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

    const absenceData = await request.json()

    // Get teacher record
    const teachers = await sql`
      SELECT * FROM teachers WHERE user_id = ${user.id} LIMIT 1
    `

    if (teachers.length === 0) {
      return NextResponse.json({ message: "Учителският профил не е намерен" }, { status: 404 })
    }

    const teacher = teachers[0]

    // Create absence
    const absences = await sql`
      INSERT INTO teacher_absences (
        teacher_id, type, start_date, end_date, start_time, end_time, reason, status
      )
      VALUES (
        ${teacher.id}, ${absenceData.type}, ${absenceData.startDate}, 
        ${absenceData.endDate || absenceData.startDate}, ${absenceData.startTime || null}, 
        ${absenceData.endTime || null}, ${absenceData.reason}, 'pending'
      )
      RETURNING *
    `

    const absence = absences[0]

    const transformedAbsence = {
      id: absence.id.toString(),
      type: absence.type,
      startDate: absence.start_date,
      endDate: absence.end_date,
      startTime: absence.start_time,
      endTime: absence.end_time,
      reason: absence.reason,
      status: absence.status,
      createdAt: absence.created_at,
      responseNote: absence.response_note,
    }

    return NextResponse.json({ absence: transformedAbsence })
  } catch (error) {
    console.error("Error creating teacher absence:", error)
    return NextResponse.json({ message: "Възникна грешка при създаването на заявката" }, { status: 500 })
  }
}
