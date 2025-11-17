import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award } from 'lucide-react';

interface Player {
  name: string;
  points: number;
  matches: number;
  position: number;
}

interface TournamentFinalStandingsProps {
  standings: Player[];
}

export function TournamentFinalStandings({ standings }: TournamentFinalStandingsProps) {
  function getPositionIcon(position: number) {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  }

  function formatPoints(points: number): string {
    // Round to 2 decimal places to avoid floating point precision issues
    const rounded = Math.round(points * 100) / 100;
    // Remove trailing zeros after decimal point, but keep at least one digit
    const formatted = rounded.toString().replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  }

  const topThree = standings.slice(0, 3);
  const rest = standings.slice(3);

  return (
    <div className="space-y-6">
      {topThree.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {topThree.map((player, index) => (
            <Card 
              key={player.name} 
              className={`${
                index === 0 
                  ? 'border-yellow-500/50 bg-yellow-500/5' 
                  : index === 1 
                  ? 'border-gray-400/50 bg-gray-400/5' 
                  : 'border-amber-600/50 bg-amber-600/5'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {getPositionIcon(player.position)}
                  <h3 className="text-2xl font-bold mt-2 mb-1">{player.name}</h3>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatPoints(player.points)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {player.matches} матчей сыграно
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Финальные результаты турнира</CardTitle>
          <CardDescription>
            Полная таблица результатов всех участников
          </CardDescription>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Результаты пока недоступны
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Поз</TableHead>
                  <TableHead>Игрок</TableHead>
                  <TableHead className="text-right">Матчи</TableHead>
                  <TableHead className="text-right">Очки</TableHead>
                  <TableHead className="text-right">Сред</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((player) => (
                  <TableRow key={player.name} className={player.position <= 3 ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPositionIcon(player.position)}
                        <span className="font-semibold">{player.position}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.matches}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-semibold">
                        {formatPoints(player.points)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPoints(Number((player.points / player.matches).toFixed(1)))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
