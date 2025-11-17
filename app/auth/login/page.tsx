"use client";

import { login, resetPassword } from "@/app/actions/auth-actions";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import Link from "next/link";
import { Trophy, Mail } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Произошла ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    const formData = new FormData();
    formData.append('email', resetEmail);

    try {
      const result = await resetPassword(formData);
      if (result?.error) {
        setResetError(result.error);
      } else {
        setResetSuccess(true);
        setResetEmail('');
        setTimeout(() => {
          setResetDialogOpen(false);
          setResetSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setResetError("Произошла ошибка при отправке письма");
    } finally {
      setResetLoading(false);
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
            <CardTitle className="text-2xl">Вход для администраторов</CardTitle>
            <CardDescription>
              Введите свои учетные данные для доступа к админ-панели
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleLogin}>
              <div className="flex flex-col gap-6">
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
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setResetDialogOpen(true)}
                    className="text-primary hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Нет аккаунта?{" "}
                  <Link href="/auth/signup" className="text-primary hover:underline">
                    Регистрация
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Модальное окно сброса пароля */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Сброс пароля
              </DialogTitle>
              <DialogDescription>
                Введите ваш email адрес. Мы отправим вам ссылку для сброса пароля.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword}>
              <div className="grid gap-4 py-4">
                {resetSuccess ? (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      ✅ Письмо отправлено! Проверьте вашу почту.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@radomcup.com"
                        required
                      />
                    </div>
                    {resetError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive">
                        <p className="text-sm text-destructive">{resetError}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                {!resetSuccess && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetDialogOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button type="submit" disabled={resetLoading}>
                      {resetLoading ? "Отправка..." : "Отправить"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
