"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface ShiftManagementProps {
  shifts: Shift[]
  setShifts: (shifts: Shift[]) => void
}

export default function ShiftManagement({ shifts, setShifts }: ShiftManagementProps) {
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
  })

  const addShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Грешка",
        description: "Моля, попълнете всички полета",
        variant: "destructive",
      })
      return
    }

    if (newShift.startTime >= newShift.endTime) {
      toast({
        title: "Грешка",
        description: "Началният час трябва да е преди крайния час",
        variant: "destructive",
      })
      return
    }

    const shift: Shift = {
      id: Date.now().toString(),
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
    }

    setShifts([...shifts, shift])
    setNewShift({ name: "", startTime: "", endTime: "" })

    toast({
      title: "Успех",
      description: "Смяната е добавена успешно",
    })
  }

  const removeShift = (id: string) => {
    setShifts(shifts.filter((shift) => shift.id !== id))
    toast({
      title: "Успех",
      description: "Смяната е премахната успешно",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добави Нова Смяна
          </CardTitle>
          <CardDescription>Създайте работна смяна с определено работно време</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift-name">Име на смяната</Label>
              <Input
                id="shift-name"
                placeholder="напр. Сутрешна смяна"
                value={newShift.name}
                onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Начален час</Label>
              <Input
                id="start-time"
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Краен час</Label>
              <Input
                id="end-time"
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addShift} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Добави Смяна
          </Button>
        </CardContent>
      </Card>

      {shifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Съществуващи Смени ({shifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <Card key={shift.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{shift.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShift(shift.id)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {shift.startTime} - {shift.endTime}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Продължителност:{" "}
                        {Math.round(
                          ((new Date(`2000-01-01T${shift.endTime}:00`).getTime() -
                            new Date(`2000-01-01T${shift.startTime}:00`).getTime()) /
                            (1000 * 60 * 60)) *
                            10,
                        ) / 10}{" "}
                        часа
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {shifts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Няма добавени смени</h3>
            <p className="text-muted-foreground">Добавете поне една работна смяна за да продължите</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
