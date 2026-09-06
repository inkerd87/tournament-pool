-- ==============================================================================
-- ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ SUPABASE
-- 1. Удаление Valorant и добавление Call of Duty: Warzone и Fortnite (со статусом 'soon')
-- 2. Новая бизнес-модель CS2 и Dota 2 (5v5, 10 игроков, 1 500 ₽ взнос, 12 000 ₽ призовые)
-- Выполните этот скрипт в: https://supabase.com/dashboard/project/qblybjpioynwgheqhxyo/sql
-- ==============================================================================

-- 1. Очищаем старые записи Valorant перед обновлением ограничений (CHECK constraints)
delete from public.registrations where tournament_id in (select id from public.tournaments where game = 'valorant');
delete from public.matches where tournament_id in (select id from public.tournaments where game = 'valorant');
delete from public.tournaments where game = 'valorant' or id = 'valorant-skirmish-001';

-- 2. Обновляем ограничения на допустимые игры (game)
alter table public.tournaments drop constraint if exists tournaments_game_check;
alter table public.tournaments add constraint tournaments_game_check check (game in ('cs2', 'dota2', 'pubg', 'warzone', 'fortnite'));

-- 3. Обновляем ограничения на допустимые статусы (добавляем статус 'soon' для анонсов)
alter table public.tournaments drop constraint if exists tournaments_status_check;
alter table public.tournaments add constraint tournaments_status_check check (status in ('recruiting', 'full', 'live', 'finished', 'soon'));

-- 4. Обновляем политики доступа (RLS) для администрирования
drop policy if exists "Public tournaments insert" on public.tournaments;
create policy "Public tournaments insert" on public.tournaments for insert with check (true);

drop policy if exists "Public tournaments update" on public.tournaments;
create policy "Public tournaments update" on public.tournaments for update using (true);

drop policy if exists "Public tournaments delete" on public.tournaments;
create policy "Public tournaments delete" on public.tournaments for delete using (true);

-- 5. Обновляем турниры CS2 и Dota 2 под схему 5v5 (10 человек, 1 500 ₽ взнос, 12 000 ₽ победителю)
update public.tournaments
set
  title = 'CS2 5v5 Cash Clash #1',
  max_players = 10,
  format = '5v5, BO1 — Победитель забирает 12 000 ₽',
  description = 'Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Победившая команда забирает весь банк: 12 000 ₽ (по 2 400 ₽ на каждого игрока)! Проигравшие получают 0 ₽.'
where game = 'cs2';

update public.tournaments
set
  title = 'Dota 2 5v5 Battle Cup',
  max_players = 10,
  format = '5v5, Captains Mode — Победитель забирает 12 000 ₽',
  description = 'Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Победившая команда забирает весь банк: 12 000 ₽ (по 2 400 ₽ на каждого игрока)! Проигравшие получают 0 ₽.'
where game = 'dota2';

-- 6. Добавляем / обновляем турниры по Warzone и Fortnite со статусом 'soon' (Скоро)
insert into public.tournaments (id, title, game, max_players, registered_count, starts_at, status, format, description)
values
  (
    'warzone-solo-001',
    'Warzone Battle Royale',
    'warzone',
    100,
    0,
    '2026-09-10T19:00:00+03:00',
    'soon',
    'Solo Resurgence, 1 катка',
    'Турнир по Call of Duty: Warzone откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.'
  ),
  (
    'fortnite-solo-001',
    'Fortnite Zero Build Cup',
    'fortnite',
    100,
    0,
    '2026-09-11T19:00:00+03:00',
    'soon',
    'Solo Zero Build, 1 катка',
    'Турнир по Fortnite откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.'
  )
on conflict (id) do update set
  title = excluded.title,
  game = excluded.game,
  max_players = excluded.max_players,
  status = excluded.status,
  format = excluded.format,
  description = excluded.description;
