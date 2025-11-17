-- Добавление поля создателя турнира
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admin_users(id);

-- Создание индекса
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
