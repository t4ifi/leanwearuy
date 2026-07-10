"use client";

import { useTransition } from "react";
import { deleteProduct } from "./actions";

/**
 * Botón de borrado con confirmación.
 * Si el producto está vinculado a un pedido de importación, la acción
 * del servidor lo archiva en vez de borrarlo (para no perder el historial).
 */
export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Eliminar "${name}"?\n\nSi está en un pedido de importación, se archiva en vez de borrarse.`))
          return;
        startTransition(async () => {
          const res = await deleteProduct(id);
          if (res?.archived) alert("El producto estaba en un pedido: se archivó en vez de borrarse.");
        });
      }}
      className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs text-danger transition hover:bg-danger/10 disabled:opacity-50"
    >
      {pending ? "..." : "Eliminar"}
    </button>
  );
}
