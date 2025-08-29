"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, Clock, TrendingUp, Award, BarChart3, UserX } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

interface DashboardStats {
  totalClasses: number
  totalTeachers: number
  totalSubjects: number
  totalScheduledHours: number
  busiestTeacher: {
    name: string
    hours: number
  } | null
  mostTaughtSubject: {
    name: string
    hours: number
  } | null
  averageHoursPerClass: number
  scheduleCompleteness: number
  // Add new absence statistics
  pendingAbsences: number
  teacherWithMostAbsences: {
    name: string
    absences: number
  } | null
  totalAbsencesThisMonth: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [hasActiveSchedule, setHasActiveSchedule] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setHasActiveSchedule(data.hasActiveSchedule)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Табло за Управление</h1>
          <p className="text-muted-foreground">Преглед на вашето училище и статистики</p>
        </div>

        {!hasActiveSchedule ? (
          <Card className="border-dashed border-2">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>Няма активно разписание</CardTitle>
              <CardDescription>
                Създайте и активирайте разписание, за да видите подробни статистики за вашето училище.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <a href="/dashboard/schedule-generator">Създай Разписание</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общо Паралелки</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
                  <p className="text-xs text-muted-foreground">Активни паралелки в училището</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общо Учители</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                  <p className="text-xs text-muted-foreground">Преподаватели в училището</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общо Предмети</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>
                  <p className="text-xs text-muted-foreground">Различни предмети</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Планирани Часове</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalScheduledHours || 0}</div>
                  <p className="text-xs text-muted-foreground">Часове седмично</p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Най-зает Учител
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.busiestTeacher ? (
                    <div>
                      <div className="text-2xl font-bold">{stats.busiestTeacher.name}</div>
                      <p className="text-muted-foreground">{stats.busiestTeacher.hours} часа седмично</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Няма данни</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Най-преподаван Предмет
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.mostTaughtSubject ? (
                    <div>
                      <div className="text-2xl font-bold">{stats.mostTaughtSubject.name}</div>
                      <p className="text-muted-foreground">{stats.mostTaughtSubject.hours} часа седмично</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Няма данни</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Средно Часове на Паралелка</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.averageHoursPerClass?.toFixed(1) || 0}</div>
                  <p className="text-muted-foreground">часа седмично на паралелка</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Завършеност на Разписанието</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.scheduleCompleteness || 0}%</div>
                  <p className="text-muted-foreground">от планираните часове са разпределени</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${stats?.scheduleCompleteness || 0}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Add after existing statistics cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Чакащи Отсъствия
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingAbsences || 0}</div>
                  <p className="text-muted-foreground">заявки за одобрение</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Най-често Отсъстващ Учител
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.teacherWithMostAbsences ? (
                    <div>
                      <div className="text-2xl font-bold">{stats.teacherWithMostAbsences.name}</div>
                      <p className="text-muted-foreground">{stats.teacherWithMostAbsences.absences} отсъствия</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Няма данни</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
