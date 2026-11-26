-- Module d'angariação (CMI) : adapte la table property_mandates (vide)
-- pour qu'un contrat puisse être préparé AVANT la création du bien,
-- et stocke le détail complet du formulaire dans `data`.

alter table public.property_mandates
  alter column property_id drop not null;

alter table public.property_mandates
  drop constraint property_mandates_property_id_fkey,
  add constraint property_mandates_property_id_fkey
    foreign key (property_id) references public.properties(id) on delete set null;

alter table public.property_mandates
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists property_mandates_agent_created_idx
  on public.property_mandates (agent_id, created_at desc);
