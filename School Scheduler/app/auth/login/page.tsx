"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, AlertCircle, GraduationCap, User, BookOpen } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const role = searchParams.get("role")

  const getRoleInfo = () => {
    switch (role) {
      case "principal":
        return {
          title: "Влизане като Директор",
          icon: GraduationCap,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        }
      case "teacher":
        return {
          title: "Влизане като Учител",
          icon: User,
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      case "student":
        return {
          title: "Влизане като Ученик",
          icon: BookOpen,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        }
      default:
        return {
          title: "Влизане в системата",
          icon: User,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        }
    }
  }

  const roleInfo = getRoleInfo()
  const RoleIcon = roleInfo.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect based on role
        if (data.role === "principal") {
          router.push("/dashboard")
        } else if (data.role === "teacher") {
          router.push("/teacher-dashboard")
        } else if (data.role === "student") {
          router.push("/student-dashboard")
        }
      } else {
        setError(data.message || "Невалиден имейл или парола")
      }
    } catch (error) {
      setError("Възникна грешка при влизането")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/auth/role-select"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад към избор на роля
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto w-16 h-16 ${roleInfo.bgColor} rounded-full flex items-center justify-center mb-4`}>
              <RoleIcon className={`h-8 w-8 ${roleInfo.color}`} />
            </div>
            <CardTitle className="text-2xl">{roleInfo.title}</CardTitle>
            <CardDescription>Въведете вашите данни за достъп</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Имейл адрес</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ivan@училище.bg"
                />
              </div>
              <div>
                <Label htmlFor="password">Парола</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Вашата парола"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Влизане..." : "Влез"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:underline block">
                Забравена парола?
              </Link>
              <div className="text-sm text-muted-foreground">
                Нямате акаунт?{" "}
                {role === "principal" && (
                  <Link href="/auth/signup/principal" className="text-blue-600 hover:underline">
                    Регистрирайте се като директор
                  </Link>
                )}
                {role === "teacher" && (
                  <Link href="/auth/signup/teacher" className="text-green-600 hover:underline">
                    Регистрирайте се като учител
                  </Link>
                )}
                {!role && (
                  <Link href="/auth/role-select" className="text-primary hover:underline">
                    Изберете роля
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
