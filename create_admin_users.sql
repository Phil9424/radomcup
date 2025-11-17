
-- Создание таблицы admin_users если она не существует
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Очистка всех существующих админов
DELETE FROM admin_users;

-- Вставка администраторов
INSERT INTO admin_users (email, full_name, role)
VALUES
  ('john_doe_94@bk.ru', 'John Doe', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Временно отключаем RLS для admin_users (административная таблица)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Удаление существующих политик (если есть)
DROP POLICY IF EXISTS "Super admins can read all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;

