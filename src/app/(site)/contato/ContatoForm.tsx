"use client";

import { useState } from "react";

export default function ContatoForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = `Olá! Me chamo ${nome || "—"} e escrevo pelo site:\n\n${msg}`;
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    setSent(true);
  }

  return (
    <form onSubmit={send} className="space-y-4">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        required
        className="w-full rounded-xl border border-line bg-white px-5 py-3.5 text-sm outline-none focus:border-caramel"
      />
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Sua mensagem"
        required
        rows={5}
        className="w-full rounded-xl border border-line bg-white px-5 py-3.5 text-sm outline-none focus:border-caramel"
      />
      <button
        type="submit"
        className="rounded-full bg-ink px-10 py-4 text-[12px] font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-caramel"
      >
        Enviar pelo WhatsApp
      </button>
      {sent && (
        <p className="text-sm text-caramel">
          Abrimos o WhatsApp com a sua mensagem — é só apertar enviar. ✦
        </p>
      )}
    </form>
  );
}
