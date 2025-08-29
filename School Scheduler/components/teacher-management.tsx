"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, UserCheck, Mail, Clock, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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

interface TeacherManagementProps {
  teachers: Teacher[]
  setTeachers: (teachers: Teacher[]) => void
  classes: Class[]
  subjects: Subject[]
}

const weekDays = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"]

export default function TeacherManagement({ teachers, setTeachers, classes, subjects }: TeacherManagementProps) {
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    maxHoursPerWeek: 25,
    unavailableDays: [] as string[],
  })
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([])

  const addTeacher = () => {
    if (!newTeacher.name || !newTeacher.email) {
      toast({
        title: "Грешка",
        description: "Моля, попълнете име и имейл",
        variant: "destructive",
      })
      return
    }

    if (newTeacher.maxHoursPerWeek <= 0 || newTeacher.maxHoursPerWeek > 40) {
      toast({
        title: "Грешка",
        description: "Максималните часове трябва да са между 1 и 40",
        variant: "destructive",
      })
      return
    }

    const teacher: Teacher = {
      id: Date.now().toString(),
      name: newTeacher.name,
      email: newTeacher.email,
      maxHoursPerWeek: newTeacher.maxHoursPerWeek,
      unavailableDays: newTeacher.unavailableDays,
      assignments: selectedAssignments,
    }

    setTeachers([...teachers, teacher])
    setNewTeacher({ name: "", email: "", maxHoursPerWeek: 25, unavailableDays: [] })
    setSelectedAssignments([])

    toast({
      title: "Успех",
      description: "Учителят е добавен успешно",
    })
  }

  const removeTeacher = (id: string) => {
    setTeachers(teachers.filter((teacher) => teacher.id !== id))
    toast({
      title: "Успех",
      description: "Учителят е премахнат успешно",
    })
  }

  const toggleUnavailableDay = (day: string) => {
    const updatedDays = newTeacher.unavailableDays.includes(day)
      ? newTeacher.unavailableDays.filter((d) => d !== day)
      : [...newTeacher.unavailableDays, day]

    setNewTeacher({ ...newTeacher, unavailableDays: updatedDays })
  }

  const addAssignment = (classId: string, subjectId: string) => {
    const assignment = { classId, subjectId }
    const exists = selectedAssignments.some((a) => a.classId === classId && a.subjectId === subjectId)

    if (!exists) {
      setSelectedAssignments([...selectedAssignments, assignment])
    }
  }

  const removeAssignment = (classId: string, subjectId: string) => {
    setSelectedAssignments(selectedAssignments.filter((a) => !(a.classId === classId && a.subjectId === subjectId)))
  }

  const getClassName = (classId: string) => {
    const classItem = classes.find((c) => c.id === classId)
    return classItem ? `${classItem.grade}${classItem.name}` : "Неизвестен клас"
  }

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Неизвестен предмет"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добави Нов Учител
          </CardTitle>
          <CardDescription>Създайте учител с назначения към предмети и паралелки</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-name">Име на учителя</Label>
              <Input
                id="teacher-name"
                placeholder="напр. Иван Петров"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-email">Имейл</Label>
              <Input
                id="teacher-email"
                type="email"
                placeholder="ivan.petrov@school.bg"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-hours">Максимални часове седмично</Label>
              <Input
                id="max-hours"
                type="number"
                min="1"
                max="40"
                value={newTeacher.maxHoursPerWeek}
                onChange={(e) =>
                  setNewTeacher({ ...newTeacher, maxHoursPerWeek: Number.parseInt(e.target.value) || 25 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Недостъпни дни</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={newTeacher.unavailableDays.includes(day)}
                    onCheckedChange={() => toggleUnavailableDay(day)}
                  />
                  <Label htmlFor={`day-${day}`} className="text-sm">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Назначения (Предмет + Паралелка)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Изберете паралелка и предмет:</Label>
                <div className="space-y-2 mt-2">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="space-y-1">
                      <p className="text-sm font-medium">
                        {classItem.grade}
                        {classItem.name}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {subjects.map((subject) => (
                          <Button
                            key={`${classItem.id}-${subject.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => addAssignment(classItem.id, subject.id)}
                            disabled={selectedAssignments.some(
                              (a) => a.classId === classItem.id && a.subjectId === subject.id,
                            )}
                          >
                            {subject.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">Избрани назначения:</Label>
                <div className="space-y-2 mt-2">
                  {selectedAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                      <span className="text-sm">
                        {getClassName(assignment.classId)} - {getSubjectName(assignment.subjectId)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAssignment(assignment.classId, assignment.subjectId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {selectedAssignments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Няма избрани назначения</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button onClick={addTeacher} className="w-full" disabled={classes.length === 0 || subjects.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            {classes.length === 0 || subjects.length === 0 ? "Първо добавете паралелки и предмети" : "Добави Учител"}
          </Button>
        </CardContent>
      </Card>

      {teachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Съществуващи Учители ({teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teachers.map((teacher) => (
                <Card key={teacher.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-500" />
                          {teacher.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeacher(teacher.id)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <Badge variant="outline">Макс. {teacher.maxHoursPerWeek} часа седмично</Badge>
                      </div>

                      {teacher.unavailableDays.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Недостъпни дни:</p>
                          <div className="flex flex-wrap gap-1">
                            {teacher.unavailableDays.map((day) => (
                              <Badge key={day} variant="secondary" className="text-xs">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {teacher.assignments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Назначения:</p>
                          <div className="space-y-1">
                            {teacher.assignments.map((assignment, index) => (
                              <div key={index} className="text-xs bg-muted p-1 rounded">
                                {getClassName(assignment.classId)} - {getSubjectName(assignment.subjectId)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {teachers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Няма добавени учители</h3>
            <p className="text-muted-foreground">Добавете поне един учител за да продължите</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
