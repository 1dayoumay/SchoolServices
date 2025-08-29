import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { User } from "./db"
import { cookies } from "next/headers"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Simple session-based auth instead of JWT
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `
  return users[0] || null
}

export async function getUserById(id: number): Promise<User | null> {
  const users = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `
  return users[0] || null
}

export async function createUser(
  email: string,
  password: string,
  role: "principal" | "teacher" | "student",
  name: string,
): Promise<User> {
  const hashedPassword = await hashPassword(password)

  const users = await sql`
    INSERT INTO users (email, password_hash, role, name)
    VALUES (${email}, ${hashedPassword}, ${role}, ${name})
    RETURNING *
  `

  return users[0]
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await sql`
    INSERT INTO user_sessions (session_id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt})
    ON CONFLICT (session_id) DO UPDATE SET
      user_id = ${userId},
      expires_at = ${expiresAt}
  `

  return sessionId
}

export async function getSessionUser(sessionId: string): Promise<User | null> {
  const sessions = await sql`
    SELECT u.* FROM users u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE s.session_id = ${sessionId} 
    AND s.expires_at > NOW()
    LIMIT 1
  `

  return sessions[0] || null
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`
    DELETE FROM user_sessions WHERE session_id = ${sessionId}
  `
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return null
    }

    return await getSessionUser(sessionId)
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}
