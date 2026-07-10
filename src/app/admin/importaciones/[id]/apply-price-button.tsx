"use client";

import { useTransition } from "react";
import { applyPrice } from "../actions";

/** Aplica el precio sugerido al producto, con un solo click. */
export function ApplyPriceButton({
  productId,
  orderId,
  price,
  current,
}: {
  productId: string;
  orderId: string;
  price: number;
  current: number | null;
}) {
  const [pending, start] = useTransition();
  const yaEsta = current != null && Math.abs(current - price) < 0.5;

  if (yaEsta) return <span className="text-xs text-stock">✓ aplicado</span>;

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await applyPrice(productId, orderId, price);
          if (res?.error) alert(res.error);
        })
      }
      title={current ? `Reemplaza el precio actual ($ ${current.toLocaleString("es-UY")})` : undefined}
      className="rounded-md border border-purple/40 bg-purple/10 px-2 py-1 text-xs text-purple-2 transition hover:bg-purple/20 disabled:opacity-50"
    >
      {pending ? "..." : current ? "Reemplazar" : "Aplicar"}
    </button>
  );
}
