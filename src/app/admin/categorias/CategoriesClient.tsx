"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
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
  const [busy, setBusy] = useState(false);

  const supabase = () => createClient();

  async function addCat(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.trim()) return;
    setBusy(true);
    const slug = newCat
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase()
      .from("categories")
      .insert({ name: newCat.trim(), slug, sort_order: cats.length + 1 })
      .select()
      .single();
    setBusy(false);
    if (!error && data) {
      setCats((prev) => [...prev, data as Categorie]);
      setNewCat("");
    }
  }

  async function renameCat(id: string, name: string) {
    const { error } = await supabase().from("categories").update({ name }).eq("id", id);
    if (!error) setCats((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function removeCat(id: string, name: string) {
    if (!confirm(`Excluir a categoria "${name}"? Produtos ficarão sem categoria.`)) return;
    const { error } = await supabase().from("categories").delete().eq("id", id);
    if (!error) setCats((prev) => prev.filter((c) => c.id !== id));
  }

  async function addCol(e: React.FormEvent) {
    e.preventDefault();
    if (!newCol.trim()) return;
    setBusy(true);
    const slug = newCol
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data, error } = await supabase()
      .from("collections")
      .insert({ name: newCol.trim(), slug, description: newColDesc || null, active: true })
      .select()
      .single();
    setBusy(false);
    if (!error && data) {
      setCols((prev) => [...prev, data as Collection]);
      setNewCol("");
      setNewColDesc("");
    }
  }

  async function toggleCol(col: Collection) {
    const { error } = await supabase()
      .from("collections")
      .update({ active: !col.active })
      .eq("id", col.id);
    if (!error)
      setCols((prev) => prev.map((c) => (c.id === col.id ? { ...c, active: !col.active } : c)));
  }

  async function removeCol(id: string, name: string) {
    if (!confirm(`Excluir a coleção "${name}"?`)) return;
    const { error } = await supabase().from("collections").delete().eq("id", id);
    if (!error) setCols((prev) => prev.filter((c) => c.id !== id));
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
              <li key={c.id} className="flex items-center gap-2 py-2.5">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.name) renameCat(c.id, v);
                  }}
                  style={{ width: "auto", flex: 1 }}
                />
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
            <button type="submit" disabled={busy} className="a-btn whitespace-nowrap">
              Adicionar
            </button>
          </form>
        </div>

        {/* COLEÇÕES */}
        <div className="a-card">
          <h2 className="mb-4 text-base">Coleções / campanhas</h2>
          <ul className="divide-y divide-gray-100">
            {cols.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  {c.description && (
                    <p className="text-xs text-gray-500">{c.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleCol(c)}
                  className={`a-badge ${c.active ? "green" : "gray"}`}
                >
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
            {!cols.length && (
              <li className="py-3 text-sm text-gray-500">Nenhuma coleção ainda.</li>
            )}
          </ul>
          <form onSubmit={addCol} className="mt-4 space-y-2">
            <input
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              placeholder="Nova coleção (ex.: Verão 2027)"
            />
            <input
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              placeholder="Descrição curta (opcional)"
            />
            <button type="submit" disabled={busy} className="a-btn">
              Adicionar coleção
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
