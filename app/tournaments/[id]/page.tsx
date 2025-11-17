import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Medal } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GameDayStandings } from "@/components/tournaments/game-day-standings";
import { TournamentFinalStandings } from "@/components/tournaments/tournament-final-standings";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch tournament with game days
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      game_days (
        id,
        day_number,
        created_at,
        matches (
          id,
          match_id,
          match_data
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Sort game days by day number
  const sortedGameDays = tournament.game_days?.sort(
    (a, b) => a.day_number - b.day_number
  ) || [];

  // Fetch tournament standings - get all players who participated in this tournament
  const { data: standings } = await supabase
    .from("player_match_stats")
    .select(`
      player_id,
      points,
      players!inner (name)
    `)
    .eq("tournament_id", id);

  // Aggregate points by player
  const playerPoints = new Map<string, { name: string; points: number; matches: number }>();
  
  standings?.forEach((stat: any) => {
    const playerId = stat.player_id;
    const playerName = stat.players.name;
    const points = stat.points;
    
    if (playerPoints.has(playerId)) {
      const player = playerPoints.get(playerId)!;
      player.points += points;
      player.matches += 1;
    } else {
      playerPoints.set(playerId, { name: playerName, points, matches: 1 });
    }
  });

  const finalStandings = Array.from(playerPoints.values())
    .sort((a, b) => b.points - a.points)
    .map((player, index) => ({ ...player, position: index + 1 }));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="container mx-auto">
          <Link href="/tournaments">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к турнирам
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-10 w-10 text-primary" />
                <h1 className="text-5xl font-bold">{tournament.name}</h1>
              </div>
              {tournament.description && (
                <p className="text-xl text-muted-foreground mb-4">
                  {tournament.description}
                </p>
              )}
              {tournament.start_date && (
                <p className="text-muted-foreground">
                  {new Date(tournament.start_date).toLocaleDateString("ru-RU", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString("ru-RU", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}`}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {sortedGameDays.length} игровых дней
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        {sortedGameDays.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Medal className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">
                Игровые дни пока недоступны
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="final" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto">
              <TabsTrigger value="final" className="gap-2">
                <Trophy className="h-4 w-4" />
                Итоговые результаты
              </TabsTrigger>
              {sortedGameDays.map((gameDay) => (
                <TabsTrigger key={gameDay.id} value={gameDay.id}>
                  День {gameDay.day_number}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="final">
              <TournamentFinalStandings standings={finalStandings} />
            </TabsContent>

            {sortedGameDays.map((gameDay) => (
              <TabsContent key={gameDay.id} value={gameDay.id}>
                <GameDayStandings
                  gameDay={gameDay}
                  tournamentId={id}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
