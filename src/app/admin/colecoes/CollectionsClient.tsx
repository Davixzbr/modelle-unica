"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ToastHost from "@/components/Toast";
import { toast } from "@/components/Toast";
import type { Collection } from "@/lib/types";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  banner_url: string;
  period_text: string;
  featured: boolean;
  active: boolean;
};

const EMPTY: Draft = {
  name: "",
  slug: "",
  description: "",
  banner_url: "",
  period_text: "",
  featured: false,
  active: true,
};

export default function CollectionsClient({ initial }: { initial: Collection[] }) {
  const [rows, setRows] = useState<Collection[]>(initial);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Collection | null>(null);
  const router = useRouter();

  async function save() {
    if (!editing || !editing.name.trim()) {
      toast("Informe o nome da coleção.", "error");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const payload = {
      name: editing.name.trim(),
      slug: editing.slug || editing.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: editing.description || null,
      banner_url: editing.banner_url || null,
      period_text: editing.period_text,
      featured: editing.featured,
      active: editing.active,
    };
    const { error } = editing.id
      ? await supabase.from("collections").update(payload).eq("id", editing.id)
      : await supabase.from("collections").insert(payload);
    if (error) toast("Não foi possível salvar a coleção.", "error");
    else {
      toast("Coleção salva com sucesso.", "success");
      setEditing(null);
      router.refresh();
    }
    setBusy(false);
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await createClient().from("collections").delete().eq("id", toDelete.id);
    if (error) toast("Não foi possível excluir (verifique se há produtos ligados a ela).", "error");
    else {
      toast("Coleção excluída.", "success");
      setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
      router.refresh();
    }
    setToDelete(null);
    setBusy(false);
  }

  async function toggleActive(c: Collection) {
    await createClient().from("collections").update({ active: !c.active }).eq("id", c.id);
    setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, active: !r.active } : r)));
    router.refresh();
  }

  return (
    <>
      <ToastHost />
      <div className="a-pagehead">
        <div>
          <h1>Coleções</h1>
          <p>Campanhas sazonais que agrupam produtos na loja.</p>
        </div>
        <button className="a-btn" onClick={() => setEditing({ ...EMPTY })}>
          <Icon name="plus" size={15} /> Nova coleção
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="a-card">
          <div className="a-empty">
            <div className="ic">
              <Icon name="tag" size={36} />
            </div>
            <div className="t">Nenhuma coleção criada</div>
            <p>Crie campanhas como “Verão 2027” ou “Black Friday”.</p>
            <button className="a-btn" onClick={() => setEditing({ ...EMPTY })}>
              Criar coleção
            </button>
          </div>
        </div>
      ) : (
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Coleção</th>
                <th>Período</th>
                <th>Produtos</th>
                <th>Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="a-cellmain">
                    {c.name}
                    {c.featured && <span className="a-badge amber ml-2">Destaque</span>}
                  </td>
                  <td className="text-[color:var(--a-muted)]">{c.period_text || "—"}</td>
                  <td className="tabular-nums">{c.product_count ?? "—"}</td>
                  <td>
                    <button onClick={() => toggleActive(c)} title="Alternar">
                      <span className={`a-badge ${c.active ? "green" : "gray"}`}>
                        {c.active ? "Ativa" : "Inativa"}
                      </span>
                    </button>
                  </td>
                  <td>
                    <RowActions
                      onEdit={() =>
                        setEditing({
                          id: c.id,
                          name: c.name,
                          slug: c.slug,
                          description: c.description || "",
                          banner_url: c.banner_url || "",
                          period_text: c.period_text || "",
                          featured: c.featured,
                          active: c.active,
                        })
                      }
                      onDelete={() => setToDelete(c)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[rgb(34_29_22/0.45)]" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-xl border border-[color:var(--a-border)] shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-[15px] mb-4">
              {editing.id ? "Editar coleção" : "Nova coleção"}
            </h3>
            <div className="grid gap-3">
              <div>
                <label>Nome *</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex.: Verão 2027"
                />
              </div>
              <div>
                <label>Descrição</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="a-grid2">
                <div>
                  <label>Período (texto)</label>
                  <input
                    value={editing.period_text}
                    onChange={(e) => setEditing({ ...editing, period_text: e.target.value })}
                    placeholder="Ex.: dez 2026 – fev 2027"
                  />
                </div>
                <div>
                  <label>Banner (URL)</label>
                  <input
                    value={editing.banner_url}
                    onChange={(e) => setEditing({ ...editing, banner_url: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
              </div>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 text-sm font-normal normal-case tracking-normal">
                  <input
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                    style={{ width: 16 }}
                  />
                  Coleção em destaque
                </label>
                <label className="flex items-center gap-2 text-sm font-normal normal-case tracking-normal">
                  <input
                    type="checkbox"
                    checked={editing.active}
                    onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                    style={{ width: 16 }}
                  />
                  Ativa
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="a-btn secondary" onClick={() => setEditing(null)} disabled={busy}>
                Cancelar
              </button>
              <button className="a-btn" onClick={save} disabled={busy}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Excluir "${toDelete.name}"?`}
          message="Produtos ligados a ela ficarão sem coleção (não são excluídos)."
          confirmLabel="Excluir"
          busy={busy}
          onCancel={() => setToDelete(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="a-iconbtn" aria-label="Ações" onClick={() => setOpen((v) => !v)}>
        <Icon name="more" size={17} />
      </button>
      {open && (
        <div className="a-menu" onMouseLeave={() => setOpen(false)}>
          <button onClick={onEdit}>
            <Icon name="edit" size={15} /> Editar
          </button>
          <button className="danger" onClick={onDelete}>
            <Icon name="trash" size={15} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}
