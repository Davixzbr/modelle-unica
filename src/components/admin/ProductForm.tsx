"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { slugify, compressImage } from "@/lib/format";
import { toast } from "@/components/Toast";
import { Spinner } from "@/components/States";
import type { Product, Variant, Categorie, Collection } from "@/lib/types";

type Props = {
  product: Product | null;
  variants: Variant[];
  categories: Categorie[];
  collections: Collection[];
};

const TAG_OPTIONS = ["novo", "promocao", "exclusivo"];
const SIZE_PRESETS = ["P", "M", "G", "GG"];

type StockGrid = Record<string, number>; // "size||color" -> stock

export default function ProductForm({ product, variants, categories, collections }: Props) {
  const router = useRouter();
  const isNew = !product;

  // ---- Seção: informações ----
  const [name, setName] = useState(product?.name || "");
  const [autoSlug] = useState(isNew);
  const [slug, setSlug] = useState(product?.slug || "");
  const [shortDescription, setShortDescription] = useState(product?.short_description || "");
  const [description, setDescription] = useState(product?.description || "");
  const [fabric, setFabric] = useState(product?.fabric || "");
  const [sizeChart, setSizeChart] = useState(product?.size_chart || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [collectionId, setCollectionId] = useState(product?.collection_id || "");
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [status, setStatus] = useState<Product["status"]>(product?.status || "active");
  const [featured, setFeatured] = useState(product?.featured || false);
  const [isNewFlag, setIsNewFlag] = useState(product?.is_new ?? isNew);

  // ---- Seção: preço ----
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [promoPrice, setPromoPrice] = useState(product?.promo_price?.toString() || "");

  // ---- Seção: imagens ----
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);

  // ---- Seção: variantes ----
  const [sizes, setSizes] = useState<string[]>(product?.sizes || SIZE_PRESETS);
  const [colors, setColors] = useState<string[]>(product?.colors || []);
  const [stocks, setStocks] = useState<StockGrid>(() => {
    const m: StockGrid = {};
    variants.forEach((v) => {
      m[`${v.size}||${v.color}`] = v.stock;
    });
    return m;
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const stockKey = (s: string, c: string) => `${s}||${c}`;
  const stockOf = (s: string, c: string) => stocks[stockKey(s, c)] ?? 0;
  const setStockOf = (s: string, c: string, v: number) =>
    setStocks((prev) => ({ ...prev, [stockKey(s, c)]: Math.max(0, Math.round(v) || 0) }));

  const totalStock = useMemo(
    () =>
      sizes.reduce(
        (sum, s) => sum + (colors.length ? colors : [""]).reduce((acc, c) => acc + stockOf(s, c), 0),
        0
      ),
    [sizes, colors, stocks] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const promoInvalid =
    promoPrice !== "" && price !== "" && Number(promoPrice) >= Number(price);
  const hasDiscount = promoPrice !== "" && !promoInvalid && Number(promoPrice) > 0;
  const discountPct =
    hasDiscount && Number(price) > 0
      ? Math.round((1 - Number(promoPrice) / Number(price)) * 100)
      : 0;

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Nome é obrigatório.");
    if (!price || Number(price) <= 0) errs.push("Informe um preço válido.");
    if (promoInvalid) errs.push("Preço promocional deve ser menor que o preço normal.");
    if (sizes.length === 0) errs.push("Selecione ao menos um tamanho.");
    if (colors.length === 0) errs.push("Adicione ao menos uma cor.");
    if (images.length === 0) errs.push("Envie ao menos uma foto do produto.");
    return errs;
  }

  async function uploadFiles(files: FileList) {
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      if (compressed.size > 5 * 1024 * 1024) {
        toast(`${file.name}: maior que 5 MB mesmo comprimida`, "err");
        continue;
      }
      const ext = compressed.type === "image/png" ? "png" : "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { contentType: compressed.type });
      if (error) {
        toast(`Falha no upload de ${file.name}`, "err");
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    if (uploaded.length) {
      setImages((prev) => [...prev, ...uploaded]);
      toast(`${uploaded.length} foto(s) enviada(s)`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
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

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length) {
      toast("Corrija os erros do formulário", "err");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const finalSlug = slugify(slug || name);
    const payload = {
      name: name.trim(),
      short_description: shortDescription.trim(),
      description,
      fabric,
      size_chart: sizeChart,
      category_id: categoryId || null,
      collection_id: collectionId || null,
      price: Number(price),
      promo_price: promoPrice ? Number(promoPrice) : null,
      main_image: images[0] || null,
      images,
      sizes,
      colors,
      tags,
      featured,
      is_new: isNewFlag,
      status,
    };

    let productId = product?.id;
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("products")
          .insert({ ...payload, slug: `${finalSlug}-${Math.random().toString(36).slice(2, 6)}` })
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", product!.id);
        if (error) throw error;
      }

      // Sincroniza grade de variantes via RPC (upsert + remoção)
      const combos = sizes.flatMap((s) =>
        (colors.length ? colors : [""]).map((c) => ({
          size: s,
          color: c,
          stock: stockOf(s, c),
        }))
      );
      const { error: rpcErr } = await supabase.rpc("sync_variants", {
        p_product_id: productId,
        p_variants: combos,
      });
      if (rpcErr) throw rpcErr;

      toast(isNew ? "Produto cadastrado!" : "Produto atualizado!");
      router.push("/admin/produtos");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast(msg.includes("duplicate") ? "Slug já existe — mude o nome." : msg, "err");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">{isNew ? "Novo produto" : "Editar produto"}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Estoque total: <strong>{totalStock}</strong> · {sizes.length} tamanho(s) ×{" "}
            {colors.length} cor(es)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/produtos" className="a-btn secondary">Cancelar</Link>
          <button type="submit" disabled={saving || uploading} className="a-btn">
            {saving ? <><Spinner /> Salvando…</> : "Salvar produto"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <ul className="list-inside list-disc space-y-1">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ===== Coluna principal ===== */}
        <div className="space-y-4 lg:col-span-2">
          {/* Informações gerais */}
          <fieldset className="a-card space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Informações gerais
            </legend>
            <div>
              <label htmlFor="p-name">Nome do produto *</label>
              <input
                id="p-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (autoSlug) setSlug(e.target.value);
                }}
                placeholder="Ex.: Conjunto Marrom"
              />
              {!isNew && (
                <p className="mt-1 text-xs text-gray-400">
                  Slug: /produto/{slugify(slug || name)} (URL amigável)
                </p>
              )}
            </div>
            <div>
              <label htmlFor="p-short">Descrição curta (cartões e compartilhamento)</label>
              <input
                id="p-short"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={120}
                placeholder="Uma linha que resume a peça"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{shortDescription.length}/120</p>
            </div>
            <div>
              <label htmlFor="p-desc">Descrição completa</label>
              <textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Caimento, modelagem e detalhes…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-fabric">Tecido / material</label>
                <input id="p-fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-chart">Tabela de medidas</label>
                <input
                  id="p-chart"
                  value={sizeChart}
                  onChange={(e) => setSizeChart(e.target.value)}
                  placeholder="Ex.: Model veste P"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-cat">Categoria</label>
                <select id="p-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">— Sem categoria —</option>
                  {categories.filter((c) => c.active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="p-col">Coleção</label>
                <select id="p-col" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                  <option value="">— Sem coleção —</option>
                  {collections.filter((c) => c.active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Imagens */}
          <fieldset className="a-card">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Fotos ({images.length}) — a primeira é a capa
            </legend>
            <div className="flex flex-wrap gap-3">
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
                  <div className="mt-1 flex justify-center gap-2">
                    <button type="button" onClick={() => moveImage(i, -1)} className="text-xs text-gray-500 hover:text-gray-800" aria-label="Mover para esquerda">←</button>
                    <button type="button" onClick={() => removeImage(url)} className="text-xs text-red-500 hover:text-red-700" aria-label={`Remover foto ${i + 1}`}>✕</button>
                    <button type="button" onClick={() => moveImage(i, 1)} className="text-xs text-gray-500 hover:text-gray-800" aria-label="Mover para direita">→</button>
                  </div>
                </div>
              ))}
              <label className="flex h-28 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-[var(--a-accent)] hover:text-[var(--a-accent)]">
                {uploading ? <Spinner /> : "+ Foto"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              JPG/PNG/WebP até 5 MB — comprimimos automaticamente para carregar rápido.
            </p>
          </fieldset>

          {/* Variantes — matriz cor × tamanho */}
          <fieldset className="a-card">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Estoque por cor × tamanho
            </legend>
            {sizes.length > 0 && colors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="pb-2 pr-4">Cor \\ Tamanho</th>
                      {sizes.map((s) => (
                        <th key={s} className="pb-2 pr-3">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map((c) => (
                      <tr key={c}>
                        <td className="py-1.5 pr-4 font-medium">{c}</td>
                        {sizes.map((s) => (
                          <td key={s} className="py-1.5 pr-3">
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={stockOf(s, c)}
                              onChange={(e) => setStockOf(s, c, Number(e.target.value))}
                              style={{ width: 72 }}
                              aria-label={`Estoque de ${c} tamanho ${s}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Defina tamanhos e cores ao lado para gerar a matriz.</p>
            )}
          </fieldset>
        </div>

        {/* ===== Coluna lateral ===== */}
        <div className="space-y-4">
          {/* Preço */}
          <fieldset className="a-card space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Preço</legend>
            <div>
              <label htmlFor="p-price">Preço normal (R$) *</label>
              <input
                id="p-price"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="189.90"
              />
            </div>
            <div>
              <label htmlFor="p-promo">Preço promocional (opcional)</label>
              <input
                id="p-promo"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="149.90"
                aria-invalid={promoInvalid}
              />
              {promoInvalid && (
                <p className="mt-1 text-xs text-red-600">Deve ser menor que o preço normal.</p>
              )}
              {hasDiscount && (
                <p className="mt-1 text-xs font-semibold text-green-700">
                  Desconto de {discountPct}% ativo — aparece em destaque na loja.
                </p>
              )}
            </div>
          </fieldset>

          {/* Status */}
          <fieldset className="a-card space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Publicação</legend>
            <div>
              <label htmlFor="p-status">Status</label>
              <select id="p-status" value={status} onChange={(e) => setStatus(e.target.value as Product["status"])}>
                <option value="active">Ativo (visível na loja)</option>
                <option value="draft">Rascunho (oculto)</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-normal normal-case tracking-normal">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} style={{ width: 16 }} />
              Destacar na Home ("Destaques")
            </label>
            <label className="flex items-center gap-2 text-sm font-normal normal-case tracking-normal">
              <input type="checkbox" checked={isNewFlag} onChange={(e) => setIsNewFlag(e.target.checked)} style={{ width: 16 }} />
              Marcar como "Novidade"
            </label>
          </fieldset>

          {/* Grade */}
          <fieldset className="a-card space-y-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Tamanhos, cores e tags</legend>
            <div>
              <label>Tamanhos</label>
              <div className="flex flex-wrap gap-2">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`rounded-full border px-3.5 py-1.5 text-sm ${
                      sizes.includes(s) ? "border-[var(--a-accent)] bg-[var(--a-accent)] text-white" : "border-gray-300 text-gray-600"
                    }`}
                    aria-pressed={sizes.includes(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                aria-label="Tamanho personalizado"
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
                aria-label="Nova cor"
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
                    onClick={() => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                    className={`rounded-full border px-3.5 py-1.5 text-sm capitalize ${
                      tags.includes(t) ? "border-[var(--a-accent)] bg-[var(--a-accent)] text-white" : "border-gray-300 text-gray-600"
                    }`}
                    aria-pressed={tags.includes(t)}
                  >
                    {t === "promocao" ? "promoção" : t}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </form>
  );
}
