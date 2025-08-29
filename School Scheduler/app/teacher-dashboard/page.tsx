"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, BookOpen, AlertCircle } from "lucide-react"
import TeacherLayout from "@/components/teacher-layout"

interface TeacherSchedule {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  className: string
  classId: string
}

interface TeacherInfo {
  id: number
  name: string
  email: string
  maxHoursPerWeek: number
  totalWeeklyHours: number
}

export default function TeacherDashboardPage() {
  const [schedule, setSchedule] = useState<TeacherSchedule[]>([])
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [todaySchedule, setTodaySchedule] = useState<TeacherSchedule[]>([])

  const days = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]

  useEffect(() => {
    fetchTeacherData()
  }, [])

  useEffect(() => {
    if (schedule.length > 0) {
      const today = new Date().toLocaleDateString("bg-BG", { weekday: "long" })
      const todayClasses = schedule.filter((s) => s.day === today)
      setTodaySchedule(todayClasses)
    }
  }, [schedule])

  const fetchTeacherData = async () => {
    try {
      const [scheduleRes, infoRes] = await Promise.all([fetch("/api/teacher/schedule"), fetch("/api/teacher/info")])

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json()
        setSchedule(scheduleData.schedule || [])
      }

      if (infoRes.ok) {
        const infoData = await infoRes.json()
        setTeacherInfo(infoData.teacher)
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeSlots = () => {
    const times = schedule.map((s) => s.startTime)
    return [...new Set(times)].sort()
  }

  const getClassForTimeAndDay = (day: string, time: string) => {
    return schedule.find((s) => s.day === day && s.startTime === time)
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Моето Табло</h1>
          <p className="text-muted-foreground">Преглед на вашето разписание и информация</p>
        </div>

        {/* Teacher Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Седмични Часове</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teacherInfo?.totalWeeklyHours || 0}/{teacherInfo?.maxHoursPerWeek || 0}
              </div>
              <p className="text-xs text-muted-foreground">Текущи/Максимални часове</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Днешни Часове</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySchedule.length}</div>
              <p className="text-xs text-muted-foreground">Часове днес</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Различни Паралелки</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(schedule.map((s) => s.classId)).size}</div>
              <p className="text-xs text-muted-foreground">Паралелки, които преподавате</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        {todaySchedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Днешно Разписание
              </CardTitle>
              <CardDescription>Вашите часове за днес</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaySchedule
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((classItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <BookOpen className="h-4 w-4" />
                          {classItem.subject}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {classItem.className}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Седмично Разписание
            </CardTitle>
            <CardDescription>Вашето пълно разписание за седмицата</CardDescription>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Няма разписание за показване</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted font-medium text-left w-28">Час</th>
                      {days.map((day) => (
                        <th key={day} className="border p-2 bg-muted font-medium text-center min-w-32">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getTimeSlots().map((time) => (
                      <tr key={time}>
                        <td className="border p-2 font-medium text-sm bg-muted/50">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(time)}
                          </div>
                        </td>
                        {days.map((day) => {
                          const classItem = getClassForTimeAndDay(day, time)
                          return (
                            <td key={day} className="border p-1 h-16 align-top">
                              {classItem ? (
                                <div className="p-2 rounded bg-blue-100 text-blue-800 text-xs h-full flex flex-col justify-between">
                                  <div className="font-medium">{classItem.subject}</div>
                                  <div className="flex items-center gap-1 opacity-90">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{classItem.className}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full"></div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
