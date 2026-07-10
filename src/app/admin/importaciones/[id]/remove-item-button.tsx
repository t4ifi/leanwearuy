"use client";

import { useTransition } from "react";
import { removeImportItem } from "../actions";

export function RemoveItemButton({ itemId, name }: { itemId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Quitar "${name}" del pedido?`)) return;
        startTransition(() => removeImportItem(itemId).then(() => {}));
      }}
      className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs text-danger transition hover:bg-danger/15 disabled:opacity-50"
    >
      {pending ? "..." : "Quitar"}
    </button>
  );
}
