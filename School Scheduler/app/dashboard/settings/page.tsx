"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import ShiftManagement from "@/components/shift-management"
import ClassManagement from "@/components/class-management"
import SubjectManagement from "@/components/subject-management"
import TeacherManagement from "@/components/teacher-management"

interface Shift {
  id?: number
  name: string
  startTime: string
  endTime: string
}

interface Class {
  id?: number
  name: string
  grade: number
  studentCount: number
  shiftId: number | null
}

interface Subject {
  id?: number
  name: string
  weeklyHours: number
  color: string
}

interface Teacher {
  id?: number
  name: string
  maxHours: number
  unavailableDays: string[]
}

interface Assignment {
  teacherId: number
  subjectId: number
  classId: number
}

export default function SettingsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/school/settings")
      if (response.ok) {
        const data = await response.json()

        setShifts(
          data.shifts.map((shift: any) => ({
            id: shift.id,
            name: shift.name,
            startTime: shift.start_time,
            endTime: shift.end_time,
          })),
        )

        setClasses(
          data.classes.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            grade: cls.grade,
            studentCount: cls.student_count,
            shiftId: cls.shift_id,
          })),
        )

        setSubjects(
          data.subjects.map((subject: any) => ({
            id: subject.id,
            name: subject.name,
            weeklyHours: subject.weekly_hours,
            color: subject.color,
          })),
        )

        setTeachers(
          data.teachers.map((teacher: any) => ({
            id: teacher.id,
            name: teacher.name,
            maxHours: teacher.max_hours,
            unavailableDays: teacher.unavailable_days || [],
          })),
        )

        setAssignments(
          data.assignments.map((assignment: any) => ({
            teacherId: assignment.teacher_id,
            subjectId: assignment.subject_id,
            classId: assignment.class_id,
          })),
        )
      } else {
        toast({
          title: "Грешка",
          description: "Неуспешно зареждане на настройките",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на настройките",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveAllSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/school/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shifts,
          classes,
          subjects,
          teachers,
          assignments,
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Настройките са запазени успешно",
        })
        // Reload to get updated IDs
        await loadSettings()
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Грешка",
        description: "Неуспешно запазване на настройките",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Зареждане на настройките...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Настройки на Училището</h1>
            <p className="text-muted-foreground">Управлявайте смени, паралелки, предмети и учители</p>
          </div>
          <Button onClick={saveAllSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Запази Всички
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Конфигурация на Училището</CardTitle>
            <CardDescription>Настройте основните параметри на вашето училище</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="shifts" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="shifts">Смени</TabsTrigger>
                <TabsTrigger value="classes">Паралелки</TabsTrigger>
                <TabsTrigger value="subjects">Предмети</TabsTrigger>
                <TabsTrigger value="teachers">Учители</TabsTrigger>
              </TabsList>

              <TabsContent value="shifts" className="space-y-4">
                <ShiftManagement shifts={shifts} setShifts={setShifts} />
              </TabsContent>

              <TabsContent value="classes" className="space-y-4">
                <ClassManagement classes={classes} setClasses={setClasses} shifts={shifts} />
              </TabsContent>

              <TabsContent value="subjects" className="space-y-4">
                <SubjectManagement subjects={subjects} setSubjects={setSubjects} />
              </TabsContent>

              <TabsContent value="teachers" className="space-y-4">
                <TeacherManagement teachers={teachers} setTeachers={setTeachers} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
