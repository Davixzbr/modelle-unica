"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { slugify } from "@/lib/format";
import type { Product, Variant, Categorie, Collection } from "@/lib/types";

type Props = {
  product: Product | null;
  variants: Variant[];
  categories: Categorie[];
  collections: Collection[];
};

const TAG_OPTIONS = ["novo", "promocao", "exclusivo"];
const SIZE_PRESETS = ["P", "M", "G", "GG"];

export default function ProductForm({ product, variants, categories, collections }: Props) {
  const router = useRouter();
  const isNew = !product;

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [fabric, setFabric] = useState(product?.fabric || "");
  const [sizeChart, setSizeChart] = useState(product?.size_chart || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [collectionId, setCollectionId] = useState(product?.collection_id || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [promoPrice, setPromoPrice] = useState(product?.promo_price?.toString() || "");
  const [sizes, setSizes] = useState<string[]>(product?.sizes || SIZE_PRESETS);
  const [colors, setColors] = useState<string[]>(product?.colors || []);
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [featured, setFeatured] = useState(product?.featured || false);
  const [status, setStatus] = useState<Product["status"]>(product?.status || "active");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [stocks, setStocks] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    variants.forEach((v) => {
      m[`${v.size}||${v.color}`] = v.stock;
    });
    return m;
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stockKey = (s: string, c: string) => `${s}||${c}`;
  const stockOf = (s: string, c: string) => stocks[stockKey(s, c)] ?? 0;
  const setStockOf = (s: string, c: string, v: number) =>
    setStocks((prev) => ({ ...prev, [stockKey(s, c)]: v }));

  const totalStock = Object.entries(stocks)
    .filter(([k]) => {
      const [ks, kc] = k.split("||");
      return sizes.includes(ks) && colors.includes(kc);
    })
    .reduce((sum, [, v]) => sum + v, 0);

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setError("");
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        setError(`Falha no upload de ${file.name}: ${upErr.message}`);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Informe o nome do produto.");
    if (!price || Number(price) <= 0) return setError("Informe um preço válido.");
    if (promoPrice && Number(promoPrice) >= Number(price))
      return setError("O preço promocional deve ser menor que o preço normal.");

    setSaving(true);
    const supabase = createClient();

    const finalSlug = slugify(slug || name);
    const payload = {
      name: name.trim(),
      slug: isNew ? `${finalSlug}-${Math.random().toString(36).slice(2, 6)}` : (product!.slug),
      description,
      fabric,
      size_chart: sizeChart,
      category_id: categoryId || null,
      collection_id: collectionId || null,
      price: Number(price),
      promo_price: promoPrice ? Number(promoPrice) : null,
      sizes,
      colors,
      images,
      tags,
      featured,
      status,
    };

    let productId = product?.id;
    if (isNew) {
      const { data, error: insErr } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (insErr) {
        setSaving(false);
        return setError(`Erro ao salvar: ${insErr.message}`);
      }
      productId = data.id;
    } else {
      const { error: updErr } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product!.id);
      if (updErr) {
        setSaving(false);
        return setError(`Erro ao salvar: ${updErr.message}`);
      }
    }

    // Sincroniza variantes (estoque por tamanho×cor)
    const combos: { size: string; color: string; stock: number }[] = [];
    for (const s of sizes) {
      for (const c of colors.length ? colors : [""]) {
        combos.push({ size: s, color: c, stock: stockOf(s, c) });
      }
    }

    if (combos.length) {
      const { error: varErr } = await supabase.rpc("sync_variants", {
        p_product_id: productId,
        p_variants: combos,
      });
      if (varErr) {
        // Fallback: sincroniza manualmente
        const { data: existing } = await supabase
          .from("variants")
          .select("id, size, color")
          .eq("product_id", productId);
        const existingMap = new Map(
          (existing || []).map((v) => [`${v.size}||${v.color}`, v.id])
        );
        for (const c of combos) {
          const key = stockKey(c.size, c.color);
          const exId = existingMap.get(key);
          if (exId) {
            await supabase.from("variants").update({ stock: c.stock }).eq("id", exId);
            existingMap.delete(key);
          } else {
            await supabase.from("variants").insert({
              product_id: productId,
              size: c.size,
              color: c.color,
              stock: c.stock,
            });
          }
        }
        // Remove variantes que não existem mais
        for (const [, id] of existingMap) {
          await supabase.from("variants").delete().eq("id", id);
        }
      }
    }

    setSaving(false);
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl">{isNew ? "Novo produto" : "Editar produto"}</h1>
          {totalStock <= 0 && !isNew && (
            <p className="mt-1 text-xs text-red-600">
              Estoque total zerado — produto aparecerá como "Esgotado".
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/admin/produtos" className="a-btn secondary">Cancelar</Link>
          <button type="submit" disabled={saving || uploading} className="a-btn">
            {saving ? "Salvando…" : "Salvar produto"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-4 lg:col-span-2">
          <div className="a-card space-y-4">
            <div>
              <label>Nome do produto *</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (isNew) setSlug(e.target.value);
                }}
                placeholder="Ex.: Conjunto Marrom"
              />
            </div>
            <div>
              <label>Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva o caimento, modelagem e detalhes da peça…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label>Tecido / material</label>
                <input value={fabric} onChange={(e) => setFabric(e.target.value)} />
              </div>
              <div>
                <label>Tabela de medidas (opcional)</label>
                <input
                  value={sizeChart}
                  onChange={(e) => setSizeChart(e.target.value)}
                  placeholder="Ex.: Model veste P — busto 84 cm"
                />
              </div>
            </div>
          </div>

          {/* Imagens */}
          <div className="a-card">
            <label>Fotos do produto</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={url} className="relative">
                  <div className="relative h-28 w-24 overflow-hidden rounded-lg border border-gray-200">
                    <Image src={url} alt={`Foto ${i + 1}`} fill sizes="96px" className="object-cover" />
                  </div>
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      Capa
                    </span>
                  )}
                  <div className="mt-1 flex justify-center gap-1">
                    <button type="button" onClick={() => moveImage(i, -1)} className="text-xs text-gray-500 hover:text-gray-800" aria-label="Mover esquerda">←</button>
                    <button type="button" onClick={() => removeImage(url)} className="text-xs text-red-500 hover:text-red-700" aria-label="Remover foto">✕</button>
                    <button type="button" onClick={() => moveImage(i, 1)} className="text-xs text-gray-500 hover:text-gray-800" aria-label="Mover direita">→</button>
                  </div>
                </div>
              ))}
              <label className="flex h-28 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-[var(--a-accent)] hover:text-[var(--a-accent)]">
                {uploading ? "Enviando…" : "+ Foto"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              A primeira foto é a capa. JPG ou PNG, até 5 MB por foto.
            </p>
          </div>

          {/* Estoque */}
          <div className="a-card">
            <div className="mb-3 flex items-center justify-between">
              <label style={{ marginBottom: 0 }}>Estoque por tamanho × cor</label>
              <span className="text-sm font-semibold">Total: {totalStock}</span>
            </div>
            {sizes.length && colors.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="pb-2 pr-4">Tamanho</th>
                      {colors.map((c) => (
                        <th key={c} className="pb-2 pr-4">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((s) => (
                      <tr key={s}>
                        <td className="py-1.5 pr-4 font-medium">{s}</td>
                        {colors.map((c) => (
                          <td key={c} className="py-1.5 pr-4">
                            <input
                              type="number"
                              min={0}
                              value={stockOf(s, c)}
                              onChange={(e) =>
                                setStockOf(s, c, Math.max(0, Number(e.target.value) || 0))
                              }
                              style={{ width: 80 }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Defina tamanhos e cores para lançar o estoque.
              </p>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          <div className="a-card space-y-4">
            <div>
              <label>Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="189.90"
              />
            </div>
            <div>
              <label>Preço promocional (opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="149.90"
              />
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Product["status"])}>
                <option value="active">Ativo (visível na loja)</option>
                <option value="draft">Rascunho (oculto)</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", textTransform: "none", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                style={{ width: 16 }}
              />
              Destacar na Home ("Destaques")
            </label>
          </div>

          <div className="a-card space-y-4">
            <div>
              <label>Categoria</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">— Sem categoria —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Coleção</label>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                <option value="">— Sem coleção —</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="a-card space-y-4">
            <div>
              <label>Tamanhos</label>
              <div className="flex flex-wrap gap-2">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSizes((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    className={`rounded-full border px-3.5 py-1.5 text-sm ${
                      sizes.includes(s)
                        ? "border-[var(--a-accent)] bg-[var(--a-accent)] text-white"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value=""
                placeholder="+ tamanho personalizado (Enter)"
                onKeyDown={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim().toUpperCase();
                  if (e.key === "Enter" && v) {
                    e.preventDefault();
                    setSizes((prev) => (prev.includes(v) ? prev : [...prev, v]));
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                className="mt-2"
              />
            </div>
            <div>
              <label>Cores</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <span key={c} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm">
                    {c}
                    <button
                      type="button"
                      onClick={() => setColors((prev) => prev.filter((x) => x !== c))}
                      className="ml-1.5 text-gray-400 hover:text-red-500"
                      aria-label={`Remover cor ${c}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <input
                value=""
                placeholder="+ cor (Enter)"
                onKeyDown={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && v) {
                    e.preventDefault();
                    setColors((prev) => (prev.includes(v) ? prev : [...prev, v]));
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                className="mt-2"
              />
            </div>
            <div>
              <label>Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setTags((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                    }
                    className={`rounded-full border px-3.5 py-1.5 text-sm capitalize ${
                      tags.includes(t)
                        ? "border-[var(--a-accent)] bg-[var(--a-accent)] text-white"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {t === "promocao" ? "promoção" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
