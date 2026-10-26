-- =====================================================================
-- TEMA INTEGRADOR II - PROJETO TI VERDE
-- BeautyCycle - Salão de Beleza Lucia
-- Script de criação do banco de dados (PostgreSQL / Supabase)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABELAS
-- ---------------------------------------------------------------------

create table public.salao (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  nome         varchar(120) not null,
  responsavel  varchar(120) not null,
  bairro       varchar(80),
  cidade       varchar(80),
  telefone     varchar(20),
  criado_em    timestamptz not null default now()
);

create table public.auditorias (
  id              uuid primary key default gen_random_uuid(),
  salao_id        uuid not null references public.salao(id) on delete cascade,
  mes_referencia  date not null,
  observacoes     text,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  -- o mês de referência deve ser sempre o dia 1 (ex.: 2026-10-01)
  constraint auditorias_mes_dia1 check (extract(day from mes_referencia) = 1)
);

-- RN02: só uma auditoria ATIVA por mês (auditorias inativadas não bloqueiam)
create unique index auditorias_salao_mes_ativo_uk
  on public.auditorias (salao_id, mes_referencia)
  where ativo;

create table public.consumos (
  id            uuid primary key default gen_random_uuid(),
  auditoria_id  uuid not null references public.auditorias(id) on delete cascade,
  tipo          varchar(20) not null,
  valor_reais   numeric(10,2) not null,
  quantidade    numeric(10,2) not null,
  unidade       varchar(15) not null,
  produto       varchar(120),
  constraint consumos_tipo_ck    check (tipo in ('agua', 'energia', 'produtos')),
  constraint consumos_unidade_ck check (unidade in ('m3', 'kWh', 'unidades')),
  constraint consumos_valor_ck   check (valor_reais >= 0),
  constraint consumos_qtd_ck     check (quantidade >= 0)
);

create table public.desperdicios (
  id              uuid primary key default gen_random_uuid(),
  auditoria_id    uuid not null references public.auditorias(id) on delete cascade,
  produto         varchar(120) not null,
  quantidade      numeric(10,2) not null,
  unidade         varchar(15) not null,
  valor_estimado  numeric(10,2) not null,
  motivo          varchar(30) not null,
  constraint desperdicios_unidade_ck check (unidade in ('g', 'ml', 'unidades')),
  constraint desperdicios_motivo_ck check (motivo in ('sobra', 'validade', 'erro_mistura', 'outro')),
  constraint desperdicios_qtd_ck    check (quantidade >= 0),
  constraint desperdicios_valor_ck  check (valor_estimado >= 0)
);

-- Índices nas chaves estrangeiras (consultas mais rápidas)
create index consumos_auditoria_idx     on public.consumos (auditoria_id);
create index desperdicios_auditoria_idx on public.desperdicios (auditoria_id);
create index auditorias_salao_idx       on public.auditorias (salao_id);

-- ---------------------------------------------------------------------
-- 2. SEGURANÇA (Row Level Security)
-- Cada usuário só enxerga e altera os dados do PRÓPRIO salão.
-- ---------------------------------------------------------------------

alter table public.salao        enable row level security;
alter table public.auditorias   enable row level security;
alter table public.consumos     enable row level security;
alter table public.desperdicios enable row level security;

create policy "salao_somente_dono"
  on public.salao for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "auditorias_somente_dono"
  on public.auditorias for all to authenticated
  using (salao_id in (
    select id from public.salao where user_id = (select auth.uid())
  ))
  with check (salao_id in (
    select id from public.salao where user_id = (select auth.uid())
  ));

create policy "consumos_somente_dono"
  on public.consumos for all to authenticated
  using (auditoria_id in (
    select a.id from public.auditorias a
    join public.salao s on s.id = a.salao_id
    where s.user_id = (select auth.uid())
  ))
  with check (auditoria_id in (
    select a.id from public.auditorias a
    join public.salao s on s.id = a.salao_id
    where s.user_id = (select auth.uid())
  ));

create policy "desperdicios_somente_dono"
  on public.desperdicios for all to authenticated
  using (auditoria_id in (
    select a.id from public.auditorias a
    join public.salao s on s.id = a.salao_id
    where s.user_id = (select auth.uid())
  ))
  with check (auditoria_id in (
    select a.id from public.auditorias a
    join public.salao s on s.id = a.salao_id
    where s.user_id = (select auth.uid())
  ));

-- =====================================================================
-- FIM DO SCRIPT 1. Depois de rodar, foi criado o usuário da responsável do salão em
-- Authentication > Users.
-- =====================================================================

-- =====================================================================
-- SCRIPT 2 
-- Por questões de segurança os dados da responsável do salão foram omitidos do script abaixo
-- =====================================================================

-- insert into public.salao (user_id, nome, responsavel, bairro, cidade, telefone)
-- values (
--   'ID-DO-USUARIO',
--   'Salão de Beleza',
--   'NOME-DA-RESPONSÁVEL',
--   'Nome-do-bairro',
--   'Nome-do-município',
--   ''
-- );