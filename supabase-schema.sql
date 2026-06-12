-- Tables pour EricImmo

-- Profils agents (complète auth.users)
create table public.agents (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null default '',
  phone text,
  photo_url text,
  network text,
  bio text,
  created_at timestamptz default now()
);

-- Biens immobiliers
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric not null,
  type text not null default 'villa' check (type in ('villa','apartment','land','commercial','other')),
  status text not null default 'active' check (status in ('active','sold','draft')),
  location text not null,
  area numeric,
  plot numeric,
  bedrooms integer,
  bathrooms integer,
  images text[] default '{}',
  matterport_url text,
  ref text,
  created_at timestamptz default now()
);

-- Sécurité : chaque agent ne voit que ses propres biens
alter table public.agents enable row level security;
alter table public.properties enable row level security;

-- Politiques agents
create policy "Agent voit son propre profil" on public.agents
  for select using (auth.uid() = id);

create policy "Agent modifie son propre profil" on public.agents
  for all using (auth.uid() = id);

-- Politiques biens : lecture publique des biens actifs
create policy "Biens actifs visibles par tous" on public.properties
  for select using (status = 'active');

create policy "Agent gère ses propres biens" on public.properties
  for all using (auth.uid() = agent_id);

-- Trigger : crée automatiquement le profil agent à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.agents (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
