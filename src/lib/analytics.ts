import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

type EventType =
  | "view"
  | "wa_click"
  | "favorite"
  | "share"
  | "search"
  | "filter"
  | "wa_order"
  | "restock_interest";

/** Insere evento no banco. Fire-and-forget: nunca bloqueia nem lança. */
export function logEvent(
  type: EventType,
  opts: { product_id?: string; term?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        type,
        product_id: opts.product_id ?? null,
        term: opts.term ?? null,
        metadata: opts.metadata ?? {},
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* logging nunca quebra a UI */
  }
}

/** RPC log_favorite: incrementa/diminui contador e registra evento. */
export function logFavorite(productId: string, delta: 1 | -1) {
  try {
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabase.rpc("log_favorite", { p_product_id: productId, p_delta: delta }).then(
      () => {},
      () => {}
    );
  } catch {
    /* noop */
  }
}
