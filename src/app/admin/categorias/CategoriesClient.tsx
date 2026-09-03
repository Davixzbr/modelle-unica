"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { slugify, compressImage } from "@/lib/format";
import { toast } from "@/components/Toast";
import { Spinner } from "@/components/States";
import type { Categorie, Collection } from "@/lib/types";

export default function CategoriesClient({
  initialCats,
  initialCols,
}: {
  initialCats: Categorie[];
  initialCols: Collection[];
}) {
  const [cats, setCats] = useState(initialCats);
  const [cols, setCols] = useState(initialCols);
  const [newCat, setNewCat] = useState("");
  const [newCol, setNewCol] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColPeriod, setNewColPeriod] = useState("");
  const [busy, setBusy] = useState(false);

  const supabase = () => createClient();

  async function uploadImage(file: File, path: string): Promise<string | null> {
    const compressed = await compressImage(file, 1200);
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const finalPath = `${path}-${Date.now()}.${ext}`;
    const { error } = await supabase().storage
      .from("product-images")
      .upload(finalPath, compressed, { contentType: compressed.type });
    if (error) {
      toast("Falha no upload da imagem", "err");
      return null;
    }
    const { data } = supabase().storage.from("product-images").getPublicUrl(finalPath);
    return data.publicUrl;
  }

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
    if (error) return toast("Erro ao criar categoria", "err");
    setCats((prev) => [...prev, data as Categorie]);
    setNewCat("");
    toast("Categoria criada");
  }

  async function renameCat(id: string, name: string) {
    const v = name.trim();
    if (!v) return;
    const { error } = await supabase().from("categories").update({ name: v }).eq("id", id);
    if (error) return toast("Erro ao renomear", "err");
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, name: v } : c)));
  }

  async function toggleCat(c: Categorie) {
    const { error } = await supabase()
      .from("categories")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) return toast("Erro ao atualizar", "err");
    setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
  }

  async function setCatImage(c: Categorie, file: File) {
    const url = await uploadImage(file, `cat-${c.slug}`);
    if (!url) return;
    const { error } = await supabase().from("categories").update({ image_url: url }).eq("id", c.id);
    if (error) return toast("Erro ao salvar imagem", "err");
    setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, image_url: url } : x)));
    toast("Imagem da categoria atualizada");
  }

  async function removeCat(id: string, name: string) {
    if (!confirm(`Excluir a categoria "${name}"? Os produtos ficarão sem categoria.`)) return;
    const { error } = await supabase().from("categories").delete().eq("id", id);
    if (error) return toast("Erro ao excluir", "err");
    setCats((prev) => prev.filter((c) => c.id !== id));
    toast("Categoria excluída");
  }

  async function addCol(e: React.FormEvent) {
    e.preventDefault();
    if (!newCol.trim()) return;
    setBusy(true);
    const { data, error } = await supabase()
      .from("collections")
      .insert({
        name: newCol.trim(),
        slug: slugify(newCol),
        description: newColDesc || null,
        period_text: newColPeriod,
        active: true,
      })
      .select()
      .single();
    setBusy(false);
    if (error) return toast("Erro ao criar coleção", "err");
    setCols((prev) => [...prev, data as Collection]);
    setNewCol("");
    setNewColDesc("");
    setNewColPeriod("");
    toast("Coleção criada");
  }

  async function toggleCol(c: Collection) {
    const { error } = await supabase()
      .from("collections")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) return toast("Erro ao atualizar", "err");
    setCols((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
  }

  async function removeCol(id: string, name: string) {
    if (!confirm(`Excluir a coleção "${name}"?`)) return;
    const { error } = await supabase().from("collections").delete().eq("id", id);
    if (error) return toast("Erro ao excluir", "err");
    setCols((prev) => prev.filter((c) => c.id !== id));
    toast("Coleção excluída");
  }

  return (
    <>
      <h1 className="mb-6 text-2xl">Categorias & Coleções</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* CATEGORIAS */}
        <div className="a-card">
          <h2 className="mb-4 text-base">Categorias da loja</h2>
          <ul className="divide-y divide-gray-100">
            {cats.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded bg-gray-100" aria-label={`Imagem da categoria ${c.name}`}>
                  {c.image_url ? (
                    <Image src={c.image_url} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-gray-400">+foto</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setCatImage(c, e.target.files[0])}
                  />
                </label>
                <input
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() !== c.name && renameCat(c.id, e.target.value)}
                  style={{ width: "auto", flex: 1 }}
                  aria-label={`Nome da categoria ${c.name}`}
                />
                <button onClick={() => toggleCat(c)} className={`a-badge ${c.active ? "green" : "gray"}`}>
                  {c.active ? "Ativa" : "Off"}
                </button>
                <button
                  onClick={() => removeCat(c.id, c.name)}
                  className="text-sm text-red-500 hover:text-red-700"
                  aria-label={`Excluir ${c.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addCat} className="mt-4 flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Nova categoria (ex.: Vestidos)"
            />
            <button type="submit" disabled={busy} className="a-btn whitespace-nowrap">Adicionar</button>
          </form>
        </div>

        {/* COLEÇÕES */}
        <div className="a-card">
          <h2 className="mb-4 text-base">Coleções / campanhas</h2>
          <ul className="divide-y divide-gray-100">
            {cols.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {c.description || "—"}
                    {c.period_text ? ` · ${c.period_text}` : ""}
                  </p>
                </div>
                <button onClick={() => toggleCol(c)} className={`a-badge ${c.active ? "green" : "gray"}`}>
                  {c.active ? "Ativa" : "Inativa"}
                </button>
                <button
                  onClick={() => removeCol(c.id, c.name)}
                  className="text-sm text-red-500 hover:text-red-700"
                  aria-label={`Excluir ${c.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
            {!cols.length && <li className="py-3 text-sm text-gray-500">Nenhuma coleção ainda.</li>}
          </ul>
          <form onSubmit={addCol} className="mt-4 space-y-2">
            <input value={newCol} onChange={(e) => setNewCol(e.target.value)} placeholder="Nova coleção (ex.: Verão 2027)" />
            <input value={newColDesc} onChange={(e) => setNewColDesc(e.target.value)} placeholder="Descrição curta (opcional)" />
            <input value={newColPeriod} onChange={(e) => setNewColPeriod(e.target.value)} placeholder="Período (ex.: Dez–Mar)" />
            <button type="submit" disabled={busy} className="a-btn">Adicionar coleção</button>
          </form>
        </div>
      </div>
    </>
  );
}
