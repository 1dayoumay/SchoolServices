import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export type User = {
  id: number
  email: string
  password_hash: string
  role: "principal" | "teacher" | "student"
  name: string
  created_at: string
  updated_at: string
}

export type School = {
  id: number
  name: string
  address: string
  principal_id: number
  created_at: string
  updated_at: string
}

export type DbShift = {
  id: number
  school_id: number
  name: string
  start_time: string
  end_time: string
  created_at: string
}

export type DbClass = {
  id: number
  school_id: number
  shift_id: number
  name: string
  grade: string
  students_count: number
  created_at: string
}

export type DbSubject = {
  id: number
  school_id: number
  name: string
  hours_per_week: number
  color: string
  created_at: string
}

export type DbTeacher = {
  id: number
  user_id: number
  school_id: number
  max_hours_per_week: number
  unavailable_days: string[]
  created_at: string
}
