/**
 * Sistema de UI del panel.
 *
 * Usa los tokens del tema (bg-panel, text-muted, border-line...) en vez de
 * hexadecimales sueltos, para que todo cambie de forma coherente si algún
 * día se ajusta la paleta.
 */
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const inputClass =
  "w-full rounded-lg border border-line-2 bg-panel-2 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-faint focus:border-purple focus:ring-2 focus:ring-purple/20";

/* ------------------------------ Encabezado ------------------------------ */

export function PageHeader({
  title,
  description,
  back,
  children,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="mb-7">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm text-muted transition hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 gap-2">{children}</div>}
      </div>
    </header>
  );
}

/* -------------------------------- Superficies -------------------------------- */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-panel/60 p-6 ${className}`}>{children}</div>
  );
}

/** Sección de formulario: título + descripción a la izquierda, campos a la derecha. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-panel/60">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/* --------------------------------- Formularios --------------------------------- */

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
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputClass} ${className}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`${inputClass} min-h-24 resize-y ${className}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select {...rest} className={`${inputClass} ${className}`} />;
}

export function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-purple" />
      {label}
    </label>
  );
}

/* --------------------------------- Botones --------------------------------- */

const buttonVariants = {
  primary:
    "bg-gradient-to-br from-purple-2 to-purple-3 text-white shadow-sm hover:brightness-110 disabled:opacity-50",
  secondary: "border border-line-2 bg-panel-2 text-ink hover:border-purple",
  ghost: "text-muted hover:bg-panel-2 hover:text-ink",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
} as const;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  target,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${buttonVariants[variant]}`}
    >
      {children}
    </Link>
  );
}

/* ---------------------------------- Varios ---------------------------------- */

const badgeTones = {
  muted: "border-line-2 text-muted",
  ok: "border-stock/40 bg-stock/10 text-stock",
  warn: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  bad: "border-danger/40 bg-danger/10 text-danger",
  purple: "border-purple/40 bg-purple/10 text-purple-2",
} as const;

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-2 bg-panel/30 px-6 py-16 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}

/** Métrica: rótulo chico arriba, cifra grande, contexto abajo. */
export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  const color = tone === "ok" ? "text-stock" : tone === "warn" ? "text-amber-400" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-2 font-head text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}
