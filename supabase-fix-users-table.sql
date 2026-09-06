-- ==============================================================================
-- ИСПРАВЛЕНИЕ И СОЗДАНИЕ ТАБЛИЦЫ USERS В SUPABASE
-- Выполните этот скрипт в: https://supabase.com/dashboard/project/qblybjpioynwgheqhxyo/sql
-- ==============================================================================

-- 1. Создаем таблицу public.users, если её ещё нет
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nickname text,
  phone text,
  password text,
  balance_rub numeric default 0,
  created_at timestamptz default now()
);

-- 2. Гарантируем наличие всех колонок (на случай если таблица уже существовала)
alter table public.users add column if not exists id uuid default gen_random_uuid();
alter table public.users add column if not exists email text;
alter table public.users add column if not exists nickname text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists password text;
alter table public.users add column if not exists balance_rub numeric default 0;
alter table public.users add column if not exists created_at timestamptz default now();

-- 3. Гарантируем уникальность email
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_email_key'
  ) then
    begin
      alter table public.users add constraint users_email_key unique (email);
    exception when others then null;
    end;
  end if;
end $$;

-- 4. Настраиваем Row Level Security (RLS) и полные права для клиента сайта
alter table public.users enable row level security;

drop policy if exists "Public users select" on public.users;
create policy "Public users select" on public.users for select using (true);

drop policy if exists "Public users insert" on public.users;
create policy "Public users insert" on public.users for insert with check (true);

drop policy if exists "Public users update" on public.users;
create policy "Public users update" on public.users for update using (true);

drop policy if exists "Public users delete" on public.users;
create policy "Public users delete" on public.users for delete using (true);

-- 5. Включаем полную репликацию и добавляем в Realtime
alter table public.users replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.users;
  exception when duplicate_object then null;
  end;
end $$;
