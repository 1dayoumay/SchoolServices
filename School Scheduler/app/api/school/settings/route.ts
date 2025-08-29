import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.school_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schoolId = session.user.school_id

    // Get shifts with fallback for different column names
    const shifts = await sql`
      SELECT 
        id,
        name,
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'start_time') 
          THEN start_time::text
          ELSE COALESCE(start_hour, '08:00')::text
        END as start_time,
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'end_time') 
          THEN end_time::text
          ELSE COALESCE(end_hour, '15:00')::text
        END as end_time
      FROM shifts 
      WHERE school_id = ${schoolId}
      ORDER BY name
    `

    // Get classes with fallback for different column names
    const classes = await sql`
      SELECT 
        id,
        name,
        grade,
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'student_count') 
          THEN COALESCE(student_count, 0)
          ELSE COALESCE(students_count, 0)
        END as student_count,
        shift_id
      FROM classes 
      WHERE school_id = ${schoolId}
      ORDER BY grade, name
    `

    // Get subjects with fallback for different column names
    const subjects = await sql`
      SELECT 
        id,
        name,
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'weekly_hours') 
          THEN COALESCE(weekly_hours, 0)
          ELSE COALESCE(hours_per_week, 0)
        END as weekly_hours,
        COALESCE(color, '#3B82F6') as color
      FROM subjects 
      WHERE school_id = ${schoolId}
      ORDER BY name
    `

    // Get teachers
    const teachers = await sql`
      SELECT 
        id,
        name,
        COALESCE(max_hours, 40) as max_hours,
        COALESCE(unavailable_days, '[]'::jsonb) as unavailable_days
      FROM teachers 
      WHERE school_id = ${schoolId}
      ORDER BY name
    `

    // Get assignments
    const assignments = await sql`
      SELECT 
        teacher_id,
        subject_id,
        class_id
      FROM teacher_subject_assignments 
      WHERE school_id = ${schoolId}
    `

    return NextResponse.json({
      shifts,
      classes,
      subjects,
      teachers,
      assignments,
    })
  } catch (error) {
    console.error("Error fetching school settings:", error)
    return NextResponse.json({ error: "Failed to fetch school settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.school_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schoolId = session.user.school_id
    const data = await request.json()

    // Save shifts
    if (data.shifts) {
      // Clear existing shifts
      await sql`DELETE FROM shifts WHERE school_id = ${schoolId}`

      // Insert new shifts
      for (const shift of data.shifts) {
        await sql`
          INSERT INTO shifts (school_id, name, start_time, end_time)
          VALUES (${schoolId}, ${shift.name}, ${shift.startTime}, ${shift.endTime})
        `
      }
    }

    // Save classes
    if (data.classes) {
      // Clear existing classes
      await sql`DELETE FROM classes WHERE school_id = ${schoolId}`

      // Insert new classes
      for (const cls of data.classes) {
        await sql`
          INSERT INTO classes (school_id, name, grade, student_count, shift_id)
          VALUES (${schoolId}, ${cls.name}, ${cls.grade}, ${cls.studentCount}, ${cls.shiftId})
        `
      }
    }

    // Save subjects
    if (data.subjects) {
      // Clear existing subjects
      await sql`DELETE FROM subjects WHERE school_id = ${schoolId}`

      // Insert new subjects
      for (const subject of data.subjects) {
        await sql`
          INSERT INTO subjects (school_id, name, weekly_hours, color)
          VALUES (${schoolId}, ${subject.name}, ${subject.weeklyHours}, ${subject.color})
        `
      }
    }

    // Save teachers
    if (data.teachers) {
      // Clear existing teachers
      await sql`DELETE FROM teachers WHERE school_id = ${schoolId}`

      // Insert new teachers
      for (const teacher of data.teachers) {
        await sql`
          INSERT INTO teachers (school_id, name, max_hours, unavailable_days)
          VALUES (${schoolId}, ${teacher.name}, ${teacher.maxHours}, ${JSON.stringify(teacher.unavailableDays || [])})
        `
      }
    }

    // Save assignments
    if (data.assignments) {
      // Clear existing assignments
      await sql`DELETE FROM teacher_subject_assignments WHERE school_id = ${schoolId}`

      // Insert new assignments
      for (const assignment of data.assignments) {
        await sql`
          INSERT INTO teacher_subject_assignments (school_id, teacher_id, subject_id, class_id)
          VALUES (${schoolId}, ${assignment.teacherId}, ${assignment.subjectId}, ${assignment.classId})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving school settings:", error)
    return NextResponse.json({ error: "Failed to save school settings" }, { status: 500 })
  }
}
