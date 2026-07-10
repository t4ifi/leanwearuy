"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { addImportItem, type ActionState } from "../actions";
import type { Option } from "../../productos/product-form";

export function AddItemForm({ orderId, productos }: { orderId: string; productos: Option[] }) {
  const action = addImportItem.bind(null, orderId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="grid gap-3 sm:grid-cols-[2fr_repeat(3,1fr)_auto] sm:items-end">
        <Field label="Producto *">
          <Select name="productId" required defaultValue="">
            <option value="">Elegir producto…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
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
    </form>
  );
}
