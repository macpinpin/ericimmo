-- Étape 2 de l'angariação : documents du dossier (vendeur + bien).
-- Les documents sont rattachés au mandat (CMI) dès le dépôt, avant que
-- le bien existe ; property_id est renseigné à la création de l'annonce.

alter table public.property_documents
  alter column property_id drop not null;

alter table public.property_documents
  drop constraint property_documents_property_id_fkey,
  add constraint property_documents_property_id_fkey
    foreign key (property_id) references public.properties(id) on delete set null;

alter table public.property_documents
  add column if not exists mandate_id uuid references public.property_mandates(id) on delete cascade,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists extracted jsonb;
-- file_url contient le chemin dans le bucket privé « property-documents »
-- (ex. <agent_id>/<mandate_id>/<fichier>), lu via une URL signée.

-- Types de documents de la liste « Documentos obrigatórios para angariação »
alter table public.property_documents
  drop constraint property_documents_doc_type_check,
  add constraint property_documents_doc_type_check check (doc_type in (
    'a_classer', 'cartao_cidadao', 'passaporte', 'bilhete_identidade', 'cartao_contribuinte',
    'certidao_comercial', 'caderneta_predial', 'certidao_registo_predial', 'licenca_utilizacao',
    'ficha_tecnica', 'planta', 'certificado_energetico', 'procuracao', 'contrato_arrendamento', 'outro'
  ));

create index if not exists property_documents_mandate_idx on public.property_documents (mandate_id);
