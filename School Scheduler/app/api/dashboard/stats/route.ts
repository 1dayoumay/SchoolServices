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

    // Check if there are active schedules
    const scheduleCount = await sql`
      SELECT COUNT(*) as count FROM schedules WHERE school_id = ${school.id}
    `

    const hasActiveSchedule = scheduleCount[0].count > 0

    if (!hasActiveSchedule) {
      return NextResponse.json({
        hasActiveSchedule: false,
        stats: null,
      })
    }

    // Get basic counts
    const totalClasses = await sql`
      SELECT COUNT(*) as count FROM classes WHERE school_id = ${school.id}
    `

    const totalTeachers = await sql`
      SELECT COUNT(*) as count FROM teachers WHERE school_id = ${school.id}
    `

    const totalSubjects = await sql`
      SELECT COUNT(*) as count FROM subjects WHERE school_id = ${school.id}
    `

    // Get total scheduled hours per week
    const totalScheduledHours = await sql`
      SELECT COUNT(*) as count FROM schedules WHERE school_id = ${school.id}
    `

    // Get busiest teacher
    const busiestTeacher = await sql`
      SELECT u.name, COUNT(s.id) as hours
      FROM schedules s
      JOIN teachers t ON s.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE s.school_id = ${school.id}
      GROUP BY t.id, u.name
      ORDER BY hours DESC
      LIMIT 1
    `

    // Get most taught subject
    const mostTaughtSubject = await sql`
      SELECT sub.name, COUNT(s.id) as hours
      FROM schedules s
      JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.school_id = ${school.id}
      GROUP BY sub.id, sub.name
      ORDER BY hours DESC
      LIMIT 1
    `

    // Calculate average hours per class
    const averageHoursPerClass = totalScheduledHours[0].count / Math.max(totalClasses[0].count, 1)

    // Calculate schedule completeness (simplified)
    const expectedHours = await sql`
      SELECT SUM(hours_per_week) as total FROM subjects WHERE school_id = ${school.id}
    `

    const expectedTotal = (expectedHours[0].total || 0) * totalClasses[0].count
    const scheduleCompleteness =
      expectedTotal > 0 ? Math.round((totalScheduledHours[0].count / expectedTotal) * 100) : 0

    // Get teacher absence statistics
    const pendingAbsences = await sql`
      SELECT COUNT(*) as count 
      FROM teacher_absences ta
      JOIN teachers t ON ta.teacher_id = t.id
      WHERE t.school_id = ${school.id} AND ta.status = 'pending'
    `

    const teacherWithMostAbsences = await sql`
      SELECT u.name, COUNT(ta.id) as absences
      FROM teacher_absences ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE t.school_id = ${school.id}
      GROUP BY t.id, u.name
      ORDER BY absences DESC
      LIMIT 1
    `

    const totalAbsencesThisMonth = await sql`
      SELECT COUNT(*) as count
      FROM teacher_absences ta
      JOIN teachers t ON ta.teacher_id = t.id
      WHERE t.school_id = ${school.id} 
      AND ta.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    const stats = {
      totalClasses: totalClasses[0].count,
      totalTeachers: totalTeachers[0].count,
      totalSubjects: totalSubjects[0].count,
      totalScheduledHours: totalScheduledHours[0].count,
      busiestTeacher:
        busiestTeacher.length > 0
          ? {
              name: busiestTeacher[0].name,
              hours: busiestTeacher[0].hours,
            }
          : null,
      mostTaughtSubject:
        mostTaughtSubject.length > 0
          ? {
              name: mostTaughtSubject[0].name,
              hours: mostTaughtSubject[0].hours,
            }
          : null,
      averageHoursPerClass,
      scheduleCompleteness: Math.min(scheduleCompleteness, 100),
      pendingAbsences: pendingAbsences[0].count,
      teacherWithMostAbsences:
        teacherWithMostAbsences.length > 0
          ? {
              name: teacherWithMostAbsences[0].name,
              absences: teacherWithMostAbsences[0].absences,
            }
          : null,
      totalAbsencesThisMonth: totalAbsencesThisMonth[0].count,
    }

    return NextResponse.json({
      hasActiveSchedule: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ message: "Възникна грешка при зареждането на статистиките" }, { status: 500 })
  }
}
