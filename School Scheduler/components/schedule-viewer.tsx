"use client"

import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, BookOpen } from "lucide-react"
import { useState, useMemo } from "react"
import type { ScheduleSlot, Class, Subject, Shift } from "@/app/page"

interface ScheduleViewerProps {
  schedules: ScheduleSlot[]
  classes: Class[]
  subjects: Subject[]
  shifts: Shift[]
}

export default function ScheduleViewer({ schedules, classes, subjects, shifts }: ScheduleViewerProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all")

  const days = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]

  const timeSlots = useMemo(() => {
    const allTimes = schedules.map((s) => s.time)
    const uniqueTimes = [...new Set(allTimes)]
    return uniqueTimes.sort((a, b) => a.localeCompare(b))
  }, [schedules])

  const getSubjectColor = (subjectName: string) => {
    return subjects.find((s) => s.name === subjectName)?.color || "#6b7280"
  }

  const getSlotForTime = (classSchedule: ScheduleSlot[], day: string, time: string) => {
    return classSchedule.find((slot) => slot.day === day && slot.time === time)
  }

  const getShiftName = (shiftId: string) => shifts.find((s) => s.id === shiftId)?.name || ""

  if (schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Генерирани Разписания
          </CardTitle>
          <CardDescription>
            Все още няма генерирани разписания. Завършете всички стъпки и кликнете "Генерирай".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Разписанията ще се появят тук след генериране</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderScheduleGrid = (classId: string) => {
    const classSchedule = schedules.filter((s) => s.classId === classId)
    const classTimeSlots = timeSlots.filter((time) => classSchedule.some((s) => s.time === time))

    return (
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
            {classTimeSlots.map((time) => (
              <tr key={time}>
                <td className="border p-2 font-medium text-sm bg-muted/50">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {time}
                  </div>
                </td>
                {days.map((day) => {
                  const slot = getSlotForTime(classSchedule, day, time)
                  return (
                    <td key={day} className="border p-1 h-16 align-top">
                      {slot ? (
                        <div
                          className="p-2 rounded text-white text-xs h-full flex flex-col justify-between"
                          style={{ backgroundColor: getSubjectColor(slot.subject) }}
                        >
                          <div className="font-medium">{slot.subject}</div>
                          <div className="flex items-center gap-1 opacity-90">
                            <User className="h-3 w-3" />
                            <span className="truncate">{slot.teacher}</span>
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
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Генерирани Разписания
          </CardTitle>
          <CardDescription>Разгледайте автоматично генерираните разписания за всички паралелки</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Изберете Паралелка:</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Изберете паралелка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички Паралелки</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} ({getShiftName(classItem.shiftId)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedClass === "all" ? (
        <div className="space-y-6">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {classItem.name} - {classItem.grade}
                </CardTitle>
                <CardDescription>{getShiftName(classItem.shiftId)}</CardDescription>
              </CardHeader>
              <CardContent>{renderScheduleGrid(classItem.id)}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">{renderScheduleGrid(selectedClass)}</CardContent>
        </Card>
      )}
    </div>
  )
}
