"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { deleteTournamentAction } from "@/app/actions/tournament-actions";
import { CreateTournamentDialog } from "@/components/admin/create-tournament-dialog";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface TournamentListProps {
  tournaments: Tournament[];
}

export function TournamentList({ tournaments }: TournamentListProps) {
  async function handleDeleteTournament(tournamentId: string, tournamentName: string) {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This will permanently remove all matches, game days, and player statistics. This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTournamentAction(tournamentId);
      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error("Не удалось удалить турнир:", error);
      alert("Не удалось удалить турнир");
    }
  }

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Турниры</CardTitle>
              <CardDescription>
                Управление турнирами и игровыми днями
              </CardDescription>
            </div>
            <CreateTournamentDialog />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Турниры пока не созданы</p>
          <p className="text-sm text-muted-foreground">
            Создайте свой первый турнир для начала
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Турниры</h2>
          <p className="text-muted-foreground">
            Управление турнирами и игровыми днями
          </p>
        </div>
        <CreateTournamentDialog />
      </div>
      <div className="grid gap-4">
      {tournaments.map((tournament) => (
        <Card key={tournament.id} className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{tournament.name}</CardTitle>
                {tournament.description && (
                  <CardDescription className="text-base">
                    {tournament.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="secondary">Активный</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {tournament.start_date
                      ? new Date(tournament.start_date).toLocaleDateString("ru-RU")
                      : "Не указано"}
                  </span>
                </div>
                <span>-</span>
                <span>
                  {tournament.end_date
                    ? new Date(tournament.end_date).toLocaleDateString("ru-RU")
                    : "Не указано"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </Button>
                <Link href={`/admin/tournaments/${tournament.id}`}>
                  <Button>
                    Управлять
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
