-- Create tournaments table
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create game days table
create table if not exists public.game_days (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  day_number integer not null,
  created_at timestamp with time zone default now(),
  constraint unique_tournament_day unique (tournament_id, day_number)
);

-- Create matches table (stores parsed match data)
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  game_day_id uuid references public.game_days(id) on delete cascade,
  match_id integer not null unique,
  match_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Create players table
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  total_points integer default 0,
  matches_played integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create player_match_stats table (links players to matches with their stats)
create table if not exists public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  game_day_id uuid references public.game_days(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  points integer not null,
  position integer,
  created_at timestamp with time zone default now(),
  constraint unique_player_match unique (player_id, match_id)
);

-- Create achievements table
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text,
  category text,
  created_at timestamp with time zone default now()
);

-- Create player_achievements table (tracks which players earned which achievements)
create table if not exists public.player_achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  achievement_id uuid references public.achievements(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  earned_at timestamp with time zone default now(),
  constraint unique_player_achievement unique (player_id, achievement_id, tournament_id)
);

-- Create indexes for better query performance
create index if not exists idx_game_days_tournament on public.game_days(tournament_id);
create index if not exists idx_matches_game_day on public.matches(game_day_id);
create index if not exists idx_player_match_stats_player on public.player_match_stats(player_id);
create index if not exists idx_player_match_stats_tournament on public.player_match_stats(tournament_id);
create index if not exists idx_players_total_points on public.players(total_points desc);

-- Enable Row Level Security
alter table public.tournaments enable row level security;
alter table public.game_days enable row level security;
alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.player_match_stats enable row level security;
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;

-- Public read access for all tables (anyone can view tournaments and stats)
create policy "Allow public read access on tournaments"
  on public.tournaments for select
  using (true);

create policy "Allow public read access on game_days"
  on public.game_days for select
  using (true);

create policy "Allow public read access on matches"
  on public.matches for select
  using (true);

create policy "Allow public read access on players"
  on public.players for select
  using (true);

create policy "Allow public read access on player_match_stats"
  on public.player_match_stats for select
  using (true);

create policy "Allow public read access on achievements"
  on public.achievements for select
  using (true);

create policy "Allow public read access on player_achievements"
  on public.player_achievements for select
  using (true);
