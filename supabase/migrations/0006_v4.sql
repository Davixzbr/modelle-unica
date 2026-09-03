-- ============================================================
-- V4 — Carrinho + pedido-assistido (WhatsApp)
-- ============================================================

-- 1) Novo tipo de evento: pedido montado no carrinho
--    (CHECK inline do events precisa ser recriado)
do $$ begin
  alter table public.events drop constraint if exists events_type_check;
exception when undefined_object then null; end $$;

do $$ begin
  alter table public.events
    add constraint events_type_check
    check (type in ('view','wa_click','favorite','share','search','filter','wa_order'));
exception when duplicate_object then null; end $$;

-- 2) Grant defensivo p/ inserts anônimos de eventos (já coberto em 0004,
--    idempotente por garantia)
grant insert on public.events to anon, authenticated;

-- 3) Índice p/ dashboard de pedidos
create index if not exists idx_events_wa_order
  on public.events(created_at desc) where type = 'wa_order';
