"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { compressImage } from "@/lib/format";
import { toast } from "@/components/Toast";
import ToastHost from "@/components/Toast";
import { Spinner } from "@/components/States";
import Icon from "@/components/Icon";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Banner } from "@/lib/types";

type Draft = {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  starts: string;
  ends: string;
  desktop: string | null;
  mobile: string | null;
};

const EMPTY: Draft = {
  title: "",
  subtitle: "",
  cta: "",
  link: "/catalogo",
  starts: "",
  ends: "",
  desktop: null,
  mobile: null,
};

export default function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  const supabase = () => createClient();
  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  async function uploadBanner(file: File, kind: "desktop" | "mobile") {
    setUploading(true);
    const compressed = await compressImage(file, kind === "desktop" ? 1920 : 900);
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const path = `banner-${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase()
      .storage.from("product-images")
      .upload(path, compressed, { contentType: compressed.type });
    if (!error) {
      const { data } = supabase().storage.from("product-images").getPublicUrl(path);
      patch(kind === "desktop" ? { desktop: data.publicUrl } : { mobile: data.publicUrl });
    } else {
      toast("Falha no upload da imagem.", "error");
    }
    setUploading(false);
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!draft?.desktop) return toast("Envie a imagem desktop.", "error");
    setBusy(true);
    const { data, error } = await supabase()
      .from("banners")
      .insert({
        title: draft.title || "Banner",
        subtitle: draft.subtitle,
        cta_text: draft.cta || "Ver coleção",
        image_url: draft.desktop,
        image_mobile_url: draft.mobile,
        link_url: draft.link || "/catalogo",
        starts_at: draft.starts || null,
        ends_at: draft.ends || null,
        sort_order: banners.length + 1,
        active: true,
      })
      .select()
      .single();
    setBusy(false);
    if (error) return toast("Não foi possível criar o banner.", "error");
    setBanners((prev) => [...prev, data as Banner]);
    setDraft(null);
    toast("Banner adicionado à Home.");
  }

  async function toggleBanner(b: Banner) {
    const { error } = await supabase().from("banners").update({ active: !b.active }).eq("id", b.id);
    if (error) return toast("Não foi possível atualizar.", "error");
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
      const { error } = await supabase()
        .from("banners")
        .update({ sort_order: u.sort_order })
        .eq("id", u.id);
      if (error) return toast("Não foi possível reordenar.", "error");
    }
    setBanners((prev) =>
      prev.map((x) => {
        const u = updates.find((uu) => uu.id === x.id);
        return u ? { ...x, sort_order: u.sort_order } : x;
      })
    );
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await supabase().from("banners").delete().eq("id", toDelete.id);
    setBusy(false);
    if (error) return toast("Não foi possível remover.", "error");
    setBanners((prev) => prev.filter((b) => b.id !== toDelete.id));
    setToDelete(null);
    toast("Banner removido.");
  }

  const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order);
  const now = new Date();

  return (
    <>
      <ToastHost />
      <div className="a-pagehead">
        <div>
          <h1>Banners</h1>
          <p>Carrossel principal da Home — desktop, mobile, CTA e agendamento.</p>
        </div>
        <button className="a-btn" onClick={() => setDraft({ ...EMPTY })}>
          <Icon name="plus" size={15} /> Novo banner
        </button>
      </div>

      {sorted.length === 0 && !draft ? (
        <div className="a-card">
          <div className="a-empty">
            <div className="ic">
              <Icon name="image" size={36} />
            </div>
            <div className="t">Nenhum banner cadastrado</div>
            <p>Crie o banner principal que aparece no topo da loja.</p>
            <button className="a-btn" onClick={() => setDraft({ ...EMPTY })}>
              Adicionar banner
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((b, idx) => {
            const scheduled = b.starts_at && new Date(b.starts_at) > now;
            const expired = b.ends_at && new Date(b.ends_at) < now;
            return (
              <div key={b.id} className="a-card tight !p-3">
                <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-[color:var(--a-bg)]">
                  <Image src={b.image_url} alt={b.title} fill sizes="400px" className="object-cover" />
                  {!b.active && (
                    <span className="absolute right-2 top-2 a-badge gray">Pausado</span>
                  )}
                  {b.active && scheduled && (
                    <span className="absolute right-2 top-2 a-badge amber">Agendado</span>
                  )}
                  {b.active && expired && (
                    <span className="absolute right-2 top-2 a-badge red">Expirado</span>
                  )}
                </div>
                <div className="px-1 pt-3">
                  <p className="truncate text-[14px] font-semibold">{b.title}</p>
                  <p className="truncate text-xs text-[color:var(--a-muted)]">
                    {b.cta_text || "—"} → {b.link_url || "/"}
                    {b.image_mobile_url ? " · mobile ✓" : ""}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[color:var(--a-border-soft)] px-1 pt-2.5">
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => moveBanner(b, -1)}
                      disabled={idx === 0}
                      className="a-iconbtn !w-8 !h-8 disabled:opacity-25"
                      aria-label="Subir banner"
                    >
                      <Icon name="arrowUp" size={14} />
                    </button>
                    <button
                      onClick={() => moveBanner(b, 1)}
                      disabled={idx === sorted.length - 1}
                      className="a-iconbtn !w-8 !h-8 disabled:opacity-25"
                      aria-label="Descer banner"
                    >
                      <Icon name="arrowDown" size={14} />
                    </button>
                    <Link
                      href="/"
                      target="_blank"
                      className="a-iconbtn !w-8 !h-8"
                      aria-label="Ver na loja"
                      title="Ver na loja"
                    >
                      <Icon name="eye" size={14} />
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleBanner(b)} title="Pausar/ativar">
                      <span className={`a-badge ${b.active ? "green" : "gray"} cursor-pointer`}>
                        {b.active ? "Ativo" : "Off"}
                      </span>
                    </button>
                    <button
                      onClick={() => setToDelete(b)}
                      className="a-iconbtn !w-8 !h-8 hover:!text-[color:var(--a-danger)]"
                      aria-label={`Remover ${b.title}`}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer/formulário de novo banner */}
      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[rgb(34_29_22/0.45)]" onClick={() => setDraft(null)} />
          <form
            onSubmit={addBanner}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[color:var(--a-border)] bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-4 text-[15px] font-semibold">Novo banner</h3>
            <div className="grid gap-3">
              <div>
                <label>Título *</label>
                <input
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Ex.: Coleção Verão 2027"
                  required
                />
              </div>
              <div>
                <label>Subtítulo (linha fina acima do título)</label>
                <input
                  value={draft.subtitle}
                  onChange={(e) => patch({ subtitle: e.target.value })}
                  placeholder="Ex.: Nova coleção"
                />
              </div>
              <div className="a-grid2">
                <div>
                  <label>Texto do botão (CTA)</label>
                  <input
                    value={draft.cta}
                    onChange={(e) => patch({ cta: e.target.value })}
                    placeholder="Ver coleção"
                  />
                </div>
                <div>
                  <label>Link do botão</label>
                  <input
                    value={draft.link}
                    onChange={(e) => patch({ link: e.target.value })}
                    placeholder="/catalogo"
                  />
                </div>
              </div>
              <div className="a-grid2">
                <div>
                  <label>Exibir a partir de</label>
                  <input
                    type="date"
                    value={draft.starts}
                    onChange={(e) => patch({ starts: e.target.value })}
                  />
                </div>
                <div>
                  <label>Até</label>
                  <input
                    type="date"
                    value={draft.ends}
                    onChange={(e) => patch({ ends: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label>Imagem desktop (16:9) *</label>
                <label className="a-btn ghost w-full cursor-pointer justify-center">
                  {uploading ? <Spinner /> : draft.desktop ? "Trocar imagem" : "Selecionar arquivo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0], "desktop")}
                  />
                </label>
                {draft.desktop && (
                  <div className="relative mt-2 aspect-[16/9] overflow-hidden rounded-lg">
                    <Image src={draft.desktop} alt="" fill sizes="500px" className="object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label>Imagem mobile (9:16, opcional — recomendado)</label>
                <label className="a-btn ghost w-full cursor-pointer justify-center">
                  {uploading ? <Spinner /> : draft.mobile ? "Trocar imagem" : "Selecionar arquivo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0], "mobile")}
                  />
                </label>
                {draft.mobile && (
                  <p className="a-helptext">Imagem mobile adicionada ✓</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="a-btn secondary" onClick={() => setDraft(null)}>
                Cancelar
              </button>
              <button type="submit" disabled={busy || !draft.desktop} className="a-btn">
                {busy ? "Salvando…" : "Adicionar banner"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Remover "${toDelete.title}"?`}
          message="O banner sairá do carrossel da Home. Esta ação não pode ser desfeita."
          confirmLabel="Remover"
          busy={busy}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
