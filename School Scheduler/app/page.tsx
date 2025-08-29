"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import ShiftManagement from "@/components/shift-management"
import ClassManagement from "@/components/class-management"
import SubjectManagement from "@/components/subject-management"
import TeacherManagement from "@/components/teacher-management"
import ScheduleViewer from "@/components/schedule-viewer"

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

export interface Class {
  id: string
  name: string
  grade: string
  studentsCount: number
  shiftId: string
}

export interface Subject {
  id: string
  name: string
  hoursPerWeek: number
  color: string
}

export interface Teacher {
  id: string
  name: string
  email: string
  assignments: { classId: string; subjectId: string }[]
  maxHoursPerWeek: number
  unavailableDays: string[]
}

export interface ScheduleSlot {
  day: string
  time: string // "HH:mm-HH:mm"
  subject: string
  teacher: string
  classId: string
}

// Helper to format time
const formatTime = (date: Date) => date.toTimeString().slice(0, 5)

// Helper to add minutes to a date object
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000)

export default function SchoolScheduler() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([])
  const [activeTab, setActiveTab] = useState("shifts")
  const router = useRouter()

  const [settings, setScheduleSettings] = useState({
    lessonDuration: 45,
    shortBreak: 10,
    longBreak: 20,
    minHoursPerDay: 4,
  })

  const isShiftsComplete = shifts.length > 0
  const isClassesComplete = classes.length > 0
  const isSubjectsComplete = subjects.length > 0
  const isTeachersComplete = teachers.length > 0 && teachers.some((t) => t.assignments.length > 0)

  const generateSchedules = () => {
    const newSchedules: ScheduleSlot[] = []
    const days = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]
    const teacherWorkload: { [teacherId: string]: number } = {}
    teachers.forEach((t) => (teacherWorkload[t.id] = 0))

    shifts.forEach((shift) => {
      const classesInShift = classes.filter((c) => c.shiftId === shift.id)
      const [startHour, startMinute] = shift.startTime.split(":").map(Number)
      const [endHour, endMinute] = shift.endTime.split(":").map(Number)

      classesInShift.forEach((classItem) => {
        // Create lesson pool for the entire week
        let lessonPool: { subjectId: string }[] = []
        subjects.forEach((subject) => {
          for (let i = 0; i < subject.hoursPerWeek; i++) {
            lessonPool.push({ subjectId: subject.id })
          }
        })
        lessonPool = lessonPool.sort(() => Math.random() - 0.5)

        // Plan each day to meet minimum hours requirement
        days.forEach((day) => {
          const dailyLessons: { subjectId: string }[] = []
          let currentTime = new Date()
          currentTime.setHours(startHour, startMinute, 0, 0)
          const shiftEndTime = new Date()
          shiftEndTime.setHours(endHour, endMinute, 0, 0)

          // Calculate how many lessons can fit in this shift
          const totalShiftMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
          const maxLessonsPerDay = Math.floor(totalShiftMinutes / (settings.lessonDuration + settings.shortBreak))

          // Try to schedule at least minHoursPerDay lessons, but not more than available
          const targetLessonsForDay = Math.min(settings.minHoursPerDay, maxLessonsPerDay, lessonPool.length)

          // Collect lessons for this day
          for (let i = 0; i < targetLessonsForDay && lessonPool.length > 0; i++) {
            const lesson = lessonPool.shift()
            if (lesson) {
              dailyLessons.push(lesson)
            }
          }

          // Only proceed if we have enough lessons to meet minimum requirement
          if (dailyLessons.length >= Math.min(settings.minHoursPerDay, lessonPool.length + dailyLessons.length)) {
            // Schedule the collected lessons
            dailyLessons.forEach((lessonToSchedule, lessonIndex) => {
              const lessonStartTime = new Date(currentTime)
              const lessonEndTime = addMinutes(lessonStartTime, settings.lessonDuration)

              if (lessonEndTime <= shiftEndTime) {
                const subject = subjects.find((s) => s.id === lessonToSchedule.subjectId)
                if (!subject) return

                const assignedTeacher = teachers.find((t) =>
                  t.assignments.some((a) => a.classId === classItem.id && a.subjectId === subject.id),
                )

                if (!assignedTeacher || assignedTeacher.unavailableDays.includes(day)) {
                  return // Skip if no teacher or teacher unavailable
                }

                // Check if teacher is already busy at this time
                const isTeacherBusy = newSchedules.some(
                  (s) =>
                    s.day === day &&
                    s.teacher === assignedTeacher.name &&
                    s.time.startsWith(formatTime(lessonStartTime)),
                )

                if (!isTeacherBusy && teacherWorkload[assignedTeacher.id] < assignedTeacher.maxHoursPerWeek) {
                  newSchedules.push({
                    day: day,
                    time: `${formatTime(lessonStartTime)}-${formatTime(lessonEndTime)}`,
                    subject: subject.name,
                    teacher: assignedTeacher.name,
                    classId: classItem.id,
                  })
                  teacherWorkload[assignedTeacher.id]++

                  // Advance time for next lesson
                  currentTime = new Date(lessonEndTime)
                  if ((lessonIndex + 1) % 2 === 0) {
                    currentTime = addMinutes(currentTime, settings.longBreak)
                  } else {
                    currentTime = addMinutes(currentTime, settings.shortBreak)
                  }
                }
              }
            })
          } else {
            // Put lessons back if we can't meet minimum requirement
            dailyLessons.forEach((lesson) => lessonPool.unshift(lesson))
          }
        })
      })
    })

    setSchedules(newSchedules)
    setActiveTab("schedules")
  }

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        if (response.ok) {
          const data = await response.json()
          // Redirect based on role
          if (data.role === "principal") {
            router.push("/dashboard")
          } else if (data.role === "teacher") {
            router.push("/teacher-dashboard")
          } else if (data.role === "student") {
            router.push("/student-dashboard")
          }
        } else {
          // Not authenticated, redirect to role selection
          router.push("/auth/role-select")
        }
      } catch (error) {
        // Error checking auth, redirect to role selection
        router.push("/auth/role-select")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Генератор на Училищни Разписания</h1>
        <p className="text-muted-foreground">Създайте и управлявайте разписанията на вашето училище стъпка по стъпка</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Общи Настройки на Разписанието
          </CardTitle>
          <CardDescription>Тези настройки важат за всички смени.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="lessonDuration">Продължителност на часа (мин)</Label>
            <Input
              id="lessonDuration"
              type="number"
              value={settings.lessonDuration}
              onChange={(e) => setScheduleSettings({ ...settings, lessonDuration: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="shortBreak">Кратко междучасие (мин)</Label>
            <Input
              id="shortBreak"
              type="number"
              value={settings.shortBreak}
              onChange={(e) => setScheduleSettings({ ...settings, shortBreak: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="longBreak">Дълго междучасие (мин)</Label>
            <Input
              id="longBreak"
              type="number"
              value={settings.longBreak}
              onChange={(e) => setScheduleSettings({ ...settings, longBreak: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="minHoursPerDay">Минимум часове на ден</Label>
            <Input
              id="minHoursPerDay"
              type="number"
              value={settings.minHoursPerDay}
              onChange={(e) => setScheduleSettings({ ...settings, minHoursPerDay: Number(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="shifts">1. Смени</TabsTrigger>
          <TabsTrigger value="classes" disabled={!isShiftsComplete}>
            2. Паралелки
          </TabsTrigger>
          <TabsTrigger value="subjects" disabled={!isClassesComplete}>
            3. Предмети
          </TabsTrigger>
          <TabsTrigger value="teachers" disabled={!isSubjectsComplete}>
            4. Учители
          </TabsTrigger>
          <TabsTrigger value="schedules" disabled={!isTeachersComplete}>
            5. Разписания
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts">
          <ShiftManagement shifts={shifts} setShifts={setShifts} onNext={() => setActiveTab("classes")} />
        </TabsContent>
        <TabsContent value="classes">
          <ClassManagement
            classes={classes}
            setClasses={setClasses}
            shifts={shifts}
            onNext={() => setActiveTab("subjects")}
          />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectManagement subjects={subjects} setSubjects={setSubjects} onNext={() => setActiveTab("teachers")} />
        </TabsContent>
        <TabsContent value="teachers">
          <TeacherManagement
            teachers={teachers}
            setTeachers={setTeachers}
            subjects={subjects}
            classes={classes}
            onGenerateSchedules={generateSchedules}
            canGenerate={isClassesComplete && isSubjectsComplete && isTeachersComplete}
          />
        </TabsContent>
        <TabsContent value="schedules">
          <ScheduleViewer schedules={schedules} classes={classes} subjects={subjects} shifts={shifts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
