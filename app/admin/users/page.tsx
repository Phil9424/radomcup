import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, User } from 'lucide-react';
import Link from "next/link";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Проверяем, что пользователь - супер-админ
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!adminUser || adminUser.role !== 'super_admin') {
    redirect("/admin");
  }

  // Получаем всех администраторов
  const { data: allAdmins } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к панели
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2">Управление администраторами</h1>
        <p className="text-muted-foreground">
          Просмотр и управление администраторами Radom Cup
        </p>
      </div>

      <div className="grid gap-4">
        {allAdmins && allAdmins.length > 0 ? (
          allAdmins.map((admin) => (
            <Card key={admin.id} className={!admin.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {admin.role === 'super_admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{admin.full_name}</CardTitle>
                      <CardDescription>{admin.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={admin.role === 'super_admin' ? "default" : "secondary"}>
                      {admin.role === 'super_admin' ? 'Супер-админ' : 'Администратор'}
                    </Badge>
                    <Badge variant={admin.is_active ? "outline" : "destructive"}>
                      {admin.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Зарегистрирован: {new Date(admin.created_at).toLocaleDateString("ru-RU", {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Администраторы не найдены
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
