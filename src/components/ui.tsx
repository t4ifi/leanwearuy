/**
 * Piezas de UI reutilizables del panel.
 * Centraliza las clases de Tailwind para mantener un look consistente
 * (oscuro + morado, igual que el catálogo público).
 */
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-xl border border-[#2c2647] bg-[#1b1730] px-3.5 py-2.5 text-[#f3f1fa] outline-none transition placeholder:text-[#6c6790] focus:border-[#8b5cf6]";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#221d36] bg-[#16132599] p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-[#a39ec0]">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#6c6790]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-[#ff8a8a]">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 resize-y ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#f3f1fa]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-[#8b5cf6]"
      />
      {label}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: InputHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-white hover:brightness-110 disabled:opacity-50",
    ghost:
      "border border-[#2c2647] bg-[#1b1730] text-[#a39ec0] hover:border-[#8b5cf6] hover:text-[#f3f1fa]",
    danger:
      "border border-[#ff6b6b]/50 text-[#ff8a8a] hover:bg-[#ff6b6b]/15",
  }[variant];

  return (
    <button
      {...(props as object)}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "bad" }) {
  const tones = {
    muted: "border-[#2c2647] text-[#a39ec0]",
    ok: "border-[#34d399]/40 text-[#34d399]",
    warn: "border-[#fbbf24]/40 text-[#fbbf24]",
    bad: "border-[#ff6b6b]/40 text-[#ff8a8a]",
  }[tone];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${tones}`}>
      {children}
    </span>
  );
}
