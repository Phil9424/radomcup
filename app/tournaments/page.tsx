import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from 'lucide-react';
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TournamentsPage() {
  let tournaments: any[] = [];

  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("tournaments")
      .select(`
        *,
        game_days (id)
      `)
      .order("created_at", { ascending: false });
    
    tournaments = data || [];
  } catch (error) {
    console.error("Ошибка при загрузке турниров:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold">Турниры</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Просмотр всех результатов и рейтингов турниров
          </p>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        {!tournaments || tournaments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">
                Турниры пока недоступны
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-2xl line-clamp-2">
                        {tournament.name}
                      </CardTitle>
                      <Badge variant="secondary">
                        {tournament.game_days?.length || 0} дней
                      </Badge>
                    </div>
                    {tournament.description && (
                      <CardDescription className="line-clamp-2">
                        {tournament.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {tournament.start_date ? (
                        <span>
                          {new Date(tournament.start_date).toLocaleDateString("ru-RU", {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span>Дата не указана</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
