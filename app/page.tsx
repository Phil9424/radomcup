import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Award, Settings } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let tournamentsCount = 0;
  let playersCount = 0;
  let achievementsCount = 0;
  let recentTournaments: any[] = [];

  try {
    const supabase = await createClient();

    // Fetch stats
    const { count } = await supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true });
    tournamentsCount = count || 0;

    const { count: players } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true });
    playersCount = players || 0;

    const { count: achievements } = await supabase
      .from("achievements")
      .select("*", { count: "exact", head: true });
    achievementsCount = achievements || 0;

    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    recentTournaments = data || [];
  } catch (error) {
    // Если Supabase не настроен, используем значения по умолчанию
    console.error("Ошибка при загрузке данных:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Radom Cup
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">
            Статистика турниров, игроков и достижений
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/tournaments">
              <Button size="lg" className="text-lg shadow-lg hover:shadow-xl transition-shadow">
                <Trophy className="mr-2 h-5 w-5" />
                Смотреть турниры
              </Button>
            </Link>
            <Link href="/players">
              <Button size="lg" variant="outline" className="text-lg shadow-lg hover:shadow-xl transition-shadow">
                <Users className="mr-2 h-5 w-5" />
                Рейтинг игроков
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-16 px-4">
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Турниры</CardTitle>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{tournamentsCount}</div>
              <p className="text-muted-foreground mt-2">Всего турниров</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Игроки</CardTitle>
                <Users className="h-8 w-8 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-secondary">{playersCount}</div>
              <p className="text-muted-foreground mt-2">Зарегистрировано</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:border-accent/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Достижения</CardTitle>
                <Award className="h-8 w-8 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">{achievementsCount}</div>
              <p className="text-muted-foreground mt-2">Доступно наград</p>
            </CardContent>
          </Card>
        </div>

        {recentTournaments && recentTournaments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Последние турниры</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {recentTournaments.map((tournament) => (
                <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle>{tournament.name}</CardTitle>
                      {tournament.description && (
                        <CardDescription className="line-clamp-2">
                          {tournament.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {tournament.start_date 
                          ? new Date(tournament.start_date).toLocaleDateString("ru-RU")
                          : "Дата не указана"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Панель администратора
            </CardTitle>
            <CardDescription className="text-base">
              Управление турнирами и добавление игровых дней
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button>Перейти в админ-панель</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
