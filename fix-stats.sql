-- Исправить player_match_stats чтобы они соответствовали правильным game_day_id из matches
UPDATE player_match_stats 
SET game_day_id = matches.game_day_id
FROM matches 
WHERE player_match_stats.match_id = matches.id;
