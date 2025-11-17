-- Политики для администраторов на таблицу tournaments
CREATE POLICY "Allow authenticated insert on tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on tournaments"
  ON public.tournaments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on tournaments"
  ON public.tournaments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Политики для администраторов на таблицу game_days
CREATE POLICY "Allow authenticated insert on game_days"
  ON public.game_days FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on game_days"
  ON public.game_days FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on game_days"
  ON public.game_days FOR DELETE
  USING (auth.role() = 'authenticated');

-- Политики для администраторов на таблицу matches
CREATE POLICY "Allow authenticated insert on matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on matches"
  ON public.matches FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on matches"
  ON public.matches FOR DELETE
  USING (auth.role() = 'authenticated');

-- Политики для администраторов на таблицу players
CREATE POLICY "Allow authenticated insert on players"
  ON public.players FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on players"
  ON public.players FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on players"
  ON public.players FOR DELETE
  USING (auth.role() = 'authenticated');

-- Политики для администраторов на таблицу player_match_stats
CREATE POLICY "Allow authenticated insert on player_match_stats"
  ON public.player_match_stats FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on player_match_stats"
  ON public.player_match_stats FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on player_match_stats"
  ON public.player_match_stats FOR DELETE
  USING (auth.role() = 'authenticated');

-- Политики для администраторов на таблицу achievements
CREATE POLICY "Allow authenticated insert on achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on achievements"
  ON public.achievements FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on achievements"
  ON public.achievements FOR DELETE
  USING (auth.role() = 'authenticated');

-- Политики для администраторов на таблицу player_achievements
CREATE POLICY "Allow authenticated insert on player_achievements"
  ON public.player_achievements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on player_achievements"
  ON public.player_achievements FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on player_achievements"
  ON public.player_achievements FOR DELETE
  USING (auth.role() = 'authenticated');
