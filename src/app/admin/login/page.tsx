"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";

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
        <p className="brand">
          Modelle <em>Única</em>
        </p>
        <p className="mb-8 text-center text-[13px] text-[color:var(--a-muted)]">
          Painel administrativo
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label htmlFor="login-pass">Senha</label>
            <input
              id="login-pass"
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
          <p
            className="mt-4 flex items-center gap-2 rounded-lg bg-[#fbeeed] px-4 py-2.5 text-[13px] text-[color:var(--a-danger)]"
            role="alert"
          >
            <Icon name="alert" size={15} /> {erro}
          </p>
        )}

        <button type="submit" disabled={loading} className="a-btn mt-6 w-full justify-center">
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="mt-5 text-center text-xs leading-relaxed text-[color:var(--a-muted)]">
          Esqueceu a senha? Use “Esqueci minha senha” no e-mail cadastrado ou peça redefinição ao
          suporte.
        </p>
      </form>
    </div>
  );
}
