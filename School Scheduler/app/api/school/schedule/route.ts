import { type NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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

    const { schedules, settings } = await request.json()

    // Get school
    const schools = await sql`
      SELECT * FROM schools WHERE principal_id = ${user.id} LIMIT 1
    `

    if (schools.length === 0) {
      return NextResponse.json({ message: "Училището не е намерено" }, { status: 404 })
    }

    const school = schools[0]

    // Clear existing schedules
    await sql`DELETE FROM schedules WHERE school_id = ${school.id}`

    // Insert new schedules
    for (const schedule of schedules) {
      // Find class, subject, and teacher IDs
      const classResult = await sql`
        SELECT id FROM classes WHERE school_id = ${school.id} AND name = ${schedule.classId}
      `

      const subjectResult = await sql`
        SELECT id FROM subjects WHERE school_id = ${school.id} AND name = ${schedule.subject}
      `

      const teacherResult = await sql`
        SELECT t.id FROM teachers t
        JOIN users u ON t.user_id = u.id
        WHERE t.school_id = ${school.id} AND u.name = ${schedule.teacher}
      `

      if (classResult.length > 0 && subjectResult.length > 0 && teacherResult.length > 0) {
        const [startTime, endTime] = schedule.time.split("-")

        await sql`
          INSERT INTO schedules (school_id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time)
          VALUES (${school.id}, ${classResult[0].id}, ${subjectResult[0].id}, ${teacherResult[0].id}, ${schedule.day}, ${startTime}, ${endTime})
        `
      }
    }

    return NextResponse.json({ message: "Разписанието е активирано успешно" })
  } catch (error) {
    console.error("Error activating schedule:", error)
    return NextResponse.json({ message: "Възникна грешка при активирането на разписанието" }, { status: 500 })
  }
}
