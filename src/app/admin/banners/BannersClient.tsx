"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { compressImage } from "@/lib/format";
import { toast } from "@/components/Toast";
import { Spinner } from "@/components/States";
import type { Banner, Product } from "@/lib/types";

export default function BannersClient({
  initialBanners,
  featured,
}: {
  initialBanners: Banner[];
  featured: Product[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCta, setNewCta] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newStarts, setNewStarts] = useState("");
  const [newEnds, setNewEnds] = useState("");
  const [pendingDesktop, setPendingDesktop] = useState<string | null>(null);
  const [pendingMobile, setPendingMobile] = useState<string | null>(null);
  const [featuredList, setFeaturedList] = useState(featured);

  const supabase = () => createClient();

  async function uploadBanner(file: File, kind: "desktop" | "mobile") {
    setUploading(true);
    const compressed = await compressImage(file, kind === "desktop" ? 1920 : 900);
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const path = `banner-${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase().storage
      .from("product-images")
      .upload(path, compressed, { contentType: compressed.type });
    if (!error) {
      const { data } = supabase().storage.from("product-images").getPublicUrl(path);
      if (kind === "desktop") setPendingDesktop(data.publicUrl);
      else setPendingMobile(data.publicUrl);
    } else {
      toast("Falha no upload do banner", "err");
    }
    setUploading(false);
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingDesktop) return toast("Escolha a imagem desktop", "err");
    const { data, error } = await supabase()
      .from("banners")
      .insert({
        title: newTitle || "Banner",
        subtitle: newSubtitle,
        cta_text: newCta || "Ver coleção",
        image_url: pendingDesktop,
        image_mobile_url: pendingMobile,
        link_url: newLink || "/catalogo",
        starts_at: newStarts || null,
        ends_at: newEnds || null,
        sort_order: banners.length + 1,
        active: true,
      })
      .select()
      .single();
    if (error) return toast("Erro ao criar banner", "err");
    setBanners((prev) => [...prev, data as Banner]);
    setNewTitle(""); setNewSubtitle(""); setNewCta(""); setNewLink("");
    setNewStarts(""); setNewEnds("");
    setPendingDesktop(null); setPendingMobile(null);
    toast("Banner adicionado à Home");
  }

  async function toggleBanner(b: Banner) {
    const { error } = await supabase().from("banners").update({ active: !b.active }).eq("id", b.id);
    if (error) return toast("Erro ao atualizar", "err");
    setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !b.active } : x)));
  }

  async function moveBanner(b: Banner, dir: -1 | 1) {
    const sorted = [...banners].sort((a, c) => a.sort_order - c.sort_order);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const target = sorted[idx + dir];
    if (!target) return;
    const updates = [
      { id: b.id, sort_order: target.sort_order },
      { id: target.id, sort_order: b.sort_order },
    ];
    for (const u of updates) {
      const { error } = await supabase().from("banners").update({ sort_order: u.sort_order }).eq("id", u.id);
      if (error) return toast("Erro ao reordenar", "err");
    }
    setBanners((prev) =>
      prev.map((x) => {
        const u = updates.find((uu) => uu.id === x.id);
        return u ? { ...x, sort_order: u.sort_order } : x;
      })
    );
  }

  async function removeBanner(id: string) {
    if (!confirm("Remover este banner da Home?")) return;
    const { error } = await supabase().from("banners").delete().eq("id", id);
    if (error) return toast("Erro ao remover", "err");
    setBanners((prev) => prev.filter((b) => b.id !== id));
    toast("Banner removido");
  }

  async function toggleFeatured(p: Product) {
    const { error } = await supabase()
      .from("products")
      .update({ featured: !p.featured })
      .eq("id", p.id);
    if (error) return toast("Erro ao atualizar destaque", "err");
    setFeaturedList((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, featured: !p.featured } : x))
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl">Banners & Home</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* BANNERS */}
        <div className="a-card">
          <h2 className="mb-4 text-base">Banner rotativo da Home</h2>
          <div className="space-y-3">
            {[...banners].sort((a, b) => a.sort_order - b.sort_order).map((b, idx, arr) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded">
                  <Image src={b.image_url} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  <p className="truncate text-xs text-gray-500">
                    {b.cta_text || "—"} → {b.link_url || "/"}
                    {b.starts_at || b.ends_at ? " · agendado" : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveBanner(b, -1)} disabled={idx === 0} className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Subir banner">↑</button>
                  <button onClick={() => moveBanner(b, 1)} disabled={idx === arr.length - 1} className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Descer banner">↓</button>
                </div>
                <button onClick={() => toggleBanner(b)} className={`a-badge ${b.active ? "green" : "gray"}`}>
                  {b.active ? "Ativo" : "Off"}
                </button>
                <button onClick={() => removeBanner(b.id)} className="text-sm text-red-500 hover:text-red-700" aria-label="Remover banner">✕</button>
              </div>
            ))}
            {!banners.length && <p className="text-sm text-gray-500">Nenhum banner cadastrado.</p>}
          </div>

          <form onSubmit={addBanner} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Novo banner</p>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título (ex.: Coleção Verão)" />
            <input value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} placeholder="Subtítulo" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newCta} onChange={(e) => setNewCta(e.target.value)} placeholder="Texto do botão (CTA)" />
              <input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="Link (ex.: /catalogo)" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-500">
                Exibir a partir de
                <input type="date" value={newStarts} onChange={(e) => setNewStarts(e.target.value)} />
              </label>
              <label className="text-xs text-gray-500">
                Até
                <input type="date" value={newEnds} onChange={(e) => setNewEnds(e.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="a-btn ghost cursor-pointer">
                {uploading ? <Spinner /> : pendingDesktop ? "Trocar desktop" : "Imagem desktop *"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0], "desktop")} />
              </label>
              <label className="a-btn ghost cursor-pointer">
                {pendingMobile ? "Trocar mobile" : "Imagem mobile"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0], "mobile")} />
              </label>
              {pendingDesktop && (
                <div className="relative h-10 w-16 overflow-hidden rounded">
                  <Image src={pendingDesktop} alt="" fill sizes="64px" className="object-cover" />
                </div>
              )}
              <button type="submit" disabled={!pendingDesktop || uploading} className="a-btn ml-auto">
                Adicionar banner
              </button>
            </div>
          </form>
        </div>

        {/* DESTAQUES + NOVIDADES */}
        <div className="a-card">
          <h2 className="mb-1 text-base">Destaques e novidades da Home</h2>
          <p className="mb-4 text-xs text-gray-500">
            ★ = aparece em "Destaques" · N = marcado como "Novidade"
          </p>
          <ul className="divide-y divide-gray-100">
            {featuredList.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="relative h-12 w-10 overflow-hidden rounded bg-gray-100">
                  <Image src={p.main_image || p.images[0] || "/images/look-001.jpg"} alt="" fill sizes="40px" className="object-cover" />
                </div>
                <p className="flex-1 text-sm font-medium">{p.name}</p>
                <button
                  onClick={() => toggleFeatured(p)}
                  className={`a-badge ${p.featured ? "green" : "gray"}`}
                  aria-label={`Alternar destaque de ${p.name}`}
                >
                  {p.featured ? "★ Destaque" : "☆ Destaque"}
                </button>
                <button
                  onClick={async () => {
                    const { error } = await supabase().from("products").update({ is_new: !p.is_new }).eq("id", p.id);
                    if (error) return toast("Erro ao atualizar novidade", "err");
                    setFeaturedList((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_new: !p.is_new } : x)));
                  }}
                  className={`a-badge ${p.is_new ? "amber" : "gray"}`}
                  aria-label={`Alternar novidade de ${p.name}`}
                >
                  {p.is_new ? "N Novo" : "N —"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
