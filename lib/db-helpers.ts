import { createClient } from "@/lib/supabase/server";
import { parseMatch } from "@/lib/match-parser";

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface GameDay {
  id: string;
  tournament_id: string;
  day_number: number;
  created_at: string;
}

export async function createTournament(
  name: string,
  description?: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      description,
      start_date: startDate,
      end_date: endDate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addGameDay(tournamentId: string, dayNumber: number, matchIds: number[]) {
  const supabase = await createClient();
  
  // Create game day
  const { data: gameDay, error: gameDayError } = await supabase
    .from("game_days")
    .insert({
      tournament_id: tournamentId,
      day_number: dayNumber,
    })
    .select()
    .single();

  if (gameDayError) throw gameDayError;

  // Parse and store each match
  for (const matchId of matchIds) {
    const matchData = await parseMatch(matchId);
    
    if (!matchData) {
      console.error(`[v0] Failed to parse match ${matchId}`);
      continue;
    }

    // Store match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        game_day_id: gameDay.id,
        match_id: matchId,
        match_data: matchData.rawData,
      })
      .select()
      .single();

    if (matchError) {
      console.error(`[v0] Failed to store match ${matchId}:`, matchError);
      continue;
    }

    // Process players and stats
    for (const player of matchData.players) {
      // Upsert player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .upsert(
          {
            name: player.name,
          },
          {
            onConflict: "name",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (playerError) {
        console.error(`[v0] Failed to upsert player ${player.name}:`, playerError);
        continue;
      }

      // Store player match stats
      await supabase.from("player_match_stats").insert({
        player_id: playerData.id,
        match_id: match.id,
        game_day_id: gameDay.id,
        tournament_id: tournamentId,
        points: player.points,
        position: player.position,
      });

      // Update player total points and matches played
      await supabase.rpc("update_player_stats", {
        p_player_id: playerData.id,
        p_points: player.points,
      });
    }
  }

  return gameDay;
}

export async function getTournamentStandings(tournamentId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("player_match_stats")
    .select(`
      player_id,
      players (name),
      points
    `)
    .eq("tournament_id", tournamentId);

  if (error) throw error;

  // Aggregate points by player
  const standings = new Map<string, { name: string; points: number }>();
  
  data.forEach((stat: any) => {
    const playerId = stat.player_id;
    const playerName = stat.players.name;
    const points = stat.points;
    
    if (standings.has(playerId)) {
      standings.get(playerId)!.points += points;
    } else {
      standings.set(playerId, { name: playerName, points });
    }
  });

  return Array.from(standings.values())
    .sort((a, b) => b.points - a.points);
}
