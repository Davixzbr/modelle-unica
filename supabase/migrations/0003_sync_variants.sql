create or replace function public.sync_variants(
  p_product_id uuid,
  p_variants jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  v_existing_id uuid;
begin
  -- Upsert de cada tamanho×cor
  for v in
    select
      elem->>'size' as size,
      elem->>'color' as color,
      coalesce((elem->>'stock')::int, 0) as stock
    from jsonb_array_elements(p_variants) as elem
  loop
    select id into v_existing_id
    from public.variants
    where product_id = p_product_id
      and size = v.size
      and color = v.color
    limit 1;

    if v_existing_id is not null then
      update public.variants
      set stock = v.stock
      where id = v_existing_id;
    else
      insert into public.variants (product_id, size, color, stock)
      values (p_product_id, v.size, v.color, v.stock);
    end if;
  end loop;

  -- Remove variantes que saíram da grade
  delete from public.variants
  where product_id = p_product_id
    and (size, color) not in (
      select elem->>'size', coalesce(elem->>'color', '')
      from jsonb_array_elements(p_variants) as elem
    );
end $$;
