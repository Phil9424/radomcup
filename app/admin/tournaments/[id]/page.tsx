import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameDayManager } from "@/components/admin/game-day-manager";
import { ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch tournament
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Fetch game days
  const { data: gameDays } = await supabase
    .from("game_days")
    .select("*, matches(*)")
    .eq("tournament_id", id)
    .order("day_number", { ascending: true });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад в админку
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-muted-foreground text-lg">
                {tournament.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-sm">
            {gameDays?.length || 0} игровых дней
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Информация о турнире</CardTitle>
            <CardDescription>Обзор и основные детали</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Дата начала
                </p>
                <p className="text-base">
                  {tournament.start_date
                    ? new Date(tournament.start_date).toLocaleDateString("ru-RU")
                    : "Не указана"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Дата окончания
                </p>
                <p className="text-base">
                  {tournament.end_date
                    ? new Date(tournament.end_date).toLocaleDateString("ru-RU")
                    : "Не указана"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <GameDayManager tournamentId={id} gameDays={gameDays || []} />
      </div>
    </div>
  );
}
