import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { PlayersTable } from "./players-table";

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  let playersWithWins: any[] = [];

  try {
    const supabase = await createClient();

    // Fetch all players with their stats
    const { data: players } = await supabase
      .from("players")
      .select("*");

    // Calculate tournament wins by counting victory = true records per player
    const { data: victoryStats } = await supabase
      .from("player_match_stats")
      .select("player_id, victory");

    // Count victories per player
    const tournamentWinsMap = new Map<string, number>();

    victoryStats?.forEach((stat: any) => {
      if (stat.victory) {
        const playerId = stat.player_id;
        const currentWins = tournamentWinsMap.get(playerId) || 0;
        tournamentWinsMap.set(playerId, currentWins + 1);
      }
    });

    // Prepare players data with wins
    playersWithWins = players?.map(player => ({
      ...player,
      wins: tournamentWinsMap.get(player.id) || 0
    })) || [];
  } catch (error) {
    console.error("Ошибка при загрузке данных игроков:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold">Таблица лидеров игроков</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Рейтинг на основе общего количества очков во всех турнирах - сортируйте, кликая по заголовкам столбцов
          </p>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        {!playersWithWins || playersWithWins.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">
                Игроки пока не зарегистрированы
              </p>
            </CardContent>
          </Card>
        ) : (
          <PlayersTable players={playersWithWins} />
        )}
      </div>
    </div>
  );
}
