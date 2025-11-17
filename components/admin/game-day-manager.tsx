"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Loader2, Trash2 } from 'lucide-react';
import { addGameDayAction, deleteGameDayAction, deleteMatchAction } from "@/app/actions/tournament-actions";

interface GameDay {
  id: string;
  day_number: number;
  created_at: string;
  matches: Array<{ id: string; match_id: number }>;
}

interface GameDayManagerProps {
  tournamentId: string;
  gameDays: GameDay[];
}

export function GameDayManager({ tournamentId, gameDays }: GameDayManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [dayNumber, setDayNumber] = useState((gameDays.length + 1).toString());
  const [matchIds, setMatchIds] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parseStatus, setParseStatus] = useState<string>("");
  const [deletingGameDay, setDeletingGameDay] = useState<string | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<string | null>(null);
  const router = useRouter();

  async function handleAddGameDay(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setParseStatus("Создание игрового дня...");

    try {
      const gameDayId = await addGameDayAction(
        tournamentId,
        parseInt(dayNumber),
        matchIds
      );

      setParseStatus("Парсинг матчей...");

      // Parse matches via API
      const ids = matchIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      const response = await fetch("/api/parse-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameDayId,
          tournamentId,
          matchIds: ids,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось спарсить матчи");
      }

      setParseStatus("Готово!");
      setIsAdding(false);
      setDayNumber((parseInt(dayNumber) + 1).toString());
      setMatchIds("");
      router.refresh();
    } catch (error) {
      console.error("[v0] Failed to add game day:", error);
      setParseStatus("Произошла ошибка");
    } finally {
      setIsLoading(false);
      setTimeout(() => setParseStatus(""), 2000);
    }
  }

  async function handleDeleteGameDay(gameDayId: string) {
    if (!confirm("Вы уверены, что хотите удалить весь игровой день и все его матчи? Это действие нельзя отменить.")) {
      return;
    }

    setDeletingGameDay(gameDayId);
    try {
      await deleteGameDayAction(gameDayId);
      router.refresh();
    } catch (error) {
      console.error("Не удалось удалить игровой день:", error);
      alert("Не удалось удалить игровой день");
    } finally {
      setDeletingGameDay(null);
    }
  }

  async function handleDeleteMatch(matchId: string) {
    if (!confirm("Вы уверены, что хотите удалить этот матч? Это действие нельзя отменить.")) {
      return;
    }

    setDeletingMatch(matchId);
    try {
      await deleteMatchAction(matchId);
      router.refresh();
    } catch (error) {
      console.error("Не удалось удалить матч:", error);
      alert("Не удалось удалить матч");
    } finally {
      setDeletingMatch(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Игровые дни</CardTitle>
            <CardDescription>
              Управление игровыми днями и парсинг результатов матчей
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить игровой день
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <form onSubmit={handleAddGameDay} className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-4">Добавить новый игровой день</h4>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="day_number">Номер дня</Label>
                <Input
                  id="day_number"
                  type="number"
                  min="1"
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="match_ids">
                  ID матчей (через запятую)
                </Label>
                <Input
                  id="match_ids"
                  placeholder="266658, 266659, 266660"
                  value={matchIds}
                  onChange={(e) => setMatchIds(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Введите ID матчей с polemicagame.com через запятую
                </p>
              </div>
              {parseStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{parseStatus}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Обработка..." : "Добавить и спарсить матчи"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </form>
        )}

        {gameDays.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No game days added yet</p>
            <p className="text-sm">Click "Add Game Day" to start</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {gameDays.map((gameDay) => (
              <div
                key={gameDay.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">День {gameDay.day_number}</h4>
                  <p className="text-sm text-muted-foreground">
                    {gameDay.matches.length} матчей спарсено
                  </p>
                  {gameDay.matches.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {gameDay.matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                          <span>Match {match.match_id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMatch(match.id)}
                            disabled={deletingMatch === match.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {gameDay.matches.map((m) => m.match_id).join(", ")}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteGameDay(gameDay.id)}
                    disabled={deletingGameDay === gameDay.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
