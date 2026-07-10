"use client";

import { useActionState, useTransition } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import type { ActionState } from "./actions";

/** Formulario genérico con mensaje de éxito/error. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="mt-2 text-sm text-stock">{state.ok}</p>}
      <div className="mt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Fila con nombre + botón de borrar, para marcas/categorías/proveedores. */
export function DeletableRow({
  id,
  label,
  sub,
  onDelete,
}: {
  id: string;
  label: string;
  sub?: string;
  onDelete: (id: string) => Promise<{ error?: string; ok?: boolean }>;
}) {
  const [pending, start] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-line-2 bg-panel-2 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink">{label}</p>
        {sub && <p className="truncate text-xs text-faint">{sub}</p>}
      </div>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await onDelete(id);
            if (res?.error) alert(res.error);
          })
        }
        className="shrink-0 rounded-lg border border-danger/40 px-2.5 py-1 text-xs text-danger transition hover:bg-danger/15 disabled:opacity-50"
      >
        {pending ? "..." : "Borrar"}
      </button>
    </li>
  );
}

export function InlineCreate({
  action,
  placeholder,
  extra,
  buttonLabel = "Agregar",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  placeholder: string;
  extra?: React.ReactNode;
  buttonLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Input name="name" placeholder={placeholder} required className="min-w-40 flex-1" />
        {extra}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-br from-purple-2 to-purple-3 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "..." : buttonLabel}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="mt-2 text-sm text-stock">{state.ok}</p>}
    </form>
  );
}

export { Field, Input, Select };
