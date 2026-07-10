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
      className="rounded-lg border border-[#ff6b6b]/40 px-2.5 py-1 text-xs text-[#ff8a8a] transition hover:bg-[#ff6b6b]/15 disabled:opacity-50"
    >
      {pending ? "..." : "Quitar"}
    </button>
  );
}
