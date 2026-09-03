-- ============================================================
-- V2 — Evolução: novos campos, eventos, constraints, settings
-- ============================================================

-- PRODUCTS: descrição curta, imagem principal, novidade, favoritos
alter table public.products
  add column if not exists short_description text not null default '',
  add column if not exists main_image text,
  add column if not exists is_new boolean not null default false,
  add column if not exists favorites_count int not null default 0;

-- Regras de integridade
alter table public.products drop constraint if exists products_promo_check;
alter table public.products
  add constraint products_promo_check check (promo_price is null or promo_price <= price);

alter table public.variants drop constraint if exists variants_stock_nonneg;
alter table public.variants
  add constraint variants_stock_nonneg check (stock >= 0);

-- CATEGORIES: descrição, imagem, ativo
alter table public.categories
  add column if not exists description text not null default '',
  add column if not exists image_url text,
  add column if not exists active boolean not null default true;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (active = true);

-- COLLECTIONS: banner, período, destaque
alter table public.collections
  add column if not exists banner_url text,
  add column if not exists period_text text not null default '',
  add column if not exists featured boolean not null default false;

-- BANNERS: imagem mobile, CTA, período de exibição
alter table public.banners
  add column if not exists image_mobile_url text,
  add column if not exists cta_text text not null default '',
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

-- EVENTS: registro leve de comportamento
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('view','wa_click','favorite','share','search','filter')),
  product_id uuid references public.products(id) on delete set null,
  term text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_events_type_created on public.events(type, created_at desc);
alter table public.events enable row level security;
create policy "public insert events" on public.events
  for insert to anon, authenticated with check (true);
create policy "admin read events" on public.events
  for select to authenticated using (public.is_admin());

-- RPC: favoritar (contador + evento), permitido ao público
create or replace function public.log_favorite(p_product_id uuid, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_delta not in (-1, 1) then return; end if;
  update public.products
  set favorites_count = greatest(0, favorites_count + p_delta)
  where id = p_product_id;
  insert into public.events (type, product_id) values ('favorite', p_product_id);
end $$;
grant execute on function public.log_favorite(uuid, int) to anon, authenticated;

-- SETTINGS: corrige número oficial do WhatsApp + novos campos
update public.settings
set value = value || '{"whatsapp":"556392678729","whatsappDisplay":"+55 63 9267-8729","hours":"","low_stock":2}'::jsonb
where key = 'site';
