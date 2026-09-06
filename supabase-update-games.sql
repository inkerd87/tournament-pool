-- Обновление базы данных Supabase: замена Valorant на Call of Duty: Warzone и Fortnite
-- Выполните этот запрос в https://supabase.com/dashboard/project/qblybjpioynwgheqhxyo/sql

-- 1. Обновляем ограничение списка игр (убираем valorant, добавляем warzone и fortnite)
alter table public.tournaments drop constraint if exists tournaments_game_check;
alter table public.tournaments add constraint tournaments_game_check check (game in ('cs2', 'dota2', 'pubg', 'warzone', 'fortnite'));

-- 2. Добавляем политики на добавление и удаление турниров
drop policy if exists "Public tournaments insert" on public.tournaments;
create policy "Public tournaments insert" on public.tournaments for insert with check (true);

drop policy if exists "Public tournaments delete" on public.tournaments;
create policy "Public tournaments delete" on public.tournaments for delete using (true);

-- 3. Удаляем старый турнир Valorant
delete from public.tournaments where id = 'valorant-skirmish-001' or game = 'valorant';

-- 4. Добавляем турниры по Warzone и Fortnite
insert into public.tournaments (id, title, game, max_players, registered_count, starts_at, status, format, description)
values
  (
    'warzone-solo-001',
    'Warzone Resurgence Showdown',
    'warzone',
    100,
    0,
    '2026-09-08T18:00:00+03:00',
    'recruiting',
    'Solo Resurgence, 1 катка',
    'Быстрая королевская битва в Warzone: 1 катка на выживание — топ-3 получают призовые выплаты сразу.'
  ),
  (
    'fortnite-solo-001',
    'Fortnite Zero Build Cup',
    'fortnite',
    100,
    0,
    '2026-09-09T18:00:00+03:00',
    'recruiting',
    'Solo Zero Build, 1 катка',
    'Одиночная битва без построек (Zero Build): 1 катка — топ-3 выживших сразу получают призовые выплаты.'
  )
on conflict (id) do update set
  title = excluded.title,
  game = excluded.game,
  format = excluded.format,
  description = excluded.description;
