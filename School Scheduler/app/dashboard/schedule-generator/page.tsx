"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, BookOpen, UserCheck, Calendar, Download, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import ShiftManagement from "@/components/shift-management"
import ClassManagement from "@/components/class-management"
import SubjectManagement from "@/components/subject-management"
import TeacherManagement from "@/components/teacher-management"
import ScheduleViewer from "@/components/schedule-viewer"

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface Class {
  id: string
  name: string
  grade: string
  studentsCount: number
  shiftId: string
}

interface Subject {
  id: string
  name: string
  hoursPerWeek: number
  color: string
}

interface Teacher {
  id: string
  name: string
  email: string
  maxHoursPerWeek: number
  unavailableDays: string[]
  assignments: Assignment[]
}

interface Assignment {
  classId: string
  subjectId: string
}

interface ScheduleEntry {
  day: string
  time: string
  subject: string
  teacher: string
  class: string
  color: string
}

export default function ScheduleGeneratorPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("shifts")

  // Load existing data from settings
  useEffect(() => {
    loadSettingsData()
  }, [])

  const loadSettingsData = async () => {
    try {
      const response = await fetch("/api/school/settings")
      if (response.ok) {
        const data = await response.json()

        // Transform database data to frontend format
        if (data.shifts) {
          setShifts(
            data.shifts.map((shift: any) => ({
              id: shift.id?.toString() || Date.now().toString(),
              name: shift.name,
              startTime: shift.startTime || shift.start_time,
              endTime: shift.endTime || shift.end_time,
            })),
          )
        }

        if (data.classes) {
          setClasses(
            data.classes.map((cls: any) => ({
              id: cls.id?.toString() || Date.now().toString(),
              name: cls.name,
              grade: cls.grade?.toString() || cls.grade,
              studentsCount: cls.studentsCount || cls.student_count || 25,
              shiftId: cls.shiftId?.toString() || cls.shift_id?.toString() || "",
            })),
          )
        }

        if (data.subjects) {
          setSubjects(
            data.subjects.map((subject: any) => ({
              id: subject.id?.toString() || Date.now().toString(),
              name: subject.name,
              hoursPerWeek: subject.hoursPerWeek || subject.weekly_hours || subject.hours_per_week || 1,
              color: subject.color || "#3B82F6",
            })),
          )
        }

        if (data.teachers) {
          setTeachers(
            data.teachers.map((teacher: any) => ({
              id: teacher.id?.toString() || Date.now().toString(),
              name: teacher.name,
              email: teacher.email || "",
              maxHoursPerWeek: teacher.maxHoursPerWeek || teacher.max_hours || 25,
              unavailableDays: teacher.unavailableDays || teacher.unavailable_days || [],
              assignments: teacher.assignments || [],
            })),
          )
        }

        toast({
          title: "Данните са заредени",
          description: "Настройките от системата са заредени успешно",
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Грешка при зареждане",
        description: "Не можаха да се заредят настройките",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async () => {
    try {
      const response = await fetch("/api/school/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shifts,
          classes,
          subjects,
          teachers,
        }),
      })

      if (response.ok) {
        toast({
          title: "Успех",
          description: "Данните са запазени успешно",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Данните не можаха да бъдат запазени",
        variant: "destructive",
      })
    }
  }

  const generateSchedule = async () => {
    if (shifts.length === 0 || classes.length === 0 || subjects.length === 0 || teachers.length === 0) {
      toast({
        title: "Грешка",
        description: "Моля, попълнете всички необходими данни преди генериране",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Save current data first
      await saveData()

      // Simple schedule generation algorithm
      const newSchedule: ScheduleEntry[] = []
      const days = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]
      const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]

      classes.forEach((classItem) => {
        const classSubjects = subjects.filter((subject) =>
          teachers.some((teacher) =>
            teacher.assignments.some(
              (assignment) => assignment.classId === classItem.id && assignment.subjectId === subject.id,
            ),
          ),
        )

        let subjectIndex = 0
        days.forEach((day) => {
          timeSlots.slice(0, 6).forEach((time) => {
            if (classSubjects.length > 0) {
              const subject = classSubjects[subjectIndex % classSubjects.length]
              const teacher = teachers.find((t) =>
                t.assignments.some((a) => a.classId === classItem.id && a.subjectId === subject.id),
              )

              if (teacher && !teacher.unavailableDays.includes(day)) {
                newSchedule.push({
                  day,
                  time,
                  subject: subject.name,
                  teacher: teacher.name,
                  class: `${classItem.grade}${classItem.name}`,
                  color: subject.color,
                })
              }
              subjectIndex++
            }
          })
        })
      })

      setSchedule(newSchedule)

      // Save schedule to database
      await fetch("/api/school/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: newSchedule }),
      })

      setActiveTab("view")
      toast({
        title: "Успех",
        description: "Разписанието е генерирано успешно!",
      })
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при генериране на разписанието",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToExcel = async () => {
    if (schedule.length === 0) {
      toast({
        title: "Грешка",
        description: "Няма генерирано разписание за експорт",
        variant: "destructive",
      })
      return
    }

    try {
      // Dynamic import of xlsx
      const XLSX = await import("xlsx")

      const workbook = XLSX.utils.book_new()

      // Create a worksheet for each class
      const classesList = [...new Set(schedule.map((entry) => entry.class))]

      classesList.forEach((className) => {
        const classSchedule = schedule.filter((entry) => entry.class === className)

        // Create schedule grid
        const days = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]
        const timeSlots = [...new Set(classSchedule.map((entry) => entry.time))].sort()

        const scheduleGrid: any[][] = []

        // Header row
        scheduleGrid.push(["Час", ...days])

        // Data rows
        timeSlots.forEach((time) => {
          const row = [time]
          days.forEach((day) => {
            const entry = classSchedule.find((e) => e.day === day && e.time === time)
            row.push(entry ? `${entry.subject}\n(${entry.teacher})` : "")
          })
          scheduleGrid.push(row)
        })

        const worksheet = XLSX.utils.aoa_to_sheet(scheduleGrid)

        // Set column widths
        worksheet["!cols"] = [
          { width: 10 }, // Time column
          { width: 20 }, // Monday
          { width: 20 }, // Tuesday
          { width: 20 }, // Wednesday
          { width: 20 }, // Thursday
          { width: 20 }, // Friday
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, className)
      })

      // Create summary sheet
      const summaryData = [
        ["Обобщение на разписанието"],
        [""],
        ["Брой смени:", shifts.length],
        ["Брой паралелки:", classes.length],
        ["Брой предмети:", subjects.length],
        ["Брой учители:", teachers.length],
        [""],
        ["Паралелки:"],
        ...classes.map((c) => [`${c.grade}${c.name}`, `${c.studentsCount} ученици`]),
        [""],
        ["Предмети:"],
        ...subjects.map((s) => [s.name, `${s.hoursPerWeek} часа седмично`]),
      ]

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Обобщение")

      // Generate filename with current date
      const date = new Date().toISOString().split("T")[0]
      const filename = `razpisanie-${date}.xlsx`

      // Save file
      XLSX.writeFile(workbook, filename)

      toast({
        title: "Успех",
        description: `Разписанието е експортирано като ${filename}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Грешка",
        description: "Възникна грешка при експорт на разписанието",
        variant: "destructive",
      })
    }
  }

  const getCompletionStatus = () => {
    const steps = [
      { name: "shifts", completed: shifts.length > 0 },
      { name: "classes", completed: classes.length > 0 },
      { name: "subjects", completed: subjects.length > 0 },
      { name: "teachers", completed: teachers.length > 0 },
    ]

    const completedSteps = steps.filter((step) => step.completed).length
    return { completedSteps, totalSteps: steps.length, percentage: (completedSteps / steps.length) * 100 }
  }

  const { completedSteps, totalSteps, percentage } = getCompletionStatus()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Зареждане на данни...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Генератор на Разписания</h1>
          <p className="text-muted-foreground">Създайте автоматично разписание за вашето училище</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{shifts.length}</p>
                  <p className="text-sm text-muted-foreground">Смени</p>
                  <Badge variant={shifts.length > 0 ? "default" : "secondary"} className="mt-1">
                    {shifts.length > 0 ? "Завършено" : "Незавършено"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-sm text-muted-foreground">Паралелки</p>
                  <Badge variant={classes.length > 0 ? "default" : "secondary"} className="mt-1">
                    {classes.length > 0 ? "Завършено" : "Незавършено"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{subjects.length}</p>
                  <p className="text-sm text-muted-foreground">Предмети</p>
                  <Badge variant={subjects.length > 0 ? "default" : "secondary"} className="mt-1">
                    {subjects.length > 0 ? "Завършено" : "Незавършено"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                  <p className="text-sm text-muted-foreground">Учители</p>
                  <Badge variant={teachers.length > 0 ? "default" : "secondary"} className="mt-1">
                    {teachers.length > 0 ? "Завършено" : "Незавършено"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогрес на настройката</span>
              <span className="text-sm text-muted-foreground">
                {completedSteps}/{totalSteps} стъпки завършени
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Смени
              {shifts.length > 0 && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Паралелки
              {classes.length > 0 && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Предмети
              {subjects.length > 0 && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Учители
              {teachers.length > 0 && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Генериране
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Преглед
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="mt-6">
            <ShiftManagement shifts={shifts} setShifts={setShifts} />
          </TabsContent>

          <TabsContent value="classes" className="mt-6">
            <ClassManagement classes={classes} setClasses={setClasses} shifts={shifts} />
          </TabsContent>

          <TabsContent value="subjects" className="mt-6">
            <SubjectManagement subjects={subjects} setSubjects={setSubjects} />
          </TabsContent>

          <TabsContent value="teachers" className="mt-6">
            <TeacherManagement teachers={teachers} setTeachers={setTeachers} classes={classes} subjects={subjects} />
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Генериране на Разписание
                </CardTitle>
                <CardDescription>Генерирайте автоматично разписание въз основа на въведените данни</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {percentage < 100 && (
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Незавършена настройка</p>
                      <p className="text-sm text-yellow-700">
                        Моля, завършете всички стъпки преди генериране на разписанието
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-semibold">{shifts.length}</p>
                    <p className="text-sm text-muted-foreground">Смени</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-semibold">{classes.length}</p>
                    <p className="text-sm text-muted-foreground">Паралелки</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="font-semibold">{subjects.length}</p>
                    <p className="text-sm text-muted-foreground">Предмети</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <p className="font-semibold">{teachers.length}</p>
                    <p className="text-sm text-muted-foreground">Учители</p>
                  </div>
                </div>

                <Button
                  onClick={generateSchedule}
                  disabled={percentage < 100 || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Генериране...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Генерирай Разписание
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Преглед на Разписанието
                  </div>
                  {schedule.length > 0 && (
                    <Button onClick={exportToExcel} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Експорт в Excel
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>Прегледайте и експортирайте генерираното разписание</CardDescription>
              </CardHeader>
              <CardContent>
                {schedule.length > 0 ? (
                  <ScheduleViewer schedule={schedule} />
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Няма генерирано разписание</h3>
                    <p className="text-muted-foreground mb-4">Генерирайте разписание от раздела "Генериране"</p>
                    <Button onClick={() => setActiveTab("generate")}>Генерирай Разписание</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
