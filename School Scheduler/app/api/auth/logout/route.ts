import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session-id")?.value

    if (sessionId) {
      await deleteSession(sessionId)
    }

    cookieStore.delete("session-id")

    return NextResponse.json({ message: "Успешен изход" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Възникна грешка при изхода" }, { status: 500 })
  }
}
