"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users } from "lucide-react"
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

export default function TeacherSchedulePage() {
  const [schedule, setSchedule] = useState<TeacherSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const days = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const response = await fetch("/api/teacher/schedule")
      if (response.ok) {
        const data = await response.json()
        setSchedule(data.schedule || [])
      }
    } catch (error) {
      console.error("Error fetching schedule:", error)
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

  const getScheduleByDay = (day: string) => {
    return schedule.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
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
          <h1 className="text-3xl font-bold">Моето Разписание</h1>
          <p className="text-muted-foreground">Детайлен преглед на вашето седмично разписание</p>
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Седмично Разписание
            </CardTitle>
            <CardDescription>Вашите часове за всеки ден от седмицата</CardDescription>
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
                        <th key={day} className="border p-2 bg-muted font-medium text-center min-w-40">
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
                            <td key={day} className="border p-1 h-20 align-top">
                              {classItem ? (
                                <div className="p-2 rounded bg-blue-100 text-blue-800 text-xs h-full flex flex-col justify-between">
                                  <div className="font-medium text-sm">{classItem.subject}</div>
                                  <div className="flex items-center gap-1 opacity-90">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{classItem.className}</span>
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
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

        {/* Daily Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {days.map((day) => {
            const daySchedule = getScheduleByDay(day)
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-lg">{day}</CardTitle>
                  <CardDescription>{daySchedule.length} часа</CardDescription>
                </CardHeader>
                <CardContent>
                  {daySchedule.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Няма часове</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedule.map((classItem, index) => (
                        <div key={index} className="p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{classItem.subject}</span>
                            <Badge variant="outline" className="text-xs">
                              {classItem.className}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </TeacherLayout>
  )
}
