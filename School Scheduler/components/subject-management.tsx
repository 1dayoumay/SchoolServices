"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, BookOpen } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Subject {
  id: string
  name: string
  hoursPerWeek: number
  color: string
}

interface SubjectManagementProps {
  subjects: Subject[]
  setSubjects: (subjects: Subject[]) => void
}

const predefinedColors = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
]

export default function SubjectManagement({ subjects, setSubjects }: SubjectManagementProps) {
  const [newSubject, setNewSubject] = useState({
    name: "",
    hoursPerWeek: 1,
    color: predefinedColors[0],
  })

  const addSubject = () => {
    if (!newSubject.name) {
      toast({
        title: "Грешка",
        description: "Моля, въведете име на предмета",
        variant: "destructive",
      })
      return
    }

    if (newSubject.hoursPerWeek <= 0 || newSubject.hoursPerWeek > 10) {
      toast({
        title: "Грешка",
        description: "Часовете седмично трябва да са между 1 и 10",
        variant: "destructive",
      })
      return
    }

    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.name,
      hoursPerWeek: newSubject.hoursPerWeek,
      color: newSubject.color,
    }

    setSubjects([...subjects, subject])
    setNewSubject({
      name: "",
      hoursPerWeek: 1,
      color: predefinedColors[subjects.length % predefinedColors.length],
    })

    toast({
      title: "Успех",
      description: "Предметът е добавен успешно",
    })
  }

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((subject) => subject.id !== id))
    toast({
      title: "Успех",
      description: "Предметът е премахнат успешно",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добави Нов Предмет
          </CardTitle>
          <CardDescription>Създайте учебен предмет с определен брой часове седмично</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Име на предмета</Label>
              <Input
                id="subject-name"
                placeholder="напр. Математика"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours-per-week">Часове седмично</Label>
              <Input
                id="hours-per-week"
                type="number"
                min="1"
                max="10"
                value={newSubject.hoursPerWeek}
                onChange={(e) => setNewSubject({ ...newSubject, hoursPerWeek: Number.parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-color">Цвят</Label>
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      newSubject.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewSubject({ ...newSubject, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <Button onClick={addSubject} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Добави Предмет
          </Button>
        </CardContent>
      </Card>

      {subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Съществуващи Предмети ({subjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                        <h3 className="font-semibold">{subject.name}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(subject.id)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">
                        {subject.hoursPerWeek} час{subject.hoursPerWeek !== 1 ? "а" : ""} седмично
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Няма добавени предмети</h3>
            <p className="text-muted-foreground">Добавете поне един предмет за да продължите</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
