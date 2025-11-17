// Server-side match parser converted from Python script
export interface MatchData {
  matchId: number;
  players: Array<{
    name: string;
    points: number;
    position: number;
    victory?: boolean;
  }>;
  rawData: any;
}

export async function parseMatch(matchId: number): Promise<MatchData | null> {
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
    
    // Extract game data using regex pattern from Python script
    const pattern = /:game-data='(.*?)'\s+:user=/s;
    const match = html.match(pattern);
    
    if (!match) {
      console.error('[v0] Game data pattern not found in HTML');
      return null;
    }

    const gameData = JSON.parse(match[1]);

    // Extract player stats from game data
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
  const players: Array<{ name: string; points: number; position: number; victory?: boolean }> = [];

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
