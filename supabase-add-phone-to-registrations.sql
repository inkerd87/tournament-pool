-- ==============================================================================
-- ДОБАВЛЕНИЕ КОЛОНКИ PHONE В ТАБЛИЦУ REGISTRATIONS В SUPABASE
-- Выполните этот скрипт в: https://supabase.com/dashboard/project/qblybjpioynwgheqhxyo/sql
-- ==============================================================================

-- 1. Добавляем колонку phone в таблицу registrations (если ещё нет)
alter table public.registrations add column if not exists phone text;

-- 2. Включаем полную репликацию строк (REPLICA IDENTITY FULL)
alter table public.registrations replica identity full;

-- 3. Настраиваем Row Level Security (RLS) политики для таблицы registrations
alter table public.registrations enable row level security;

drop policy if exists "Public registrations select" on public.registrations;
create policy "Public registrations select" on public.registrations for select using (true);

drop policy if exists "Public registrations insert" on public.registrations;
create policy "Public registrations insert" on public.registrations for insert with check (true);

drop policy if exists "Public registrations update" on public.registrations;
create policy "Public registrations update" on public.registrations for update using (true);

drop policy if exists "Public registrations delete" on public.registrations;
create policy "Public registrations delete" on public.registrations for delete using (true);

-- 4. Убеждаемся, что таблица подключена к Realtime публикации
do $$
begin
  begin
    alter publication supabase_realtime add table public.registrations;
  exception when duplicate_object then null;
  end;
end $$;
