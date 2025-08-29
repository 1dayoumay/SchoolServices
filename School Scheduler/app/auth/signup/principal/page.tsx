"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GraduationCap, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PrincipalSignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Personal info
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // School info
    schoolName: "",
    schoolAddress: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("Паролите не съвпадат")
      return
    }

    if (formData.password.length < 6) {
      alert("Паролата трябва да бъде поне 6 символа")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup/principal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          schoolName: formData.schoolName,
          schoolAddress: formData.schoolAddress,
        }),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        const error = await response.json()
        alert(error.message || "Възникна грешка при регистрацията")
      }
    } catch (error) {
      alert("Възникна грешка при регистрацията")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
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
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Регистрация като Директор</CardTitle>
            <CardDescription>Създайте акаунт и инициализирайте вашето училище</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Лична информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Пълно име</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Иван Петров"
                    />
                  </div>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Парола</Label>
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
                    <Label htmlFor="confirmPassword">Потвърдете паролата</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Повторете паролата"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Информация за училището</h3>
                <div>
                  <Label htmlFor="schoolName">Име на училището</Label>
                  <Input
                    id="schoolName"
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="СОУ 'Христо Ботев'"
                  />
                </div>
                <div>
                  <Label htmlFor="schoolAddress">Адрес на училището</Label>
                  <Textarea
                    id="schoolAddress"
                    required
                    value={formData.schoolAddress}
                    onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                    placeholder="ул. Образование 123, София 1000"
                    rows={3}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Създаване на акаунт..." : "Създай акаунт и училище"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:underline">
                Вече имате акаунт? Влезте тук
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
