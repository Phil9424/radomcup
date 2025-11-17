-- Add polemic_id field to players table
ALTER TABLE public.players 
ADD COLUMN polemic_id INTEGER;

-- Create unique index on polemic_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_polemic_id ON public.players(polemic_id);

-- Add comment
COMMENT ON COLUMN public.players.polemic_id IS 'Player ID from Polemica game system';
