"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { slugify, compressImage } from "@/lib/format";
import { toast } from "@/components/Toast";
import ToastHost from "@/components/Toast";
import { Spinner } from "@/components/States";
import Icon from "@/components/Icon";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Categorie } from "@/lib/types";

export default function CategoriesClient({
  initialCats,
  counts,
}: {
  initialCats: Categorie[];
  counts: Record<string, number>;
}) {
  const [cats, setCats] = useState(initialCats);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Categorie | null>(null);

  const supabase = () => createClient();

  async function addCat(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.trim()) return;
    setBusy(true);
    const { data, error } = await supabase()
      .from("categories")
      .insert({ name: newCat.trim(), slug: slugify(newCat), sort_order: cats.length + 1 })
      .select()
      .single();
    setBusy(false);
    if (error) return toast("Não foi possível criar a categoria.", "error");
    setCats((prev) => [...prev, data as Categorie]);
    setNewCat("");
    toast("Categoria criada com sucesso.");
  }

  async function renameCat(id: string, name: string) {
    const v = name.trim();
    if (!v) return;
    const { error } = await supabase().from("categories").update({ name: v }).eq("id", id);
    if (error) return toast("Não foi possível renomear.", "error");
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, name: v } : c)));
    toast("Categoria renomeada.");
  }

  async function toggleCat(c: Categorie) {
    const { error } = await supabase()
      .from("categories")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) return toast("Não foi possível atualizar.", "error");
    setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
  }

  async function setCatImage(c: Categorie, file: File) {
    const compressed = await compressImage(file, 1200);
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const path = `cat-${c.slug}-${Date.now()}.${ext}`;
    const { error } = await supabase()
      .storage.from("product-images")
      .upload(path, compressed, { contentType: compressed.type });
    if (error) return toast("Falha no upload da imagem.", "error");
    const { data } = supabase().storage.from("product-images").getPublicUrl(path);
    const { error: upErr } = await supabase()
      .from("categories")
      .update({ image_url: data.publicUrl })
      .eq("id", c.id);
    if (upErr) return toast("Não foi possível salvar a imagem.", "error");
    setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, image_url: data.publicUrl } : x)));
    toast("Imagem da categoria atualizada.");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await supabase().from("categories").delete().eq("id", toDelete.id);
    setBusy(false);
    if (error) return toast("Não foi possível excluir (verifique produtos ligados).", "error");
    setCats((prev) => prev.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    toast("Categoria excluída.");
  }

  return (
    <>
      <ToastHost />
      <div className="a-pagehead">
        <div>
          <h1>Categorias</h1>
          <p>Estruture o catálogo — as categorias aparecem na Home e nos filtros.</p>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="a-card">
          <div className="a-empty">
            <div className="ic">
              <Icon name="folder" size={36} />
            </div>
            <div className="t">Nenhuma categoria criada</div>
            <p>Crie a primeira para organizar suas peças.</p>
          </div>
        </div>
      ) : (
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th className="w-16">Foto</th>
                <th>Nome</th>
                <th>Produtos</th>
                <th>Status</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td>
                    <label
                      className="relative block h-11 w-11 cursor-pointer overflow-hidden rounded-lg bg-[color:var(--a-bg)]"
                      title="Alterar imagem"
                    >
                      {c.image_url ? (
                        <Image src={c.image_url} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[color:var(--a-border)]">
                          <Icon name="image" size={16} />
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setCatImage(c, e.target.files[0])}
                      />
                    </label>
                  </td>
                  <td>
                    <input
                      defaultValue={c.name}
                      onBlur={(e) => e.target.value.trim() !== c.name && renameCat(c.id, e.target.value)}
                      className="!w-auto !min-w-40 !border-transparent !bg-transparent !px-2 hover:!border-[color:var(--a-border)] focus:!border-[color:var(--a-accent)]"
                      aria-label={`Nome da categoria ${c.name}`}
                    />
                  </td>
                  <td className="tabular-nums text-[color:var(--a-muted)]">{counts[c.id] || 0}</td>
                  <td>
                    <button onClick={() => toggleCat(c)} title="Alternar status">
                      <span className={`a-badge ${c.active ? "green" : "gray"}`}>
                        {c.active ? "Ativa" : "Inativa"}
                      </span>
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => setToDelete(c)}
                      className="a-iconbtn hover:!text-[color:var(--a-danger)]"
                      aria-label={`Excluir ${c.name}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={addCat} className="mt-5 flex max-w-md gap-2">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nova categoria (ex.: Vestidos)"
          aria-label="Nome da nova categoria"
        />
        <button type="submit" disabled={busy || !newCat.trim()} className="a-btn whitespace-nowrap">
          {busy ? <Spinner /> : <><Icon name="plus" size={14} /> Adicionar</>}
        </button>
      </form>

      {toDelete && (
        <ConfirmDialog
          title={`Excluir "${toDelete.name}"?`}
          message="Os produtos desta categoria ficarão sem categoria (não são excluídos)."
          confirmLabel="Excluir"
          busy={busy}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
