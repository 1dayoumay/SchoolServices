import { type NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { status, responseNote } = await request.json()

    // Get school
    const schools = await sql`
      SELECT * FROM schools WHERE principal_id = ${user.id} LIMIT 1
    `

    if (schools.length === 0) {
      return NextResponse.json({ message: "Училището не е намерено" }, { status: 404 })
    }

    const school = schools[0]

    // Update absence status
    await sql`
      UPDATE teacher_absences 
      SET status = ${status}, response_note = ${responseNote || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number.parseInt(params.id)} 
      AND teacher_id IN (SELECT id FROM teachers WHERE school_id = ${school.id})
    `

    return NextResponse.json({ message: "Заявката е актуализирана успешно" })
  } catch (error) {
    console.error("Error updating teacher absence:", error)
    return NextResponse.json({ message: "Възникна грешка при актуализирането на заявката" }, { status: 500 })
  }
}
