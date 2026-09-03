"use client";

import { useState } from "react";
import type { SiteConfig } from "@/lib/site-config";

type Setting = { key: string; value: Record<string, unknown> };

export default function SettingsClient({
  site,
  about,
  policy,
}: {
  site: SiteConfig;
  about: Record<string, unknown> | null;
  policy: Record<string, unknown> | null;
}) {
  const [siteForm, setSiteForm] = useState(site);
  const [aboutTitle, setAboutTitle] = useState((about?.title as string) || "");
  const [aboutText, setAboutText] = useState((about?.text as string) || "");
  const [policyTitle, setPolicyTitle] = useState((policy?.title as string) || "");
  const [policyText, setPolicyText] = useState((policy?.text as string) || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const { createClient } = await import("@/lib/supabase-client");
    const supabase = createClient();

    await Promise.all([
      supabase.from("settings").upsert({ key: "site", value: siteForm }),
      supabase
        .from("settings")
        .upsert({ key: "about", value: { title: aboutTitle, text: aboutText } }),
      supabase
        .from("settings")
        .upsert({ key: "exchange_policy", value: { title: policyTitle, text: policyText } }),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const bind = <K extends keyof SiteConfig>(k: K) => ({
    value: siteForm[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setSiteForm((prev) => ({ ...prev, [k]: e.target.value })),
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Configurações do site</h1>
        <button onClick={save} disabled={saving} className="a-btn">
          {saving ? "Salvando…" : "Salvar tudo"}
        </button>
      </div>
      {saved && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          Configurações salvas — o site já reflete as mudanças.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="a-card space-y-4">
          <h2 className="text-base">Contato & identidade</h2>
          <div>
            <label>Nome da loja</label>
            <input {...bind("name")} />
          </div>
          <div>
            <label>Frase da marca (tagline)</label>
            <input {...bind("tagline")} />
          </div>
          <div>
            <label>WhatsApp (só números, com DDI+DDD)</label>
            <input {...bind("whatsapp")} placeholder="5563992678729" />
          </div>
          <div>
            <label>WhatsApp exibido no site</label>
            <input {...bind("whatsappDisplay")} placeholder="+55 63 99267-8729" />
          </div>
          <div>
            <label>Instagram (URL completa)</label>
            <input {...bind("instagram")} />
          </div>
          <div>
            <label>Instagram (@handle exibido)</label>
            <input {...bind("instagramHandle")} />
          </div>
          <div>
            <label>Endereço da loja física (opcional)</label>
            <input {...bind("address")} />
          </div>
          <div>
            <label>E-mail (opcional)</label>
            <input {...bind("email")} />
          </div>
          <div>
            <label>Horário de atendimento (opcional)</label>
            <input {...bind("hours")} placeholder="Seg–Sáb, 8h às 18h" />
          </div>
          <div>
            <label htmlFor="low-stock">Limite de "estoque baixo" (unidades)</label>
            <input
              id="low-stock"
              type="number"
              min={1}
              max={20}
              value={siteForm.low_stock}
              onChange={(e) =>
                setSiteForm((prev) => ({ ...prev, low_stock: Math.max(1, Number(e.target.value) || 2) }))
              }
            />
            <p className="mt-1 text-xs text-gray-400">
              Produtos com até este total aparecem como "Últimas peças" na loja.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="a-card space-y-3">
            <h2 className="text-base">Texto "Sobre nós"</h2>
            <div>
              <label>Título</label>
              <input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} />
            </div>
            <div>
              <label>Texto</label>
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <div className="a-card space-y-3">
            <h2 className="text-base">Política de trocas</h2>
            <div>
              <label>Título</label>
              <input value={policyTitle} onChange={(e) => setPolicyTitle(e.target.value)} />
            </div>
            <div>
              <label>Texto</label>
              <textarea
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
