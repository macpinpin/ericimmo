-- Valeurs mémorisées par agent pour ses prochains contrats (CMI),
-- ex. { "angariador": { nome, documento, nif, telefone, email }, "angariadorNA": false }
alter table public.agents
  add column if not exists cmi_defaults jsonb;
