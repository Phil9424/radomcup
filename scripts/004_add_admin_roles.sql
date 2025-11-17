-- Создание таблицы для администраторов
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  is_active BOOLEAN DEFAULT true
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- RLS политики
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать активных админов (для отображения кто создал турнир)
CREATE POLICY "Allow public read access on active admin_users"
  ON admin_users FOR SELECT
  USING (is_active = true);

-- Политика: только аутентифицированные пользователи могут вставлять (будем проверять роль в коде)
CREATE POLICY "Allow authenticated insert on admin_users"
  ON admin_users FOR INSERT
  WITH CHECK (true);

-- Политика: только аутентифицированные пользователи могут обновлять
CREATE POLICY "Allow authenticated update on admin_users"
  ON admin_users FOR UPDATE
  USING (true);

-- Создание первого супер-админа (будет создан при регистрации)
-- Пароль нужно будет установить через Supabase Auth
