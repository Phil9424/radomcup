import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import { User, Trophy, TrendingUp, Calendar, Award, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch player
  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !player) {
    notFound();
  }

  // Fetch player tournament history
  const { data: tournamentStats } = await supabase
    .from("player_match_stats")
    .select(`
      tournament_id,
      points,
      tournaments (
        name,
        start_date
      )
    `)
    .eq("player_id", id);

  // Aggregate by tournament
  const tournamentMap = new Map<string, { name: string; points: number; startDate: string }>();
  
  tournamentStats?.forEach((stat: any) => {
    const tournamentId = stat.tournament_id;
    const current = tournamentMap.get(tournamentId);
    
    if (current) {
      current.points += stat.points;
    } else {
      tournamentMap.set(tournamentId, {
        name: stat.tournaments.name,
        points: stat.points,
        startDate: stat.tournaments.start_date,
      });
    }
  });

  const tournaments = Array.from(tournamentMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Fetch player achievements
  const { data: playerAchievements } = await supabase
    .from("player_achievements")
    .select(`
      earned_at,
      achievements (
        name,
        description,
        icon,
        category
      ),
      tournaments (
        name
      )
    `)
    .eq("player_id", id)
    .order("earned_at", { ascending: false });

  // Calculate player rank
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, total_points")
    .order("total_points", { ascending: false });

  const rank = allPlayers?.findIndex((p) => p.id === id) || 0;

  function formatPoints(points: number): string {
    // Round to 2 decimal places to avoid floating point precision issues
    const rounded = Math.round(points * 100) / 100;
    // Remove trailing zeros after decimal point, but keep at least one digit
    const formatted = rounded.toString().replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="container mx-auto">
          <Link href="/players">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к игрокам
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-6 mb-3">
                <div className="relative">
                  <div className="w-32 h-32 rounded-lg overflow-hidden ring-4 ring-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                    <AvatarWithFallback
                      polemicId={player.polemic_id}
                      name={player.name}
                      className="w-full h-full rounded-none"
                    />
                  </div>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{player.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-lg text-muted-foreground">
                <span>Место #{rank + 1}</span>
                <span>•</span>
                <span>{player.matches_played} матчей</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-2xl px-6 py-3">
              {formatPoints(player.total_points)} очков
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Всего очков</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatPoints(player.total_points)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Матчей сыграно</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {player.matches_played}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Средние очки</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {player.matches_played > 0
                  ? formatPoints(player.total_points / player.matches_played)
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                История турниров
              </CardTitle>
              <CardDescription>
                Результаты во всех турнирах
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournaments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  История турниров пока пуста
                </p>
              ) : (
                <div className="space-y-3">
                  {tournaments.map((tournament) => (
                    <Link 
                      key={tournament.id} 
                      href={`/tournaments/${tournament.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{tournament.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tournament.startDate 
                              ? new Date(tournament.startDate).toLocaleDateString("ru-RU")
                              : "Дата не указана"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {formatPoints(tournament.points)} очков
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Достижения
              </CardTitle>
              <CardDescription>
                Полученные достижения
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!playerAchievements || playerAchievements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Достижения пока не получены
                </p>
              ) : (
                <div className="space-y-3">
                  {playerAchievements.map((achievement: any, index: number) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="text-2xl">{achievement.achievements.icon}</div>
                      <div className="flex-1">
                        <p className="font-medium">{achievement.achievements.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {achievement.achievements.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {achievement.tournaments?.name || 'Общее'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(achievement.earned_at).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
