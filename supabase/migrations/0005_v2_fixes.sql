-- ============================================================
-- V2 — Correções aplicadas após auditoria (consolidado)
-- ============================================================

-- is_admin: SECURITY DEFINER + leitura de claims (auth.uid() não confiável p/ JWT custom)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select true from auth.users u
     where u.id::text = nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'
       and u.email = 'davi@modelleunica.com.br'),
    false
  );
$$;

-- RPC de favoritos (contador + evento)
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

-- RPC produtos ativos com estoque agregado (substitui embed de view p/ PostgREST)
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
      and ($1 is null or p.slug = $1)
    order by %I %s
    limit $2
  $f$, v_order, v_dir)
  using p_slug, p_limit;
end $$;

grant execute on function public.products_with_stock(text, boolean, int, text) to anon, authenticated;

-- RPC admin: todos os status
create or replace function public.admin_products_with_stock(
  p_order text default 'sort_order',
  p_asc boolean default true,
  p_limit int default 500
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
    order by %I %s
    limit $1
  $f$, v_order, v_dir)
  using p_limit;
end $$;

grant execute on function public.admin_products_with_stock(text, boolean, int) to authenticated;

-- WhatsApp oficial (correção de número)
update public.settings
set value = value || '{"whatsapp":"556392678729","whatsappDisplay":"+55 63 9267-8729","hours":"","low_stock":2}'::jsonb
where key = 'site';
