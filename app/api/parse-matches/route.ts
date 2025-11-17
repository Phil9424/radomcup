import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface MatchData {
  matchId: number;
  players: Array<{
    name: string;
    polemicId: number;
    points: number;
    position: number;
    victory?: boolean;
  }>;
  rawData: any;
}

async function parseMatch(matchId: number): Promise<MatchData | null> {
  try {
    const url = `https://polemicagame.com/match/${matchId}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[v0] Failed to fetch match ${matchId}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract game data using regex pattern
    const pattern = /:game-data='(.*?)'/s;
    const match = html.match(pattern);
    
    if (!match) {
      console.error('[v0] Game data pattern not found in HTML');
      return null;
    }

    const gameData = JSON.parse(match[1]);

    // Extract player stats - adjust based on actual data structure
    console.log('Match', matchId, '- winnerCode:', gameData.winnerCode, 'type:', typeof gameData.winnerCode);
    console.log('Match', matchId, '- gameData keys:', Object.keys(gameData));

    const players = extractPlayerStats(gameData, gameData.winnerCode);
    
    return {
      matchId,
      players,
      rawData: gameData,
    };
  } catch (error) {
    console.error('[v0] Error parsing match:', error);
    return null;
  }
}

function extractPlayerStats(gameData: any, winnerCode?: number) {
  const players: Array<{ name: string; polemicId: number; points: number; position: number; victory?: boolean }> = [];

  console.log('extractPlayerStats - winnerCode received:', winnerCode, 'type:', typeof winnerCode);

  if (gameData.players && Array.isArray(gameData.players)) {
    // Sort players by table position to get correct order
    const sortedPlayers = gameData.players.sort((a: any, b: any) => a.tablePosition - b.tablePosition);

    console.log('extractPlayerStats - sorted players count:', sortedPlayers.length);

    sortedPlayers.forEach((player: any, index: number) => {
      // Определяем команду игрока: шериф = мирный, дон = мафия
      const role = player.role || player.team;
      const isMafia = role === 'mafia' || role === 'don' || role === 'black_mafia' || player.isMafia;
      const isWinner = (winnerCode === 0 && !isMafia) || (winnerCode === 1 && isMafia); // 0 = мирные, 1 = мафия

      console.log(`Player ${index}: ${player.username}, role: ${role}, isMafia: ${isMafia}, winnerCode: ${winnerCode}, isWinner: ${isWinner}`);

      players.push({
        name: player.username,
        polemicId: player.id,
        points: player.points || 0,
        position: player.tablePosition,
        victory: isWinner,
      });
    });
  }

  const winnerCount = players.filter(p => p.victory).length;
  console.log('extractPlayerStats - winners found:', winnerCount);

  return players;
}

export async function POST(request: NextRequest) {
  try {
    const { gameDayId, tournamentId, matchIds } = await request.json();

    const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

    // Parse all matches in parallel for better performance
    const parsePromises = matchIds.map(matchId => parseMatch(matchId));
    const matchDataResults = await Promise.all(parsePromises);

    const results = [];

    for (let i = 0; i < matchIds.length; i++) {
      const matchId = matchIds[i];
      const matchData = matchDataResults[i];

      if (!matchData) {
        results.push({ matchId, success: false, error: "Failed to parse" });
        continue;
      }

      console.log(`Processing match ${matchId} with ${matchData.players.length} players`);

      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("match_id", matchId)
        .single();

      let match;
      if (existingMatch) {
        // Match already exists, update game_day_id if different
        const { data: updatedMatch, error: updateError } = await supabase
          .from("matches")
          .update({ game_day_id: gameDayId })
          .eq("match_id", matchId)
          .select()
          .single();

        if (updateError) {
          results.push({ matchId, success: false, error: `Match already exists: ${updateError.message}` });
          continue;
        }
        match = updatedMatch;

        // Check if player stats already exist for this game day
        const { data: existingStats } = await supabase
          .from("player_match_stats")
          .select("id")
          .eq("match_id", existingMatch.id)
          .eq("game_day_id", gameDayId);

        if (existingStats && existingStats.length > 0) {
          console.log(`Player stats already exist for match ${matchId} in game day ${gameDayId}`);
          results.push({ matchId, success: true, playersCount: existingStats.length });
          continue; // Skip if stats already exist for this game day
        }

        // If match exists but not for this game day, we need to create new player stats for this game day
        console.log(`Match ${matchId} exists but not for game day ${gameDayId}, creating new player stats`);
        // Don't skip - process players for the new game day
      } else {
        // Store new match
        const { data: newMatch, error: matchError } = await supabase
          .from("matches")
          .insert({
            game_day_id: gameDayId,
            match_id: matchId,
            match_data: matchData.rawData,
          })
          .select()
          .single();

        if (matchError) {
          results.push({ matchId, success: false, error: matchError.message });
          continue;
        }
        match = newMatch;
        console.log(`Created new match ${matchId} for game day ${gameDayId}`);
      }

      // Process players and stats for new matches or existing matches being added to new game day
      console.log(`Processing ${matchData.players.length} players for match ${matchId}`);
      const playerPromises = matchData.players.map(async (player, index) => {
        try {
          console.log(`Processing player ${index + 1}/${matchData.players.length}: ${player.name} (${player.points} points, pos ${player.position})`);

          // Upsert player
          const { data: existingPlayer, error: findError } = await supabase
            .from("players")
            .select("id, polemic_id")
            .or(`name.eq.${player.name},polemic_id.eq.${player.polemicId}`)
            .single();

          if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error(`Error finding player ${player.name}:`, findError);
            return;
          }

          let playerId;

          if (existingPlayer) {
            playerId = existingPlayer.id;
            // Update polemic_id if not set
            if (!existingPlayer.polemic_id && player.polemicId) {
              await supabase
                .from("players")
                .update({ polemic_id: player.polemicId })
                .eq("id", playerId);
            }
            console.log(`Found existing player ${player.name} with ID ${playerId}`);
          } else {
            const { data: newPlayer, error: playerError } = await supabase
              .from("players")
              .insert({
                name: player.name,
                polemic_id: player.polemicId
              })
              .select()
              .single();

            if (playerError) {
              console.error(`Error creating player ${player.name}:`, playerError);
              return;
            }

            playerId = newPlayer?.id;
            console.log(`Created new player ${player.name} with polemic_id ${player.polemicId} and ID ${playerId}`);
          }

          if (!playerId) {
            console.error(`Failed to get player ID for ${player.name}`);
            return;
          }

              // Store player match stats
              const { error: statsError } = await supabase.from("player_match_stats").insert({
                player_id: playerId,
                match_id: match.id,
                game_day_id: gameDayId,
                tournament_id: tournamentId,
                points: player.points,
                position: player.position,
                victory: player.victory || false,
              });

          if (statsError) {
            console.error(`Error saving stats for ${player.name}:`, statsError);
          } else {
            console.log(`Saved stats for ${player.name}: ${player.points} points`);
          }

          // Update player total stats
          const { data: currentPlayer } = await supabase
            .from("players")
            .select("total_points, matches_played")
            .eq("id", playerId)
            .single();

          if (currentPlayer) {
            await supabase
              .from("players")
              .update({
                total_points: currentPlayer.total_points + player.points,
                matches_played: currentPlayer.matches_played + 1,
              })
              .eq("id", playerId);
          }
        } catch (error) {
          console.error(`Error processing player ${player.name}:`, error);
        }
      });

      await Promise.all(playerPromises);
      console.log(`Finished processing all players for match ${matchId}`);
      results.push({ matchId, success: true, playersCount: matchData.players.length });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[v0] Parse matches error:", error);
    return NextResponse.json(
      { error: "Failed to parse matches" },
      { status: 500 }
    );
  }
}
