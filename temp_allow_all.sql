-- Временное решение - разрешить все операции для тестирования
DROP POLICY IF EXISTS "Allow authenticated insert on tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow authenticated update on tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow authenticated delete on tournaments" ON public.tournaments;

CREATE POLICY "Allow all operations on tournaments"
  ON public.tournaments FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on game_days" ON public.game_days;
DROP POLICY IF EXISTS "Allow authenticated update on game_days" ON public.game_days;
DROP POLICY IF EXISTS "Allow authenticated delete on game_days" ON public.game_days;

CREATE POLICY "Allow all operations on game_days"
  ON public.game_days FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on matches" ON public.matches;
DROP POLICY IF EXISTS "Allow authenticated update on matches" ON public.matches;
DROP POLICY IF EXISTS "Allow authenticated delete on matches" ON public.matches;

CREATE POLICY "Allow all operations on matches"
  ON public.matches FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated update on players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated delete on players" ON public.players;

CREATE POLICY "Allow all operations on players"
  ON public.players FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on player_match_stats" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow authenticated update on player_match_stats" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow authenticated delete on player_match_stats" ON public.player_match_stats;

CREATE POLICY "Allow all operations on player_match_stats"
  ON public.player_match_stats FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on achievements" ON public.achievements;
DROP POLICY IF EXISTS "Allow authenticated update on achievements" ON public.achievements;
DROP POLICY IF EXISTS "Allow authenticated delete on achievements" ON public.achievements;

CREATE POLICY "Allow all operations on achievements"
  ON public.achievements FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert on player_achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Allow authenticated update on player_achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Allow authenticated delete on player_achievements" ON public.player_achievements;

CREATE POLICY "Allow all operations on player_achievements"
  ON public.player_achievements FOR ALL
  USING (true) WITH CHECK (true);
