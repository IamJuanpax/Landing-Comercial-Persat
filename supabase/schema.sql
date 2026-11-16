-- =============================================================================
-- Schema de Supabase para el Portal de Automatizaciones · Comercial Persat
-- =============================================================================
-- Instrucciones:
-- 1. Abrí tu proyecto en https://supabase.com/dashboard
-- 2. En el menú izquierdo, entrá a "SQL Editor" -> "New query"
-- 3. Pegá todo este archivo y hacé clic en "Run"
-- =============================================================================

create table if not exists public.consultas (
  id text primary key,
  vertical text not null check (vertical in ('tecnicos', 'vendedores', 'logistica')),
  pregunta text not null,
  tipo_deal text not null,
  descripcion text not null,
  deal text not null default '',
  autor text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'analisis', 'resuelta', 'descartada')),
  creado_en timestamptz not null default now(),
  editado_en timestamptz
);

-- Índice para listar rápidamente las consultas ordenadas por fecha de creación
create index if not exists consultas_creado_en_idx
  on public.consultas (creado_en desc);

-- Índice para filtrar por vertical o estado
create index if not exists consultas_vertical_estado_idx
  on public.consultas (vertical, estado);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
-- Habilitamos RLS y creamos políticas para permitir operar desde el portal
-- interno sin login (equivalente al portal original).
-- Si en el futuro agregás autenticación (Supabase Auth) o usás únicamente
-- SUPABASE_SERVICE_ROLE_KEY en el servidor, podés restringir estas políticas.

alter table public.consultas enable row level security;

drop policy if exists "Permitir lectura de consultas" on public.consultas;
create policy "Permitir lectura de consultas"
  on public.consultas
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Permitir crear consultas" on public.consultas;
create policy "Permitir crear consultas"
  on public.consultas
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Permitir actualizar consultas" on public.consultas;
create policy "Permitir actualizar consultas"
  on public.consultas
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Permitir eliminar consultas" on public.consultas;
create policy "Permitir eliminar consultas"
  on public.consultas
  for delete
  to anon, authenticated
  using (true);
