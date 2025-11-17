"use client";

import { signup } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Link from "next/link";
import { Trophy } from 'lucide-react';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Произошла ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Radom Cup
            </span>
          </Link>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Регистрация администратора</CardTitle>
            <CardDescription>
              Создайте аккаунт для доступа к админ-панели
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Полное имя</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Иван Иванов"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@radomcup.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Уже есть аккаунт?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Войти
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
