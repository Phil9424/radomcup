-- Добавление колонки victory в player_match_stats
ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS victory BOOLEAN DEFAULT FALSE;

-- Обновление существующих записей (если victory не указан, ставим false)
UPDATE player_match_stats SET victory = FALSE WHERE victory IS NULL;
