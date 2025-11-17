-- Change points field from integer to numeric to support decimal values
ALTER TABLE public.player_match_stats 
ALTER COLUMN points TYPE numeric USING points::numeric;

-- Also change position to numeric if needed (though it might stay integer)
-- ALTER TABLE public.player_match_stats 
-- ALTER COLUMN position TYPE numeric USING position::numeric;

-- Update players table total_points to numeric as well
ALTER TABLE public.players 
ALTER COLUMN total_points TYPE numeric USING total_points::numeric;
