-- ============================================================
-- MODELLE ÚNICA — Schema completo
-- Postgres 17 / Supabase
-- ============================================================

-- ---------- CATEGORIAS ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- COLEÇÕES ----------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PRODUTOS ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  fabric text not null default '',
  size_chart text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  images text[] not null default '{}',
  tags text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active','draft','inactive')),
  views int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- VARIAÇÕES (tamanho × cor × estoque) ----------
create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default '',
  color text not null default '',
  stock int not null default 0,
  unique(product_id, size, color)
);
create index if not exists idx_variants_product on public.variants(product_id);

-- ---------- BANNERS ----------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  image_url text not null,
  link_url text not null default '',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- CONFIGURAÇÕES (contato, textos institucionais) ----------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- LOG DE CLIQUES NO WHATSAPP ----------
create table if not exists public.whatsapp_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  size text,
  color text,
  source_page text not null default 'product',
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_clicks_created on public.whatsapp_clicks(created_at desc);

-- ---------- TRIGGER updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.categories    enable row level security;
alter table public.collections   enable row level security;
alter table public.products      enable row level security;
alter table public.variants      enable row level security;
alter table public.banners       enable row level security;
alter table public.settings      enable row level security;
alter table public.whatsapp_clicks enable row level security;

-- Leitura pública apenas de produtos ATIVOS e relacionamentos
create policy "public read products" on public.products
  for select using (status = 'active');

create policy "public read categories" on public.categories
  for select using (true);

create policy "public read collections" on public.collections
  for select using (active = true);

create policy "public read variants" on public.variants
  for select using (true);

create policy "public read banners" on public.banners
  for select using (active = true);

-- Configurações: leitura pública, escrita só admin
create policy "public read settings" on public.settings
  for select using (true);

-- Escrita autenticada (painel admin)
create policy "admin write products" on public.products
  for all to authenticated using (true) with check (true);
create policy "admin write categories" on public.categories
  for all to authenticated using (true) with check (true);
create policy "admin write collections" on public.collections
  for all to authenticated using (true) with check (true);
create policy "admin write variants" on public.variants
  for all to authenticated using (true) with check (true);
create policy "admin write banners" on public.banners
  for all to authenticated using (true) with check (true);
create policy "admin write settings" on public.settings
  for all to authenticated using (true) with check (true);

-- Cliques: público pode INSERIR (log anônimo), só admin lê
create policy "anon insert clicks" on public.whatsapp_clicks
  for insert to anon, authenticated with check (true);
create policy "admin read clicks" on public.whatsapp_clicks
  for select to authenticated using (true);

-- ============================================================
-- STORAGE — bucket de imagens
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-images', 'product-images', true, 5242880)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admin upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "admin update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

create policy "admin delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- ============================================================
-- VIEW DE ESTOQUE AGREGADO (para filtros e badges)
-- ============================================================
create or replace view public.product_stock_summary as
select
  p.id as product_id,
  coalesce(sum(v.stock), 0) as total_stock
from public.products p
left join public.variants v on v.product_id = p.id
group by p.id;
