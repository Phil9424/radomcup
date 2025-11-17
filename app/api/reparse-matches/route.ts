import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

async function parseMatch(matchId: number, supabase: any): Promise<MatchData | null> {
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
    const pattern = /:game-data='(.*?)'/s; // Corrected regex pattern
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
      console.log(`Player ${index} role object:`, JSON.stringify(role, null, 2));

      let isMafia = false;
      if (typeof role === 'string') {
        isMafia = role === 'mafia' || role === 'don' || role === 'black_mafia' || role === 'godfather';
      } else if (typeof role === 'object' && role) {
        // Role is an object, check type field
        const roleType = role.type;
        isMafia = roleType === 'mafia' || roleType === 'godfather' || roleType === 'black_mafia';
        // sheriff и civilian - мирные, godfather и mafia - мафия
      }

      const isWinner = (winnerCode === 0 && !isMafia) || (winnerCode === 1 && isMafia); // 0 = мирные, 1 = мафия

      console.log(`Player ${index}: ${player.username}, role: ${typeof role === 'object' ? JSON.stringify(role) : role}, isMafia: ${isMafia}, winnerCode: ${winnerCode}, isWinner: ${isWinner}`);

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

export async function POST(request: NextResponse) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tournaments with their game days and matches
    const { data: tournaments } = await supabase
      .from("tournaments")
      .select(`
        id,
        name,
        game_days (
          id,
          day_number,
          matches (
            id,
            match_id
          )
        )
      `);

    if (!tournaments) {
      return NextResponse.json({ error: "No tournaments found" }, { status: 404 });
    }

    let totalProcessed = 0;

    // Process each tournament
    for (const tournament of tournaments) {
      if (!tournament.game_days) continue;

      for (const gameDay of tournament.game_days) {
        if (!gameDay.matches) continue;

        // Parse matches for this game day
        const matchIds = gameDay.matches.map(m => m.match_id);

        if (matchIds.length > 0) {
          console.log(`Reparsing ${matchIds.length} matches for tournament ${tournament.name}, day ${gameDay.day_number}`);

          try {
            const parsePromises = matchIds.map(matchId => parseMatch(matchId, supabase));
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
                console.log(`Match ${matchId} already exists, using existing match`);
                match = existingMatch;
                // Always process players to update victory status
              } else {
                // Store new match
                const { data: newMatch, error: matchError } = await supabase
                  .from("matches")
                  .insert({
                    game_day_id: gameDay.id,
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
                console.log(`Created new match ${matchId} for game day ${gameDay.id}`);
              }

              // Process players and stats - update existing or create new
              console.log(`Processing ${matchData.players.length} players for match ${matchId}`);
              const playerPromises = matchData.players.map(async (player, index) => {
                try {
                  console.log(`Processing player ${index + 1}/${matchData.players.length}: ${player.name} (${player.points} points, pos ${player.position}, victory: ${player.victory})`);

                  // Upsert player
                  const { data: existingPlayer, error: findError } = await supabase
                    .from("players")
                    .select("id, polemic_id") // Select polemic_id
                    .or(`name.eq.${player.name},polemic_id.eq.${player.polemicId}`) // Search by name OR polemic_id
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
                        polemic_id: player.polemicId // Insert polemic_id
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

                  // Update existing player match stats or insert if not exists
                  const { data: existingStats, error: selectError } = await supabase
                    .from("player_match_stats")
                    .select("id, victory")
                    .eq("player_id", playerId)
                    .eq("match_id", match.id)
                    .single();

                  console.log(`Checking stats for ${player.name}: existing=${!!existingStats}, victory=${player.victory}`);

                  let statsError = null;
                  if (existingStats && !selectError) {
                    // Update existing record
                    console.log(`Updating existing stats for ${player.name}, old victory: ${existingStats.victory}, new victory: ${player.victory}`);
                    const { error } = await supabase
                      .from("player_match_stats")
                      .update({
                        victory: player.victory || false
                      })
                      .eq("id", existingStats.id);
                    statsError = error;
                  } else {
                    // Insert new record
                    console.log(`Inserting new stats for ${player.name}, victory: ${player.victory}`);
                    const { error } = await supabase.from("player_match_stats").insert({
                      player_id: playerId,
                      match_id: match.id,
                      game_day_id: gameDay.id,
                      tournament_id: tournament.id,
                      points: player.points,
                      position: player.position,
                      victory: player.victory || false,
                    });
                    statsError = error;
                  }

                  if (statsError) {
                    console.error(`Error saving stats for ${player.name}:`, statsError);
                  } else {
                    console.log(`✅ Success: ${existingStats ? 'Updated' : 'Inserted'} stats for ${player.name}: victory: ${player.victory}`);
                  }
                } catch (error) {
                  console.error(`Error processing player ${player.name}:`, error);
                }
              });

              await Promise.all(playerPromises);
              console.log(`Finished processing all players for match ${matchId}`);
              results.push({ matchId, success: true, playersCount: matchData.players.length });
            }

            totalProcessed += results.length;
            console.log(`Processed ${results.length} matches for day ${gameDay.day_number}`);
          } catch (error) {
            console.error(`Error reparsing matches for day ${gameDay.day_number}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reparsed matches for ${totalProcessed} matches across all tournaments`
    });

  } catch (error) {
    console.error("Error in reparse-matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
