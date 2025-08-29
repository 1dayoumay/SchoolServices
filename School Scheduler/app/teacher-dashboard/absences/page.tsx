"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserX, Plus, Calendar, Clock, AlertTriangle, FileText } from "lucide-react"
import TeacherLayout from "@/components/teacher-layout"

interface Absence {
  id: string
  type: "request" | "immediate"
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  reason: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  responseNote?: string
}

const absenceTypes = [
  { value: "request", label: "Заявка за отсъствие", description: "Планирано отсъствие (изисква одобрение)" },
  { value: "immediate", label: "Спешно отсъствие", description: "Незабавно отсъствие (болест, спешност)" },
]

const statusTypes = [
  { value: "pending", label: "Чакащо", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Одобрено", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Отхвърлено", color: "bg-red-100 text-red-800" },
]

export default function TeacherAbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  const [newAbsence, setNewAbsence] = useState({
    type: "request" as Absence["type"],
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
  })

  useEffect(() => {
    fetchAbsences()
  }, [])

  const fetchAbsences = async () => {
    try {
      const response = await fetch("/api/teacher/absences")
      if (response.ok) {
        const data = await response.json()
        setAbsences(data.absences || [])
      }
    } catch (error) {
      console.error("Error fetching absences:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAbsence = async () => {
    if (!newAbsence.startDate || !newAbsence.reason) {
      alert("Моля въведете дата и причина за отсъствието")
      return
    }

    try {
      const response = await fetch("/api/teacher/absences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAbsence),
      })

      if (response.ok) {
        const data = await response.json()
        setAbsences([data.absence, ...absences])
        setNewAbsence({
          type: "request",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          reason: "",
        })
        setIsCreating(false)
      } else {
        alert("Възникна грешка при създаването на заявката")
      }
    } catch (error) {
      console.error("Error creating absence:", error)
      alert("Възникна грешка при създаването на заявката")
    }
  }

  const filterAbsencesByTab = (absences: Absence[]) => {
    switch (activeTab) {
      case "pending":
        return absences.filter((a) => a.status === "pending")
      case "approved":
        return absences.filter((a) => a.status === "approved")
      case "rejected":
        return absences.filter((a) => a.status === "rejected")
      case "all":
      default:
        return absences
    }
  }

  const getStatusInfo = (status: Absence["status"]) => {
    return statusTypes.find((s) => s.value === status) || statusTypes[0]
  }

  const getAbsenceTypeInfo = (type: Absence["type"]) => {
    return absenceTypes.find((t) => t.value === type) || absenceTypes[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bg-BG")
  }

  const formatTime = (timeString: string) => {
    return timeString ? timeString.slice(0, 5) : ""
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Управление на Отсъствия</h1>
            <p className="text-muted-foreground">Заявявайте отсъствия или докладвайте спешни отсъствия</p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ново Отсъствие
          </Button>
        </div>

        {/* Create Absence Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Създаване на Отсъствие</CardTitle>
              <CardDescription>Изберете типа отсъствие и въведете детайлите</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Тип отсъствие</Label>
                <Select
                  value={newAbsence.type}
                  onValueChange={(value: Absence["type"]) => setNewAbsence({ ...newAbsence, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {absenceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Начална дата *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newAbsence.startDate}
                    onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Крайна дата</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newAbsence.endDate}
                    onChange={(e) => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Начален час (по избор)</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newAbsence.startTime}
                    onChange={(e) => setNewAbsence({ ...newAbsence, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Краен час (по избор)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newAbsence.endTime}
                    onChange={(e) => setNewAbsence({ ...newAbsence, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Причина *</Label>
                <Textarea
                  id="reason"
                  value={newAbsence.reason}
                  onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                  placeholder="Опишете причината за отсъствието..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Отказ
                </Button>
                <Button onClick={handleCreateAbsence}>
                  <Plus className="h-4 w-4 mr-2" />
                  Създай Заявка
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Absences List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Чакащи</TabsTrigger>
            <TabsTrigger value="approved">Одобрени</TabsTrigger>
            <TabsTrigger value="rejected">Отхвърлени</TabsTrigger>
            <TabsTrigger value="all">Всички</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filterAbsencesByTab(absences).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Няма отсъствия</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "pending" && "Няма чакащи заявки за отсъствие"}
                    {activeTab === "approved" && "Няма одобрени отсъствия"}
                    {activeTab === "rejected" && "Няма отхвърлени заявки"}
                    {activeTab === "all" && "Все още няма създадени заявки за отсъствие"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterAbsencesByTab(absences).map((absence) => {
                  const statusInfo = getStatusInfo(absence.status)
                  const typeInfo = getAbsenceTypeInfo(absence.type)

                  return (
                    <Card key={absence.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {absence.type === "immediate" ? (
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                              ) : (
                                <Calendar className="h-5 w-5 text-blue-500" />
                              )}
                              {typeInfo.label}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            Създадено: {formatDate(absence.createdAt)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDate(absence.startDate)}
                              {absence.endDate && absence.endDate !== absence.startDate && (
                                <span> - {formatDate(absence.endDate)}</span>
                              )}
                            </span>
                          </div>

                          {(absence.startTime || absence.endTime) && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {formatTime(absence.startTime || "")}
                                {absence.endTime && <span> - {formatTime(absence.endTime)}</span>}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{absence.reason}</span>
                          </div>
                        </div>

                        {absence.responseNote && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="text-sm font-medium mb-1">Отговор от администрацията:</div>
                            <div className="text-sm text-muted-foreground">{absence.responseNote}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  )
}
