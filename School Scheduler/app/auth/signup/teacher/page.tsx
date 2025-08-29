"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TeacherSignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.email || !formData.password) {
      setError("Моля попълнете всички полета")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Паролите не съвпадат")
      return
    }

    if (formData.password.length < 6) {
      setError("Паролата трябва да бъде поне 6 символа")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/teacher-dashboard")
      } else {
        setError(data.message || "Възникна грешка при регистрацията")
      }
    } catch (error) {
      setError("Възникна грешка при регистрацията")
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
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Регистрация като Учител</CardTitle>
            <CardDescription>
              Създайте акаунт с вашите лични данни. Системата автоматично ще ви свърже с вашето училище.
            </CardDescription>
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
                <Label htmlFor="name">Пълно име *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Иван Петров"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Въведете точно същото име, което директорът е използвал при създаването на вашия профил
                </p>
              </div>

              <div>
                <Label htmlFor="email">Имейл адрес *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ivan@училище.bg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Използвайте същия имейл, който директорът е въвел за вас
                </p>
              </div>

              <div>
                <Label htmlFor="password">Парола *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Минимум 6 символа"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Потвърдете паролата *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Повторете паролата"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Създаване на акаунт..." : "Създай акаунт"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:underline">
                Вече имате акаунт? Влезте тук
              </Link>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Забележка:</strong> За да се регистрирате като учител, директорът трябва първо да ви добави в
                системата. Ако имате проблеми с регистрацията, свържете се с администрацията на училището.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
