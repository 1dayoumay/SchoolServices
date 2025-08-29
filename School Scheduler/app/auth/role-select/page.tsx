"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, User, BookOpen } from "lucide-react"
import Link from "next/link"

export default function RoleSelectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Добре дошли в Училищната Система</h1>
          <p className="text-muted-foreground">Изберете вашата роля, за да продължите</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Директор</CardTitle>
              <CardDescription>
                Управлявайте цялото училище, създавайте разписания и управлявайте учители
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup/principal">
                <Button className="w-full">Регистрация като Директор</Button>
              </Link>
              <div className="mt-2 text-center">
                <Link href="/auth/login?role=principal" className="text-sm text-muted-foreground hover:underline">
                  Вече имате акаунт? Влезте
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Учител</CardTitle>
              <CardDescription>Преглеждайте вашите разписания и управлявайте класовете си</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup/teacher">
                <Button className="w-full">Регистрация като Учител</Button>
              </Link>
              <div className="mt-2 text-center">
                <Link href="/auth/login?role=teacher" className="text-sm text-muted-foreground hover:underline">
                  Вече имате акаунт? Влезте
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Ученик</CardTitle>
              <CardDescription>Преглеждайте вашето разписание и училищна информация</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Скоро (Ученик)
              </Button>
              <div className="mt-2 text-center">
                <span className="text-sm text-muted-foreground">Функционалността ще бъде добавена скоро</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
