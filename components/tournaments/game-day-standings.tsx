import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gamepad2 } from 'lucide-react';

interface GameDay {
  id: string;
  day_number: number;
  created_at: string;
  matches: Array<{
    id: string;
    match_id: number;
    match_data: any;
  }>;
}


interface GameDayStandingsProps {
  gameDay: GameDay;
  tournamentId: string;
}

export async function GameDayStandings({ gameDay, tournamentId }: GameDayStandingsProps) {
  const supabase = await createClient();

  // Fetch stats for this game day - get all players who played on this day
  const { data: stats } = await supabase
    .from("player_match_stats")
    .select(`
      player_id,
      points,
      position,
      players!inner (name)
    `)
    .eq("game_day_id", gameDay.id);

  // Aggregate points by player for this day
  const playerPoints = new Map<string, { name: string; points: number; bestPosition: number }>();

  stats?.forEach((stat: any) => {
    const playerId = stat.player_id;
    const playerName = stat.players.name;
    const points = stat.points;
    const position = stat.position || 0;

    if (playerPoints.has(playerId)) {
      const player = playerPoints.get(playerId)!;
      player.points += points;
      player.bestPosition = Math.min(player.bestPosition, position);
    } else {
      playerPoints.set(playerId, { name: playerName, points, bestPosition: position });
    }
  });

  // Get all players who played on this game day with their match details
  const { data: allMatchStats } = await supabase
    .from("player_match_stats")
    .select(`
      player_id,
      match_id,
      points,
      position,
      players!inner (name),
      matches!inner (match_id, match_data)
    `)
    .eq("game_day_id", gameDay.id);

  // Group by player and match
  const playerMatchMap = new Map<string, Map<number, { points: number; position: number; role: string }>>();
  const matchDataMap = new Map<number, any>();

  allMatchStats?.forEach((stat: any) => {
    const playerName = stat.players.name;
    const matchId = stat.matches.match_id;
    const points = stat.points;
    const position = stat.position;

    // Get role from match data
    if (!matchDataMap.has(matchId)) {
      matchDataMap.set(matchId, stat.matches.match_data);
    }

    const gameData = stat.matches.match_data;
    let role = 'civilian';
    if (gameData?.players) {
      const playerData = gameData.players.find((p: any) => p.username === playerName);
      if (playerData) {
        role = playerData.role?.type || 'civilian';
      }
    }

    if (!playerMatchMap.has(playerName)) {
      playerMatchMap.set(playerName, new Map());
    }

    playerMatchMap.get(playerName)!.set(matchId, {
      points,
      position,
      role
    });
  });

  // Create player-game matrix
  const matchIds = gameDay.matches.map(m => m.match_id).sort((a, b) => a - b);
  const playerGameData = Array.from(playerMatchMap.entries())
    .map(([playerName, matchStats]) => {
      const games = matchIds.map(matchId => {
        const stat = matchStats.get(matchId);
        return stat ? {
          points: stat.points,
          role: stat.role,
          position: stat.position
        } : null;
      });

      const totalPoints = games.reduce((sum, game) => sum + (game?.points || 0), 0);

      return {
        name: playerName,
        games,
        totalPoints
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);


  function getRoleColor(role: string) {
    switch (role) {
      case 'godfather':
        return 'bg-gray-600'; // Дон - темнее серого
      case 'mafia':
        return 'bg-gray-300'; // Мафия - светло-серый
      case 'sheriff':
        return 'bg-yellow-400'; // Шериф - желто-оранжевый
      case 'civilian':
      default:
        return 'bg-transparent'; // Мирный - прозрачный
    }
  }

  function formatPoints(points: number): string {
    // Round to 2 decimal places to avoid floating point precision issues
    const rounded = Math.round(points * 100) / 100;
    // Remove trailing zeros after decimal point, but keep at least one digit
    const formatted = rounded.toString().replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">День {gameDay.day_number}</CardTitle>
          <CardDescription>
            {matchIds.length} матчей сыграно в этот день
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Матчи дня ({matchIds.length})
            </h3>

            <div>
              {playerGameData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Матчи для этого дня недоступны
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Игрок</TableHead>
                        {matchIds.map((matchId, index) => (
                          <TableHead key={matchId} className="text-center font-semibold">
                            Игра {index + 1}
                          </TableHead>
                        ))}
                        <TableHead className="text-right font-semibold">Итого</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerGameData.map((player) => (
                        <TableRow key={player.name}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          {player.games.map((game, gameIndex) => (
                            <TableCell key={gameIndex} className="text-center">
                              {game ? (
                                <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium text-black ${getRoleColor(game.role)}`}>
                                  {formatPoints(game.points)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-semibold">
                            <Badge variant="secondary">{formatPoints(player.totalPoints)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-transparent border border-gray-300 rounded"></div>
                      <span>Мирный</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      <span>Мафия</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-600 rounded"></div>
                      <span>Дон</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                      <span>Шериф</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
