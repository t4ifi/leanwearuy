"use client";

import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { addImportItem, type ActionState } from "../actions";
import { FUERA_DE_CATALOGO } from "@/lib/import-constants";
import type { Option } from "../../productos/product-form";

/**
 * Agrega una línea al pedido.
 *
 * Puede ser un producto del catálogo o un artículo que no se publica en la
 * web. En ambos casos pesa y por lo tanto absorbe parte del envío.
 */
export function AddItemForm({ orderId, productos }: { orderId: string; productos: Option[] }) {
  const action = addImportItem.bind(null, orderId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [productId, setProductId] = useState("");

  const fueraDeCatalogo = productId === FUERA_DE_CATALOGO;

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-[2fr_repeat(3,1fr)_auto] sm:items-end">
        <Field label="Producto *">
          <Select
            name="productId"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Elegir producto…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value={FUERA_DE_CATALOGO}>➕ Fuera del catálogo…</option>
          </Select>
        </Field>

        <Field label="Cantidad">
          <Input name="quantity" type="number" min="1" step="1" defaultValue={1} />
        </Field>

        <Field label="Costo c/u (USD)">
          <Input name="unitCostUsd" type="number" min="0" step="0.01" placeholder="60" required />
        </Field>

        <Field label="Peso c/u (g) *">
          <Input name="unitWeightGrams" type="number" min="0" step="1" placeholder="1800" required />
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Agregar"}
        </Button>
      </div>

      {fueraDeCatalogo && (
        <div className="rounded-lg border border-purple/30 bg-purple/5 p-4">
          <Field
            label="Nombre del producto *"
            hint="No se publica en la web, pero suma su peso y su costo al pedido."
          >
            <Input name="name" placeholder="Ej: Riñonera Nike (para mí)" required className="sm:max-w-md" />
          </Field>
        </div>
      )}
    </form>
  );
}
