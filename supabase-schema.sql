-- Tables pour Habiteo / EricImmo
-- Ce fichier reflète l'état réel de la base Supabase (tables + RLS).
-- Les migrations ont historiquement été appliquées à la main dans le
-- SQL Editor Supabase : ce fichier sert de référence pour recréer la base
-- au besoin, ce n'est pas un journal de migrations.

-- ============================================================
-- AGENTS — profils agents (complète auth.users)
-- ============================================================
create table public.agents (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  contact_email text,
  name text not null default '',
  slug text unique,
  phone text,
  whatsapp text,
  photo_url text,
  network text,
  powered_by text,
  bio text,
  bio_translations jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- PROPERTIES — biens immobiliers
-- ============================================================
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric not null,
  type text not null default 'villa' check (type in ('villa','apartment','land','commercial','other')),
  status text not null default 'active' check (status in ('active','sold','draft')),
  location text not null,
  district text,
  concelho text,
  freguesia text,
  area_bruta_privativa numeric,
  area_bruta_dependente numeric,
  area_utile numeric,
  plot numeric,
  bedrooms integer,
  bathrooms integer,
  images text[] default '{}',
  matterport_url text,
  video_url text,
  ref text,
  is_offmarket boolean not null default false,
  translations jsonb,
  -- Faits légaux/administratifs du bien, utilisés dans le CMI (Contrato de
  -- Mediação Imobiliária) — destinés à terme à être extraits automatiquement
  -- des documents officiels (caderneta predial, certificado energético...).
  matriz_artigo text,
  conservatoria_registo text,
  conservatoria_numero text,
  certificado_energetico_numero text,
  certificado_energetico_validade date,
  licenca_numero text,
  licenca_data date,
  ano_construcao integer,
  created_at timestamptz default now()
);

-- ============================================================
-- BUYERS — acheteurs / prospects, propres à chaque agent (CRM)
-- ============================================================
create table public.buyers (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  name text not null,
  first_name text,
  last_name text,
  company text,
  email text,
  phone text,
  nationality text,
  birthday date,
  source text,
  property_type text,
  budget_min numeric,
  budget_max numeric,
  bedrooms_min integer,
  district text,
  concelho text,
  freguesia text,
  area_min numeric,
  area_max numeric,
  status text not null default 'cold' check (status in ('hot','warm','cold')),
  notes text,
  first_contact date,
  last_contact date,
  contact_synced_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- COLLEAGUES — confrères / agents du réseau, propres à chaque agent
-- ============================================================
create table public.colleagues (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.agents(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  title text,
  agency text,
  phone text,
  email text,
  district text,
  concelho text,
  specialty text,
  property_id uuid references public.properties(id) on delete set null,
  notes text,
  contact_synced_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- MATCHES — résultat du moteur de matching acheteur ↔ bien
-- Créés/mis à jour uniquement côté serveur (clé service role),
-- le moteur bypass donc la RLS ci-dessous.
-- ============================================================
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references public.buyers(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  buyer_agent_id uuid references public.agents(id) on delete cascade not null,
  seller_agent_id uuid references public.agents(id) on delete cascade not null,
  score integer not null,
  status text not null default 'new' check (status in ('new','seen','dismissed')),
  notified_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- PROPERTY_MANDATES — CMI (Contrato de Mediação Imobiliária) d'un bien.
-- Données privées à l'agent (jamais publiques) : identité du/des
-- propriétaire(s), conditions du mandat. Le texte légal du contrat est
-- généré côté application à partir de ces données, pas stocké ici.
-- ============================================================
create table public.property_mandates (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  agent_id uuid references public.agents(id) on delete cascade not null,
  contract_type text not null default 'exclusivo' check (contract_type in ('exclusivo','semi_exclusivo','nao_exclusivo')),
  business_type text not null default 'compra' check (business_type in ('compra','trespasse','arrendamento')),
  -- Propriétaire(s) — tableau d'objets (personne singulière ou collective),
  -- structure volontairement souple (JSON) plutôt qu'une table dédiée : ces
  -- champs sont saisis une fois puis figés dans le PDF généré, jamais
  -- requêtés individuellement.
  owners jsonb not null default '[]'::jsonb,
  price numeric,
  additional_service_fee numeric,
  liens_free boolean not null default true,
  liens_description text,
  commission_type text not null default 'percentage' check (commission_type in ('percentage','fixed')),
  commission_percentage numeric,
  commission_fixed_amount numeric,
  payment_full_at_deed boolean not null default true,
  payment_split_promissory_pct numeric,
  payment_split_deed_pct numeric,
  lister_name text,
  lister_id_doc text,
  lister_nif text,
  lister_phone text,
  lister_email text,
  competent_court text,
  special_conditions text,
  contract_duration_months integer not null default 6,
  status text not null default 'draft' check (status in ('draft','signed','terminated')),
  signed_at date,
  created_at timestamptz default now()
);

-- ============================================================
-- PROPERTY_DOCUMENTS — documents officiels déposés sur un bien (caderneta
-- predial, certificado energético...). Toujours privés à l'agent — jamais
-- exposés sur la fiche publique, seules les données qu'on en extrait le
-- sont via les colonnes dédiées de `properties`.
-- ============================================================
create table public.property_documents (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  agent_id uuid references public.agents(id) on delete cascade not null,
  doc_type text not null check (doc_type in ('caderneta_predial','certificado_energetico','certidao_registo_predial','licenca_utilizacao','outro')),
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- ============================================================
-- STORAGE — buckets utilisés par l'app
--   agent-photos       : photo de profil de l'agent (public)
--   property-images    : photos des biens (public)
--   property-documents : documents officiels des biens (privé — accès
--                        uniquement via URL signée, jamais de lecture
--                        publique anonyme)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('agent-photos', 'agent-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('property-documents', 'property-documents', false)
on conflict (id) do nothing;

-- Bucket privé : seul le propriétaire du dossier (agentId/...) peut lire/écrire/supprimer.
create policy "Agent gère ses propres documents" on storage.objects
  for all using (bucket_id = 'property-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'property-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- SÉCURITÉ (Row Level Security)
-- ============================================================
alter table public.agents enable row level security;
alter table public.properties enable row level security;
alter table public.buyers enable row level security;
alter table public.colleagues enable row level security;
alter table public.matches enable row level security;
alter table public.property_mandates enable row level security;
alter table public.property_documents enable row level security;

-- Agents : lecture publique du profil (pages publiques /agents/[slug]),
-- mais chacun ne modifie que le sien.
create policy "Profils agents visibles par tous" on public.agents
  for select using (true);

create policy "Agent modifie son propre profil" on public.agents
  for update using (auth.uid() = id);

create policy "Agent crée son propre profil" on public.agents
  for insert with check (auth.uid() = id);

-- Properties : lecture publique des biens actifs et non off-market ;
-- l'agent propriétaire gère l'intégralité de ses biens (y compris
-- off-market / brouillon / vendu).
create policy "Biens actifs et non off-market visibles par tous" on public.properties
  for select using (status = 'active' and is_offmarket = false);

create policy "Agent gère ses propres biens" on public.properties
  for all using (auth.uid() = agent_id) with check (auth.uid() = agent_id);

-- Buyers : données privées du CRM, réservées à l'agent propriétaire.
create policy "Agent gère ses propres acheteurs" on public.buyers
  for all using (auth.uid() = agent_id) with check (auth.uid() = agent_id);

-- Colleagues : idem, privé à l'agent propriétaire.
create policy "Agent gère ses propres collègues" on public.colleagues
  for all using (auth.uid() = agent_id) with check (auth.uid() = agent_id);

-- Matches : visibles par l'agent acheteur ou l'agent vendeur concerné ;
-- statut modifiable par l'un ou l'autre. Création/suppression réservées
-- au moteur de matching (clé service role, hors RLS).
create policy "Agent voit les matchs qui le concernent" on public.matches
  for select using (auth.uid() = buyer_agent_id or auth.uid() = seller_agent_id);

create policy "Agent modifie le statut des matchs qui le concernent" on public.matches
  for update using (auth.uid() = buyer_agent_id or auth.uid() = seller_agent_id);

-- Property mandates (CMI) : données sensibles (propriétaire, conditions
-- commerciales), strictement privées à l'agent qui gère le bien.
create policy "Agent gère les mandats de ses propres biens" on public.property_mandates
  for all using (auth.uid() = agent_id) with check (auth.uid() = agent_id);

-- Property documents : strictement privés à l'agent propriétaire du bien.
create policy "Agent gère les documents de ses propres biens" on public.property_documents
  for all using (auth.uid() = agent_id) with check (auth.uid() = agent_id);

-- ============================================================
-- Trigger : crée automatiquement le profil agent à l'inscription
-- ============================================================
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
