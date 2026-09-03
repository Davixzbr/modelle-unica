"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
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
  const [newLink, setNewLink] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const supabase = () => createClient();

  async function uploadBanner(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase().storage
      .from("product-images")
      .upload(path, file, { contentType: file.type });
    if (!error) {
      const { data } = supabase().storage.from("product-images").getPublicUrl(path);
      setPendingImage(data.publicUrl);
    }
    setUploading(false);
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingImage) return;
    const { data, error } = await supabase()
      .from("banners")
      .insert({
        title: newTitle || "Banner",
        subtitle: newSubtitle,
        image_url: pendingImage,
        link_url: newLink || "/catalogo",
        sort_order: banners.length + 1,
        active: true,
      })
      .select()
      .single();
    if (!error && data) {
      setBanners((prev) => [...prev, data as Banner]);
      setNewTitle("");
      setNewSubtitle("");
      setNewLink("");
      setPendingImage(null);
    }
  }

  async function toggleBanner(b: Banner) {
    const { error } = await supabase()
      .from("banners")
      .update({ active: !b.active })
      .eq("id", b.id);
    if (!error)
      setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !b.active } : x)));
  }

  async function removeBanner(id: string) {
    if (!confirm("Remover este banner da Home?")) return;
    const { error } = await supabase().from("banners").delete().eq("id", id);
    if (!error) setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  async function toggleFeatured(p: Product) {
    const { error } = await supabase()
      .from("products")
      .update({ featured: !p.featured })
      .eq("id", p.id);
    if (!error) window.location.reload();
  }

  return (
    <>
      <h1 className="mb-6 text-2xl">Banners & Home</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* BANNERS */}
        <div className="a-card">
          <h2 className="mb-4 text-base">Banner rotativo da Home</h2>
          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded">
                  <Image src={b.image_url} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  <p className="truncate text-xs text-gray-500">{b.subtitle || "—"}</p>
                </div>
                <button
                  onClick={() => toggleBanner(b)}
                  className={`a-badge ${b.active ? "green" : "gray"}`}
                >
                  {b.active ? "Ativo" : "Off"}
                </button>
                <button
                  onClick={() => removeBanner(b.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                  aria-label="Remover banner"
                >
                  ✕
                </button>
              </div>
            ))}
            {!banners.length && (
              <p className="text-sm text-gray-500">Nenhum banner cadastrado.</p>
            )}
          </div>

          <form onSubmit={addBanner} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Novo banner</p>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título (ex.: Coleção Verão)"
            />
            <input
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="Subtítulo"
            />
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Link ao clicar (ex.: /catalogo)"
            />
            <div className="flex items-center gap-3">
              <label className="a-btn ghost cursor-pointer">
                {uploading ? "Enviando…" : pendingImage ? "Trocar imagem" : "Escolher imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])}
                />
              </label>
              {pendingImage && (
                <div className="relative h-10 w-16 overflow-hidden rounded">
                  <Image src={pendingImage} alt="" fill sizes="64px" className="object-cover" />
                </div>
              )}
              <button
                type="submit"
                disabled={!pendingImage || uploading}
                className="a-btn ml-auto"
              >
                Adicionar banner
              </button>
            </div>
          </form>
        </div>

        {/* DESTAQUES */}
        <div className="a-card">
          <h2 className="mb-1 text-base">Destaques da Home</h2>
          <p className="mb-4 text-xs text-gray-500">
            Marque as peças que aparecem na seção "Destaques" da página inicial.
          </p>
          <ul className="divide-y divide-gray-100">
            {featured.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="relative h-12 w-10 overflow-hidden rounded bg-gray-100">
                  <Image
                    src={p.images[0] || "/images/look-001.jpg"}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <p className="flex-1 text-sm font-medium">{p.name}</p>
                <button
                  onClick={() => toggleFeatured(p)}
                  className={`a-badge ${p.featured ? "green" : "gray"}`}
                >
                  {p.featured ? "Em destaque" : "Marcar"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
