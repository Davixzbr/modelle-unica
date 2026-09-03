"use client";

import Icon from "@/components/Icon";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  danger = true,
  onCancel,
  onConfirm,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-[rgb(34_29_22/0.45)]" onClick={busy ? undefined : onCancel} />
      <div className="relative bg-white rounded-xl border border-[color:var(--a-border)] shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          {danger && (
            <span className="text-[color:var(--a-danger)] mt-0.5">
              <Icon name="alert" size={20} />
            </span>
          )}
          <div>
            <h3 className="font-semibold text-[15px]">{title}</h3>
            {message && (
              <p className="text-[13px] text-[color:var(--a-muted)] mt-1.5 leading-relaxed">{message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="a-btn secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className={`a-btn ${danger ? "danger" : ""}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
