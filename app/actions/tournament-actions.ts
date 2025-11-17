"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTournamentAction(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;

  const { error } = await supabase.from("tournaments").insert({
    name,
    description: description || null,
    start_date: startDate || null,
    end_date: endDate || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin", "max");
}

export async function addGameDayAction(
  tournamentId: string,
  dayNumber: number,
  matchIds: string
) {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Parse match IDs from comma-separated string
  const ids = matchIds
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id));

  console.log("Parsed match IDs:", ids);

  if (ids.length === 0) {
    throw new Error("No valid match IDs provided");
  }

  // Check if game day already exists for this tournament and day number
  console.log("Checking if game day exists for tournament:", tournamentId, "day:", dayNumber);
  const { data: existingGameDay } = await supabase
    .from("game_days")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("day_number", dayNumber)
    .single();

  let gameDay;
  if (existingGameDay) {
    console.log("Using existing game day:", existingGameDay);
    gameDay = existingGameDay;
  } else {
    // Create new game day
    console.log("Creating new game day with tournament_id:", tournamentId);
    const { data: newGameDay, error: gameDayError } = await supabase
      .from("game_days")
      .insert({
        tournament_id: tournamentId,
        day_number: dayNumber,
      })
      .select()
      .single();

    if (gameDayError) {
      console.error("Game day creation error:", gameDayError);
      throw new Error(gameDayError.message);
    }

    console.log("Created new game day:", newGameDay);
    gameDay = newGameDay;
  }

  revalidatePath(`/admin/tournaments/${tournamentId}`, "max");

  return gameDay.id;
}

export async function parseMatchesAction(gameDayId: string, matchIds: number[]) {
  // This will be called from client to parse matches
  // The actual parsing will happen via API route
  const response = await fetch("/api/parse-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameDayId, matchIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to parse matches");
  }

  return response.json();
}

export async function deleteGameDayAction(gameDayId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // First, get all player stats for this game day to update player totals
  const { data: gameDayStats } = await supabase
    .from("player_match_stats")
    .select("player_id, points")
    .eq("game_day_id", gameDayId);

  // Group stats by player to update their total_points
  const playerUpdates = new Map<string, number>();
  gameDayStats?.forEach(stat => {
    const current = playerUpdates.get(stat.player_id) || 0;
    playerUpdates.set(stat.player_id, current + stat.points);
  });

  // Update player total points (subtract the points from this game day)
  for (const [playerId, pointsToSubtract] of playerUpdates) {
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("total_points, matches_played")
      .eq("id", playerId)
      .single();

    if (currentPlayer) {
      await supabase
        .from("players")
        .update({
          total_points: Math.max(0, currentPlayer.total_points - pointsToSubtract),
          matches_played: Math.max(0, currentPlayer.matches_played - (gameDayStats?.filter(s => s.player_id === playerId).length || 0))
        })
        .eq("id", playerId);
    }
  }

  // Delete all matches in this game day (this will cascade to player_match_stats)
  const { error: matchesError } = await supabase
    .from("matches")
    .delete()
    .eq("game_day_id", gameDayId);

  if (matchesError) {
    throw new Error(`Failed to delete matches: ${matchesError.message}`);
  }

  // Delete the game day itself
  const { error: gameDayError } = await supabase
    .from("game_days")
    .delete()
    .eq("id", gameDayId);

  if (gameDayError) {
    throw new Error(`Failed to delete game day: ${gameDayError.message}`);
  }

  revalidatePath("/admin", "max");
}

export async function deleteMatchAction(matchId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // First, get all player stats for this match to update player totals
  const { data: matchStats } = await supabase
    .from("player_match_stats")
    .select("player_id, points")
    .eq("match_id", matchId);

  // Update player total points (subtract the points from this match)
  for (const stat of matchStats || []) {
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("total_points, matches_played")
      .eq("id", stat.player_id)
      .single();

    if (currentPlayer) {
      await supabase
        .from("players")
        .update({
          total_points: Math.max(0, currentPlayer.total_points - stat.points),
          matches_played: Math.max(0, currentPlayer.matches_played - 1)
        })
        .eq("id", stat.player_id);
    }
  }

  // Delete the match (this will cascade to player_match_stats)
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (error) {
    throw new Error(`Failed to delete match: ${error.message}`);
  }

  revalidatePath("/admin", "max");
}

export async function deleteTournamentAction(tournamentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Delete all player stats for this tournament (this will cascade to other related data)
  const { error: statsError } = await supabase
    .from("player_match_stats")
    .delete()
    .eq("tournament_id", tournamentId);

  if (statsError) {
    throw new Error(`Failed to delete player stats: ${statsError.message}`);
  }

  // Delete the tournament (this will cascade to game_days and matches)
  const { error: tournamentError } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (tournamentError) {
    throw new Error(`Failed to delete tournament: ${tournamentError.message}`);
  }

  // Clean up players who no longer participate in any tournaments
  await cleanupOrphanedPlayers();

  revalidatePath("/", "layout");
}

async function cleanupOrphanedPlayers() {
  const supabase = await createClient();

  // Find players who have no tournament participation
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id");

  if (!allPlayers) return;

  for (const player of allPlayers) {
    const { data: playerStats } = await supabase
      .from("player_match_stats")
      .select("id")
      .eq("player_id", player.id)
      .limit(1);

    // If player has no stats in any tournament, delete them
    if (!playerStats || playerStats.length === 0) {
      await supabase
        .from("players")
        .delete()
        .eq("id", player.id);
    }
  }
}
