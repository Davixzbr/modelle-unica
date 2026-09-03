import { createClient } from "@/lib/supabase-server";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminClicksPage() {
  const supabase = await createClient();
  const { data: clicks } = await supabase
    .from("whatsapp_clicks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const total = clicks?.length ?? 0;

  return (
    <>
      <h1 className="mb-1 text-2xl">Interesses (cliques no WhatsApp)</h1>
      <p className="mb-6 text-sm text-gray-500">
        Cada clique em "Comprar pelo WhatsApp" registra o produto, tamanho e cor escolhidos —
        sua demanda em tempo real, sem checkout.
      </p>

      <table className="a-table">
        <thead>
          <tr>
            <th>Data / hora</th>
            <th>Produto</th>
            <th>Tamanho</th>
            <th>Cor</th>
          </tr>
        </thead>
        <tbody>
          {clicks?.map((c) => (
            <tr key={c.id}>
              <td className="whitespace-nowrap text-gray-600">{fmtDate(c.created_at)}</td>
              <td className="font-medium">{c.product_name || "—"}</td>
              <td>{c.size || "—"}</td>
              <td>{c.color || "—"}</td>
            </tr>
          ))}
          {!total && (
            <tr>
              <td colSpan={4} className="py-10 text-center text-gray-500">
                Nenhum clique registrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {total >= 200 && (
        <p className="mt-3 text-xs text-gray-400">Exibindo os 200 registros mais recentes.</p>
      )}
    </>
  );
}
