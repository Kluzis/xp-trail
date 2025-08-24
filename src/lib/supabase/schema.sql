-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum types
create type user_role as enum ('user', 'admin');
create type challenge_type as enum ('daily', 'weekly', 'special');
create type skill_status as enum ('locked', 'available', 'completed');

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text,
  avatar_url text,
  age integer,
  role user_role default 'user',
  xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date default current_date,
  skin_config jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Level thresholds table
create table public.level_thresholds (
  level integer primary key,
  min_xp integer not null,
  tier text not null, -- bronze, silver, gold, platinum, diamond
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon_url text,
  color text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons table
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  duration_minutes integer,
  xp_reward integer default 10,
  difficulty_level integer default 1,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lesson videos table
create table public.lesson_videos (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  video_url text not null,
  duration_seconds integer,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Skills table
create table public.skills (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon_url text,
  required_level integer default 1,
  x_position float not null, -- for hexagon positioning
  y_position float not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User skills progress
create table public.user_skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  status skill_status default 'locked',
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, skill_id)
);

-- Lesson completions
create table public.lesson_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  xp_earned integer not null,
  time_spent_seconds integer,
  unique(user_id, lesson_id)
);

-- Challenges table
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type challenge_type not null,
  xp_reward integer default 50,
  target_value integer, -- e.g., complete 3 lessons
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User challenge progress
create table public.user_challenges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  current_progress integer default 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, challenge_id)
);

-- Analytics events
create table public.analytics_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  event_name text not null,
  event_data jsonb default '{}',
  session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.user_skills enable row level security;
alter table public.user_challenges enable row level security;
alter table public.analytics_events enable row level security;

-- RLS Policies

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view leaderboard" on public.profiles
  for select using (true); -- Public read for leaderboard

-- Lesson completions policies
create policy "Users can view own completions" on public.lesson_completions
  for select using (auth.uid() = user_id);

create policy "Users can insert own completions" on public.lesson_completions
  for insert with check (auth.uid() = user_id);

-- User skills policies
create policy "Users can view own skills" on public.user_skills
  for select using (auth.uid() = user_id);

create policy "Users can update own skills" on public.user_skills
  for all using (auth.uid() = user_id);

-- User challenges policies
create policy "Users can view own challenges" on public.user_challenges
  for select using (auth.uid() = user_id);

create policy "Users can update own challenges" on public.user_challenges
  for all using (auth.uid() = user_id);

-- Analytics events policies
create policy "Users can insert own events" on public.analytics_events
  for insert with check (auth.uid() = user_id);

-- Public read policies for content
create policy "Anyone can view categories" on public.categories
  for select using (is_active = true);

create policy "Anyone can view lessons" on public.lessons
  for select using (is_active = true);

create policy "Anyone can view lesson videos" on public.lesson_videos
  for select using (true);

create policy "Anyone can view skills" on public.skills
  for select using (true);

create policy "Anyone can view challenges" on public.challenges
  for select using (is_active = true);

-- Admin policies
create policy "Admins can manage all content" on public.categories
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Functions

-- Function to update user level based on XP
create or replace function update_user_level()
returns trigger as $$
begin
  -- Update level based on XP
  update public.profiles
  set level = (
    select level from public.level_thresholds
    where min_xp <= new.xp
    order by level desc
    limit 1
  )
  where id = new.id;
  
  return new;
end;
$$ language plpgsql;

-- Function to handle lesson completion
create or replace function handle_lesson_completion()
returns trigger as $$
begin
  -- Update user XP and streak
  update public.profiles
  set 
    xp = xp + new.xp_earned,
    current_streak = case
      when last_active_date = current_date - interval '1 day' then current_streak + 1
      when last_active_date = current_date then current_streak
      else 1
    end,
    longest_streak = greatest(longest_streak, 
      case
        when last_active_date = current_date - interval '1 day' then current_streak + 1
        when last_active_date = current_date then current_streak
        else 1
      end
    ),
    last_active_date = current_date,
    updated_at = now()
  where id = new.user_id;
  
  return new;
end;
$$ language plpgsql;

-- Function to update skill availability
create or replace function update_skill_availability()
returns trigger as $$
begin
  -- Check and update available skills based on user level
  update public.user_skills
  set status = 'available'
  where user_id = new.id
    and skill_id in (
      select id from public.skills
      where required_level <= new.level
    )
    and status = 'locked';
  
  return new;
end;
$$ language plpgsql;

-- Triggers
create trigger on_profile_xp_change
  after update of xp on public.profiles
  for each row execute function update_user_level();

create trigger on_lesson_completion
  after insert on public.lesson_completions
  for each row execute function handle_lesson_completion();

create trigger on_level_change
  after update of level on public.profiles
  for each row execute function update_skill_availability();

-- Insert default level thresholds
insert into public.level_thresholds (level, min_xp, tier) values
(1, 0, 'bronze'),
(2, 100, 'bronze'),
(3, 250, 'bronze'),
(4, 450, 'bronze'),
(5, 700, 'silver'),
(6, 1000, 'silver'),
(7, 1350, 'silver'),
(8, 1750, 'silver'),
(9, 2200, 'silver'),
(10, 2700, 'gold'),
(11, 3250, 'gold'),
(12, 3850, 'gold'),
(13, 4500, 'gold'),
(14, 5200, 'gold'),
(15, 6000, 'platinum'),
(16, 6850, 'platinum'),
(17, 7750, 'platinum'),
(18, 8700, 'platinum'),
(19, 9700, 'platinum'),
(20, 10750, 'diamond');

-- Insert sample categories
insert into public.categories (name, description, color, sort_order) values
('Základy', 'Základní dovednosti a principy', '#3B82F6', 1),
('Pokročilé', 'Pokročilé techniky a koncepty', '#10B981', 2),
('Speciální', 'Specializované moduly', '#8B5CF6', 3);

-- Insert sample skills for hexagon map
insert into public.skills (name, description, required_level, x_position, y_position) values
('Základy 1', 'První základní dovednost', 1, 0, 0),
('Základy 2', 'Druhá základní dovednost', 2, 1, 0),
('Základy 3', 'Třetí základní dovednost', 3, -1, 0),
('Pokročilé 1', 'První pokročilá dovednost', 5, 0, 1),
('Pokročilé 2', 'Druhá pokročilá dovednost', 7, 1, 1),
('Pokročilé 3', 'Třetí pokročilá dovednost', 7, -1, 1),
('Expert 1', 'Expertní dovednost', 10, 0, 2),
('Expert 2', 'Další expertní dovednost', 12, 1, 2),
('Expert 3', 'Poslední expertní dovednost', 12, -1, 2),
('Mistr', 'Mistrovská dovednost', 15, 0, 3);

-- Insert sample challenges
insert into public.challenges (title, description, type, xp_reward, target_value, start_date, end_date) values
('Denní výzva', 'Dokončete 1 lekci dnes', 'daily', 25, 1, current_date, current_date),
('Týdenní maraton', 'Dokončete 5 lekcí tento týden', 'weekly', 100, 5, date_trunc('week', current_date), date_trunc('week', current_date) + interval '6 days'),
('Začátečník', 'Dokončete první 3 lekce', 'special', 150, 3, null, null);