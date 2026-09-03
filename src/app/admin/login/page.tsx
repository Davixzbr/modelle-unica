"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password: senha,
    });
    setLoading(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="a-login">
      <form onSubmit={submit} className="box">
        <p className="font-display mb-1 text-center text-2xl" style={{ fontFamily: "Fraunces, serif" }}>
          Modelle <em style={{ color: "var(--a-accent)" }}>Única</em>
        </p>
        <p className="mb-8 text-center text-sm" style={{ color: "var(--a-muted)" }}>
          Painel administrativo
        </p>

        <div className="space-y-4">
          <div>
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
        </div>

        {erro && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{erro}</p>
        )}

        <button type="submit" disabled={loading} className="a-btn mt-6 w-full justify-center">
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--a-muted)" }}>
          Esqueceu a senha? Use “Esqueci minha senha” no e-mail cadastrado ou peça redefinição ao suporte.
        </p>
      </form>
    </div>
  );
}
