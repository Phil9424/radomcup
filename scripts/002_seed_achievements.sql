-- Insert default achievements
insert into public.achievements (name, description, icon, category) values
  ('First Blood', 'Win your first tournament', '🥇', 'milestones'),
  ('Hat Trick', 'Win 3 tournaments', '🎩', 'milestones'),
  ('Champion', 'Win 5 tournaments', '👑', 'milestones'),
  ('Legend', 'Win 10 tournaments', '⭐', 'milestones'),
  ('Top Scorer', 'Achieve highest points in a tournament', '🎯', 'tournament'),
  ('Consistent', 'Finish in top 3 for 5 consecutive tournaments', '📈', 'consistency'),
  ('Comeback King', 'Win after being in last place in a game day', '🔥', 'special'),
  ('Perfect Day', 'Win all matches in a game day', '💎', 'special'),
  ('Marathon Runner', 'Participate in 20 tournaments', '🏃', 'participation'),
  ('Century', 'Score 100+ total points across all tournaments', '💯', 'points')
on conflict (name) do nothing;
