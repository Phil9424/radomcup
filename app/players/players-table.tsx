'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import { Trophy, Medal, Award, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from "next/link";
import { useState, useMemo } from "react";

interface Player {
  id: string;
  name: string;
  total_points: number;
  matches_played: number;
  polemic_id?: number | null;
  wins: number;
}

interface PlayersTableProps {
  players: Player[];
}

type SortField = 'name' | 'matches_played' | 'total_points' | 'avg_points' | 'wins';
type SortDirection = 'asc' | 'desc' | null;

export function PlayersTable({ players }: PlayersTableProps) {
  const [sortField, setSortField] = useState<SortField>('total_points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      if (!sortField || !sortDirection) return 0;

      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'matches_played':
          aValue = a.matches_played;
          bValue = b.matches_played;
          break;
        case 'total_points':
          aValue = a.total_points;
          bValue = b.total_points;
          break;
        case 'avg_points':
          aValue = a.matches_played > 0 ? a.total_points / a.matches_played : 0;
          bValue = b.matches_played > 0 ? b.total_points / b.matches_played : 0;
          break;
        case 'wins':
          aValue = a.wins;
          bValue = b.wins;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [players, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: desc -> asc -> null -> desc
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortField('total_points'); // Reset to default
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  function getPositionIcon(position: number) {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  }

  function formatPoints(points: number): string {
    const rounded = Math.round(points * 100) / 100;
    const formatted = rounded.toString().replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Все игроки</CardTitle>
        <CardDescription>
          Полная таблица лидеров - кликайте по заголовкам столбцов для сортировки. Топ-3 игрока выделены.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ранг</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-primary font-medium"
                >
                  Игрок
                  {getSortIcon('name')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('matches_played')}
                  className="flex items-center hover:text-primary font-medium ml-auto"
                >
                  Матчи
                  {getSortIcon('matches_played')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('total_points')}
                  className="flex items-center hover:text-primary font-medium ml-auto"
                >
                  Всего очков
                  {getSortIcon('total_points')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('avg_points')}
                  className="flex items-center hover:text-primary font-medium ml-auto"
                >
                  Средние очки
                  {getSortIcon('avg_points')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('wins')}
                  className="flex items-center hover:text-primary font-medium ml-auto"
                >
                  Кол-во побед
                  {getSortIcon('wins')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player, index) => (
              <TableRow
                key={player.id}
                className={`${index < 3 ? 'bg-muted/50' : ''} hover:bg-muted/70 cursor-pointer`}
              >
                <TableCell>
                  <Link href={`/players/${player.id}`} className="flex items-center gap-2">
                    {getPositionIcon(index + 1)}
                    <span className="font-semibold">{index + 1}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/players/${player.id}`} className="flex items-center gap-3 font-medium hover:text-primary">
                    <AvatarWithFallback
                      polemicId={player.polemic_id}
                      name={player.name}
                      className="h-8 w-8"
                    />
                    <span>{player.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {player.matches_played}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-semibold">
                    {formatPoints(player.total_points)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {player.matches_played > 0
                    ? formatPoints(player.total_points / player.matches_played)
                    : '0'}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="font-semibold">
                    {player.wins}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
