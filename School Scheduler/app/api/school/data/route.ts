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

    // Get shifts
    const shifts = await sql`
      SELECT * FROM shifts WHERE school_id = ${school.id} ORDER BY created_at
    `

    // Get classes
    const classes = await sql`
      SELECT * FROM classes WHERE school_id = ${school.id} ORDER BY created_at
    `

    // Get subjects
    const subjects = await sql`
      SELECT * FROM subjects WHERE school_id = ${school.id} ORDER BY created_at
    `

    // Get teachers with assignments
    const teachers = await sql`
      SELECT 
        t.*,
        u.name,
        u.email,
        COALESCE(
          json_agg(
            json_build_object(
              'classId', ta.class_id::text,
              'subjectId', ta.subject_id::text
            )
          ) FILTER (WHERE ta.id IS NOT NULL),
          '[]'::json
        ) as assignments
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
      WHERE t.school_id = ${school.id}
      GROUP BY t.id, u.name, u.email
      ORDER BY t.created_at
    `

    // Transform data to match frontend interfaces
    const transformedShifts = shifts.map((s: any) => ({
      id: s.id.toString(),
      name: s.name,
      startTime: s.start_time,
      endTime: s.end_time,
    }))

    const transformedClasses = classes.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      grade: c.grade,
      studentsCount: c.students_count,
      shiftId: c.shift_id?.toString() || "",
    }))

    const transformedSubjects = subjects.map((s: any) => ({
      id: s.id.toString(),
      name: s.name,
      hoursPerWeek: s.hours_per_week,
      color: s.color,
    }))

    const transformedTeachers = teachers.map((t: any) => ({
      id: t.id.toString(),
      name: t.name,
      email: t.email,
      maxHoursPerWeek: t.max_hours_per_week,
      unavailableDays: t.unavailable_days || [],
      assignments: t.assignments || [],
    }))

    return NextResponse.json({
      shifts: transformedShifts,
      classes: transformedClasses,
      subjects: transformedSubjects,
      teachers: transformedTeachers,
    })
  } catch (error) {
    console.error("Error fetching school data:", error)
    return NextResponse.json({ message: "Възникна грешка при зареждането на данните" }, { status: 500 })
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
    if (!user || user.role !== "principal") {
      return NextResponse.json({ message: "Нямате права за достъп" }, { status: 403 })
    }

    const { shifts, classes, subjects, teachers } = await request.json()

    // Get school
    const schools = await sql`
      SELECT * FROM schools WHERE principal_id = ${user.id} LIMIT 1
    `

    if (schools.length === 0) {
      return NextResponse.json({ message: "Училището не е намерено" }, { status: 404 })
    }

    const school = schools[0]

    // Clear existing data
    await sql`DELETE FROM teacher_assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE school_id = ${school.id})`
    await sql`DELETE FROM teachers WHERE school_id = ${school.id}`
    await sql`DELETE FROM schedules WHERE school_id = ${school.id}`
    await sql`DELETE FROM classes WHERE school_id = ${school.id}`
    await sql`DELETE FROM subjects WHERE school_id = ${school.id}`
    await sql`DELETE FROM shifts WHERE school_id = ${school.id}`

    // Insert shifts
    for (const shift of shifts) {
      await sql`
        INSERT INTO shifts (id, school_id, name, start_time, end_time)
        VALUES (${Number.parseInt(shift.id)}, ${school.id}, ${shift.name}, ${shift.startTime}, ${shift.endTime})
      `
    }

    // Insert subjects
    for (const subject of subjects) {
      await sql`
        INSERT INTO subjects (id, school_id, name, hours_per_week, color)
        VALUES (${Number.parseInt(subject.id)}, ${school.id}, ${subject.name}, ${subject.hoursPerWeek}, ${subject.color})
      `
    }

    // Insert classes
    for (const classItem of classes) {
      await sql`
        INSERT INTO classes (id, school_id, shift_id, name, grade, students_count)
        VALUES (${Number.parseInt(classItem.id)}, ${school.id}, ${Number.parseInt(classItem.shiftId)}, ${classItem.name}, ${classItem.grade}, ${classItem.studentsCount})
      `
    }

    // Insert teachers and their assignments
    for (const teacher of teachers) {
      // Create user for teacher if not exists
      const existingUsers = await sql`
        SELECT id FROM users WHERE email = ${teacher.email}
      `

      let teacherUserId
      if (existingUsers.length > 0) {
        teacherUserId = existingUsers[0].id
      } else {
        const newUsers = await sql`
          INSERT INTO users (email, password_hash, role, name)
          VALUES (${teacher.email}, 'temp_password', 'teacher', ${teacher.name})
          RETURNING id
        `
        teacherUserId = newUsers[0].id
      }

      // Insert teacher
      const insertedTeachers = await sql`
        INSERT INTO teachers (id, user_id, school_id, max_hours_per_week, unavailable_days)
        VALUES (${Number.parseInt(teacher.id)}, ${teacherUserId}, ${school.id}, ${teacher.maxHoursPerWeek}, ${teacher.unavailableDays})
        RETURNING id
      `

      const teacherId = insertedTeachers[0].id

      // Insert teacher assignments
      for (const assignment of teacher.assignments) {
        await sql`
          INSERT INTO teacher_assignments (teacher_id, class_id, subject_id)
          VALUES (${teacherId}, ${Number.parseInt(assignment.classId)}, ${Number.parseInt(assignment.subjectId)})
        `
      }
    }

    return NextResponse.json({ message: "Данните са запазени успешно" })
  } catch (error) {
    console.error("Error saving school data:", error)
    return NextResponse.json({ message: "Възникна грешка при запазването на данните" }, { status: 500 })
  }
}
