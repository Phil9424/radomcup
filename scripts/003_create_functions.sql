-- Function to update player total stats
create or replace function public.update_player_stats(
  p_player_id uuid,
  p_points integer
)
returns void
language plpgsql
as $$
begin
  update public.players
  set 
    total_points = total_points + p_points,
    matches_played = matches_played + 1,
    updated_at = now()
  where id = p_player_id;
end;
$$;
