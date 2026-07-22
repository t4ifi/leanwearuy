"use client";

import { useTransition } from "react";
import { deleteSale } from "./actions";

export function DeleteSaleButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Borrar la venta de "${name}"?\n\nSe devuelve el stock descontado.`)) return;
        start(() => deleteSale(id).then(() => {}));
      }}
      className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs text-danger transition hover:bg-danger/15 disabled:opacity-50"
    >
      {pending ? "..." : "Borrar"}
    </button>
  );
}
