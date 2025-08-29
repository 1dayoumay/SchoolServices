"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Users, GraduationCap } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Class {
  id: string
  name: string
  grade: string
  studentsCount: number
  shiftId: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface ClassManagementProps {
  classes: Class[]
  setClasses: (classes: Class[]) => void
  shifts: Shift[]
}

export default function ClassManagement({ classes, setClasses, shifts }: ClassManagementProps) {
  const [newClass, setNewClass] = useState({
    name: "",
    grade: "",
    studentsCount: 25,
    shiftId: "",
  })

  const addClassItem = () => {
    if (!newClass.name || !newClass.grade || !newClass.shiftId) {
      toast({
        title: "Грешка",
        description: "Моля, попълнете всички полета",
        variant: "destructive",
      })
      return
    }

    if (newClass.studentsCount <= 0) {
      toast({
        title: "Грешка",
        description: "Броят ученици трябва да е положително число",
        variant: "destructive",
      })
      return
    }

    const classItem: Class = {
      id: Date.now().toString(),
      name: newClass.name,
      grade: newClass.grade,
      studentsCount: newClass.studentsCount,
      shiftId: newClass.shiftId,
    }

    setClasses([...classes, classItem])
    setNewClass({ name: "", grade: "", studentsCount: 25, shiftId: "" })

    toast({
      title: "Успех",
      description: "Паралелката е добавена успешно",
    })
  }

  const removeClass = (id: string) => {
    setClasses(classes.filter((classItem) => classItem.id !== id))
    toast({
      title: "Успех",
      description: "Паралелката е премахната успешно",
    })
  }

  const getShiftName = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    return shift ? shift.name : "Неизвестна смяна"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добави Нова Паралелка
          </CardTitle>
          <CardDescription>Създайте паралелка с определена смяна и брой ученици</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Име на паралелката</Label>
              <Input
                id="class-name"
                placeholder="напр. А"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-grade">Клас</Label>
              <Input
                id="class-grade"
                placeholder="напр. 5"
                value={newClass.grade}
                onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="students-count">Брой ученици</Label>
              <Input
                id="students-count"
                type="number"
                min="1"
                max="40"
                value={newClass.studentsCount}
                onChange={(e) => setNewClass({ ...newClass, studentsCount: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-select">Смяна</Label>
              <Select value={newClass.shiftId} onValueChange={(value) => setNewClass({ ...newClass, shiftId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете смяна" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addClassItem} className="w-full" disabled={shifts.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            {shifts.length === 0 ? "Първо добавете смяна" : "Добави Паралелка"}
          </Button>
        </CardContent>
      </Card>

      {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Съществуващи Паралелки ({classes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">
                          {classItem.grade}
                          {classItem.name}
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClass(classItem.id)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{classItem.studentsCount} ученици</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Смяна: {getShiftName(classItem.shiftId)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {classes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Няма добавени паралелки</h3>
            <p className="text-muted-foreground">Добавете поне една паралелка за да продължите</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
