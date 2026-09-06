-- ==============================================================================
-- ВКЛЮЧЕНИЕ REALTIME (ОБНОВЛЕНИЕ ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ) В SUPABASE
-- Выполните этот скрипт в: https://supabase.com/dashboard/project/qblybjpioynwgheqhxyo/sql
-- ==============================================================================

-- 1. Добавляем таблицы в публикацию supabase_realtime для трансляции изменений через WebSocket
do $$
begin
  begin
    alter publication supabase_realtime add table public.tournaments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.registrations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.matches;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.users;
  exception when duplicate_object then null;
  end;
end $$;

-- 2. Включаем полную репликацию строк (REPLICA IDENTITY FULL), чтобы при UPDATE/DELETE передавались все поля
alter table public.tournaments replica identity full;
alter table public.registrations replica identity full;
alter table public.matches replica identity full;
alter table public.users replica identity full;

-- 3. Настраиваем Row Level Security (RLS) политики для чтения и записи.
-- ВАЖНО: Supabase Realtime не отправляет данные клиентам, если нет явной политики SELECT для роли anon!
alter table public.tournaments enable row level security;
drop policy if exists "Public tournaments select" on public.tournaments;
create policy "Public tournaments select" on public.tournaments for select using (true);
drop policy if exists "Public tournaments insert" on public.tournaments;
create policy "Public tournaments insert" on public.tournaments for insert with check (true);
drop policy if exists "Public tournaments update" on public.tournaments;
create policy "Public tournaments update" on public.tournaments for update using (true);
drop policy if exists "Public tournaments delete" on public.tournaments;
create policy "Public tournaments delete" on public.tournaments for delete using (true);

alter table public.registrations enable row level security;
drop policy if exists "Public registrations select" on public.registrations;
create policy "Public registrations select" on public.registrations for select using (true);
drop policy if exists "Public registrations insert" on public.registrations;
create policy "Public registrations insert" on public.registrations for insert with check (true);
drop policy if exists "Public registrations update" on public.registrations;
create policy "Public registrations update" on public.registrations for update using (true);
drop policy if exists "Public registrations delete" on public.registrations;
create policy "Public registrations delete" on public.registrations for delete using (true);

alter table public.matches enable row level security;
drop policy if exists "Public matches select" on public.matches;
create policy "Public matches select" on public.matches for select using (true);
drop policy if exists "Public matches insert" on public.matches;
create policy "Public matches insert" on public.matches for insert with check (true);
drop policy if exists "Public matches update" on public.matches;
create policy "Public matches update" on public.matches for update using (true);
drop policy if exists "Public matches delete" on public.matches;
create policy "Public matches delete" on public.matches for delete using (true);

alter table public.users enable row level security;
drop policy if exists "Public users select" on public.users;
create policy "Public users select" on public.users for select using (true);
drop policy if exists "Public users insert" on public.users;
create policy "Public users insert" on public.users for insert with check (true);
drop policy if exists "Public users update" on public.users;
create policy "Public users update" on public.users for update using (true);
drop policy if exists "Public users delete" on public.users;
create policy "Public users delete" on public.users for delete using (true);
