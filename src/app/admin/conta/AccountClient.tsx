"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";
import ToastHost from "@/components/Toast";
import { toast } from "@/components/Toast";

export default function AccountClient({
  email,
  createdAt,
  lastEventAt,
}: {
  email: string;
  createdAt: string | null;
  lastEventAt: string | null;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function changePassword() {
    if (password.length < 8) {
      toast("A senha deve ter pelo menos 8 caracteres.", "error");
      return;
    }
    if (password !== confirm) {
      toast("As senhas não conferem.", "error");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) toast("Não foi possível alterar a senha: " + error.message, "error");
    else {
      toast("Senha alterada com sucesso.", "success");
      setPassword("");
      setConfirm("");
      router.refresh();
    }
    setBusy(false);
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <ToastHost />
      <div className="a-pagehead">
        <div>
          <h1>Conta</h1>
          <p>Suas credenciais de acesso ao painel.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 max-w-4xl">
        <section className="a-card">
          <div className="a-cardtitle">
            <span className="inline-flex items-center gap-2">
              <Icon name="user" size={16} /> Dados da conta
            </span>
          </div>
          <dl className="text-[13.5px] grid gap-2.5">
            <div className="flex justify-between gap-4">
              <dt className="text-[color:var(--a-muted)]">E-mail</dt>
              <dd className="font-medium truncate">{email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[color:var(--a-muted)]">Conta criada em</dt>
              <dd>{createdAt ? new Date(createdAt).toLocaleDateString("pt-BR") : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[color:var(--a-muted)]">Última atividade na loja</dt>
              <dd>
                {lastEventAt ? new Date(lastEventAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
              </dd>
            </div>
          </dl>
          <button onClick={logout} className="a-btn secondary mt-5">
            <Icon name="logout" size={15} /> Sair da conta neste dispositivo
          </button>
        </section>

        <section className="a-card">
          <div className="a-cardtitle">
            <span className="inline-flex items-center gap-2">
              <Icon name="settings" size={16} /> Alterar senha
            </span>
          </div>
          <div>
            <label htmlFor="acc-pass">Nova senha (mín. 8 caracteres)</label>
            <input
              id="acc-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="acc-pass2">Confirmar nova senha</label>
            <input
              id="acc-pass2"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button onClick={changePassword} disabled={busy || !password} className="a-btn mt-4">
            {busy ? "Salvando…" : "Alterar senha"}
          </button>
          <p className="a-helptext mt-3">
            Use uma senha forte e exclusiva do painel. Recomendamos trocá-la periodicamente.
          </p>
        </section>
      </div>
    </>
  );
}
