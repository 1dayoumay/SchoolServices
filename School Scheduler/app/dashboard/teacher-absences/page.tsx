"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserX,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  User,
  MessageSquare,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

interface TeacherAbsence {
  id: string
  teacherName: string
  teacherId: string
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

const statusTypes = [
  { value: "pending", label: "Чакащо", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Одобрено", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Отхвърлено", color: "bg-red-100 text-red-800" },
]

const absenceTypes = [
  { value: "request", label: "Заявка за отсъствие" },
  { value: "immediate", label: "Спешно отсъствие" },
]

export default function TeacherAbsencesPage() {
  const [absences, setAbsences] = useState<TeacherAbsence[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState("")

  useEffect(() => {
    fetchAbsences()
  }, [])

  const fetchAbsences = async () => {
    try {
      const response = await fetch("/api/admin/teacher-absences")
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

  const handleRespondToAbsence = async (absenceId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/admin/teacher-absences/${absenceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          responseNote,
        }),
      })

      if (response.ok) {
        setAbsences(
          absences.map((a) =>
            a.id === absenceId
              ? {
                  ...a,
                  status,
                  responseNote,
                }
              : a,
          ),
        )
        setRespondingTo(null)
        setResponseNote("")
      } else {
        alert("Възникна грешка при отговора на заявката")
      }
    } catch (error) {
      console.error("Error responding to absence:", error)
      alert("Възникна грешка при отговора на заявката")
    }
  }

  const filterAbsencesByTab = (absences: TeacherAbsence[]) => {
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

  const getStatusInfo = (status: TeacherAbsence["status"]) => {
    return statusTypes.find((s) => s.value === status) || statusTypes[0]
  }

  const getAbsenceTypeInfo = (type: TeacherAbsence["type"]) => {
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Отсъствия на Учители</h1>
          <p className="text-muted-foreground">Управлявайте заявките за отсъствие и спешните отсъствия на учителите</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Чакащи Заявки</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absences.filter((a) => a.status === "pending").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Одобрени</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absences.filter((a) => a.status === "approved").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Отхвърлени</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absences.filter((a) => a.status === "rejected").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общо Заявки</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absences.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Absences List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Чакащи ({absences.filter((a) => a.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="approved">Одобрени</TabsTrigger>
            <TabsTrigger value="rejected">Отхвърлени</TabsTrigger>
            <TabsTrigger value="all">Всички</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filterAbsencesByTab(absences).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Няма заявки</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "pending" && "Няма чакащи заявки за отсъствие"}
                    {activeTab === "approved" && "Няма одобрени отсъствия"}
                    {activeTab === "rejected" && "Няма отхвърлени заявки"}
                    {activeTab === "all" && "Все още няма заявки за отсъствие"}
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
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                {absence.teacherName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {formatDate(absence.createdAt)}
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
                            <div className="text-sm font-medium mb-1">Вашия отговор:</div>
                            <div className="text-sm text-muted-foreground">{absence.responseNote}</div>
                          </div>
                        )}

                        {absence.status === "pending" && (
                          <div className="space-y-3 pt-3 border-t">
                            {respondingTo === absence.id ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium">Отговор (по избор):</label>
                                  <Textarea
                                    value={responseNote}
                                    onChange={(e) => setResponseNote(e.target.value)}
                                    placeholder="Добавете коментар към решението..."
                                    rows={2}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleRespondToAbsence(absence.id, "approved")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Одобри
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRespondToAbsence(absence.id, "rejected")}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Отхвърли
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRespondingTo(null)
                                      setResponseNote("")
                                    }}
                                  >
                                    Отказ
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" onClick={() => setRespondingTo(absence.id)}>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Отговори
                              </Button>
                            )}
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
    </DashboardLayout>
  )
}
