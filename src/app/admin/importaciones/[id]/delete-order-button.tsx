"use client";

import { useTransition } from "react";
import { deleteImportOrder } from "../actions";

/**
 * Borra el pedido entero (y sus líneas, en cascada).
 * Los productos del catálogo NO se tocan: sólo pierden el costo real
 * que venía de este pedido.
 */
export function DeleteOrderButton({ id, code }: { id: string; code: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `¿Borrar el pedido "${code}"?\n\nSe eliminan sus líneas y el costo real que aportaba a los productos. Los productos del catálogo no se borran.`,
          )
        )
          return;
        start(() => deleteImportOrder(id).then(() => {}));
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-danger/40 px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
    >
      {pending ? "Borrando..." : "Borrar pedido"}
    </button>
  );
}
