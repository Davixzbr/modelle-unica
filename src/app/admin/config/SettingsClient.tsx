"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { toast } from "@/components/Toast";
import ToastHost from "@/components/Toast";
import Icon from "@/components/Icon";
import type { SiteConfig } from "@/lib/site-config";
import type { Depoimento } from "@/components/Testimonials";

type Setting = { key: string; value: Record<string, unknown> };

const TABS = [
  { key: "loja", label: "Loja" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "politicas", label: "Políticas" },
  { key: "depoimentos", label: "Depoimentos" },
] as const;

export default function SettingsClient({
  site,
  about,
  policy,
  depoimentos,
}: {
  site: SiteConfig;
  about: Record<string, unknown> | null;
  policy: Record<string, unknown> | null;
  depoimentos: Depoimento[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("loja");
  const [siteForm, setSiteForm] = useState(site);
  const [aboutTitle, setAboutTitle] = useState((about?.title as string) || "");
  const [aboutText, setAboutText] = useState((about?.text as string) || "");
  const [policyTitle, setPolicyTitle] = useState((policy?.title as string) || "");
  const [policyText, setPolicyText] = useState((policy?.text as string) || "");
  const [deps, setDeps] = useState<Depoimento[]>(depoimentos);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const results = await Promise.all([
      supabase.from("settings").upsert({ key: "site", value: siteForm }),
      supabase
        .from("settings")
        .upsert({ key: "about", value: { title: aboutTitle, text: aboutText } }),
      supabase
        .from("settings")
        .upsert({ key: "exchange_policy", value: { title: policyTitle, text: policyText } }),
      supabase.from("settings").upsert({ key: "depoimentos", value: deps }),
    ]);
    const failed = results.some((r) => r.error);
    if (failed) toast("Não foi possível salvar as configurações.", "error");
    else toast("Configurações salvas — o site já reflete as mudanças.", "success");
    setSaving(false);
  }

  const bind = <K extends keyof SiteConfig>(k: K) => ({
    value: siteForm[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setSiteForm((prev) => ({ ...prev, [k]: e.target.value })),
  });

  function updateDep(i: number, patch: Partial<Depoimento>) {
    setDeps((list) => list.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  return (
    <>
      <ToastHost />
      <div className="a-pagehead">
        <div>
          <h1>Configurações</h1>
          <p>Dados de contato e textos exibidos em toda a loja.</p>
        </div>
        <button onClick={save} disabled={saving} className="a-btn">
          {saving ? "Salvando…" : "Salvar tudo"}
        </button>
      </div>

      <div className="a-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "loja" && (
        <div className="a-card max-w-2xl">
          <div className="a-grid2">
            <div>
              <label>Nome da loja</label>
              <input {...bind("name")} />
            </div>
            <div>
              <label>Frase da marca (tagline)</label>
              <input {...bind("tagline")} />
            </div>
          </div>
          <div className="a-grid2 mt-4">
            <div>
              <label>WhatsApp (só números, com DDI+DDD)</label>
              <input {...bind("whatsapp")} placeholder="556392678729" />
              <p className="a-helptext">Usado nos botões “Comprar pelo WhatsApp”.</p>
            </div>
            <div>
              <label>WhatsApp exibido no site</label>
              <input {...bind("whatsappDisplay")} placeholder="+55 63 9267-8729" />
            </div>
          </div>
          <div className="a-grid2 mt-4">
            <div>
              <label>Instagram (URL completa)</label>
              <input {...bind("instagram")} />
            </div>
            <div>
              <label>Instagram (@handle exibido)</label>
              <input {...bind("instagramHandle")} />
            </div>
          </div>
          <div className="a-grid2 mt-4">
            <div>
              <label>Endereço da loja física (opcional)</label>
              <input {...bind("address")} />
            </div>
            <div>
              <label>E-mail (opcional)</label>
              <input {...bind("email")} />
            </div>
          </div>
          <div className="mt-4">
            <label>Horário de atendimento (opcional)</label>
            <input {...bind("hours")} placeholder="Seg–Sáb, 8h às 18h" />
          </div>
          <div className="mt-4 max-w-56">
            <label htmlFor="low-stock">Limite de “estoque baixo” (unidades)</label>
            <input
              id="low-stock"
              type="number"
              min={1}
              max={20}
              value={siteForm.low_stock}
              onChange={(e) =>
                setSiteForm((prev) => ({
                  ...prev,
                  low_stock: Math.max(1, Number(e.target.value) || 2),
                }))
              }
            />
            <p className="a-helptext">
              Produtos com até este total aparecem como “Últimas peças” na loja.
            </p>
          </div>
        </div>
      )}

      {tab === "conteudo" && (
        <div className="a-card max-w-2xl">
          <h2 className="text-[15px] font-semibold mb-3">Texto “Sobre nós”</h2>
          <div>
            <label>Título</label>
            <input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} />
          </div>
          <div className="mt-3">
            <label>Texto</label>
            <textarea value={aboutText} onChange={(e) => setAboutText(e.target.value)} rows={6} />
          </div>
        </div>
      )}

      {tab === "politicas" && (
        <div className="a-card max-w-2xl">
          <h2 className="text-[15px] font-semibold mb-3">Política de trocas</h2>
          <div>
            <label>Título</label>
            <input value={policyTitle} onChange={(e) => setPolicyTitle(e.target.value)} />
          </div>
          <div className="mt-3">
            <label>Texto</label>
            <textarea value={policyText} onChange={(e) => setPolicyText(e.target.value)} rows={5} />
          </div>
        </div>
      )}

      {tab === "depoimentos" && (
        <div className="a-card max-w-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Depoimentos de clientes</h2>
            <span className="text-[12px] text-[color:var(--a-muted)]">{deps.length}/8</span>
          </div>
          <p className="a-helptext mb-4">
            Aparecem na home, na seção “O que elas dizem”. Máximo de 8.
          </p>
          <div className="grid gap-4">
            {deps.map((d, i) => (
              <div key={i} className="rounded-xl border border-[color:var(--a-line)] p-4">
                <div className="a-grid2">
                  <div>
                    <label>Nome</label>
                    <input
                      value={d.name}
                      onChange={(e) => updateDep(i, { name: e.target.value })}
                      maxLength={40}
                    />
                  </div>
                  <div>
                    <label>Estrelas (1–5)</label>
                    <select
                      value={d.rating}
                      onChange={(e) => updateDep(i, { rating: Number(e.target.value) })}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {"★".repeat(n)} ({n})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <label>Depoimento</label>
                  <textarea
                    value={d.text}
                    onChange={(e) => updateDep(i, { text: e.target.value })}
                    rows={3}
                    maxLength={400}
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--a-danger)]"
                  onClick={() => setDeps((list) => list.filter((_, j) => j !== i))}
                >
                  <Icon name="trash" size={13} /> Remover
                </button>
              </div>
            ))}
          </div>
          {deps.length < 8 && (
            <button
              type="button"
              className="a-btn secondary mt-4"
              onClick={() => setDeps((list) => [...list, { name: "", text: "", rating: 5 }])}
            >
              <Icon name="plus" size={14} /> Adicionar depoimento
            </button>
          )}
        </div>
      )}
    </>
  );
}
