-- ============================================================
-- V5 — restock_interest, available_at, admin_stats_30d, depoimentos
-- ============================================================

-- 1) Novo tipo de evento: interesse em reposição
--    (CHECK inline do events precisa ser recriado)
do $$ begin
  alter table public.events drop constraint if exists events_type_check;
exception when undefined_object then null; end $$;

do $$ begin
  alter table public.events
    add constraint events_type_check
    check (type in ('view','wa_click','favorite','share','search','filter','wa_order','restock_interest'));
exception when duplicate_object then null; end $$;

grant insert on public.events to anon, authenticated;

-- 2) Agendamento de publicação
alter table public.products add column if not exists available_at timestamptz;

-- 3) RPC pública passa a ocultar produtos com available_at futuro.
--    (mesma assinatura e retorno setof json da 0005; só o WHERE muda)
create or replace function public.products_with_stock(
  p_order text default 'sort_order',
  p_asc boolean default true,
  p_limit int default 500,
  p_slug text default null
)
returns setof json
language plpgsql
stable
set search_path = public
as $$
declare
  v_order text := case
    when p_order in ('sort_order','created_at','views','favorites_count','price') then p_order
    else 'sort_order' end;
  v_dir text := case when p_asc then 'asc' else 'desc' end;
begin
  return query execute format($f$
    select (to_jsonb(p) || jsonb_build_object(
      'total_stock', coalesce((select sum(v.stock) from public.variants v where v.product_id = p.id), 0),
      'category', (select jsonb_build_object('name', c.name, 'slug', c.slug) from public.categories c where c.id = p.category_id),
      'collection', (select jsonb_build_object('name', k.name, 'slug', k.slug, 'period_text', k.period_text) from public.collections k where k.id = p.collection_id)
    ))::json
    from public.products p
    where p.status = 'active'
      and (p.available_at is null or p.available_at <= now())
      and ($1 is null or p.slug = $1)
    order by %I %s
    limit $2
  $f$, v_order, v_dir)
  using p_slug, p_limit;
end $$;

grant execute on function public.products_with_stock(text, boolean, int, text) to anon, authenticated;

-- 4) Estatísticas 30d p/ dashboard (views e wa_order por dia + comparativo)
create or replace function public.admin_stats_30d()
returns setof json
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin() then (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      with dias as (
        select generate_series(
          (current_date - interval '29 days')::date,
          current_date::date,
          interval '1 day'
        )::date as day
      ),
      ev as (
        select created_at::date as day,
          count(*) filter (where type = 'view')::int as views,
          count(*) filter (where type = 'wa_order')::int as wa_orders
        from public.events
        where created_at >= current_date - interval '59 days'
        group by 1
      )
      select d.day::text as day,
        coalesce(e.views, 0) as views,
        coalesce(e.wa_orders, 0) as wa_orders,
        coalesce(b.views, 0) as prev_views,
        coalesce(b.wa_orders, 0) as prev_wa_orders
      from dias d
      left join ev e on e.day = d.day
      left join ev b on b.day = (d.day - 30)
      order by d.day
    ) t
  ) else '[]'::json end;
$$;

-- Admin-only: EXECUTE implícito p/ PUBLIC é revogado + check is_admin() interno
-- (dupla proteção: nem anon nem token sem claim admin leem stats).
revoke execute on function public.admin_stats_30d() from public;
revoke execute on function public.admin_stats_30d() from anon;
grant execute on function public.admin_stats_30d() to authenticated;

-- 5) Depoimentos seed (settings.key = 'depoimentos') — 3 exemplos realistas
insert into public.settings (key, value)
values (
  'depoimentos',
  '[
    {"name": "Camila R.", "text": "Passei pra contar: o conjunto chegou super rápido e o caimento é impecável. Atendimento nota mil, me ajudaram a escolher o tamanho pelo WhatsApp.", "rating": 5},
    {"name": "Juliana M.", "text": "Já é a terceira compra! Tecido de qualidade, cor igual às fotos e troca fácil quando precisei trocar o tamanho. Recomendo de olhos fechados.", "rating": 5},
    {"name": "Fernanda L.", "text": "Peças lindas e exclusivas, sempre recebo elogios quando uso. A loja que confio pra comprar leggings sem medo de ficar transparente.", "rating": 4}
  ]'::jsonb
)
on conflict (key) do nothing;
