-- Gestión de Cobranza: historial de gestiones, compromisos de pago y pausa de servicio.
-- El acceso se hace solo desde rutas de API con service role y validación de permisos,
-- por eso se activa RLS sin políticas (bloquea el acceso directo con la llave anónima).

create table if not exists public.collection_activities (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  activity_type text not null check (activity_type in ('email', 'whatsapp', 'call', 'note', 'promise', 'pause', 'resume')),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists collection_activities_client_idx
  on public.collection_activities (client_id, created_at desc);

create table if not exists public.payment_promises (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  promised_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency_id uuid references public.currencies(id),
  note text,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'broken', 'cancelled')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_promises_client_idx
  on public.payment_promises (client_id, status, promised_date);

create table if not exists public.collection_client_status (
  client_id uuid primary key references public.clients(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  service_paused boolean not null default false,
  pause_reason text,
  paused_at timestamptz,
  paused_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.collection_activities enable row level security;
alter table public.payment_promises enable row level security;
alter table public.collection_client_status enable row level security;
