"use client";

import { useActionState } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import type { ActionState } from "./actions";
import type { Option } from "../productos/product-form";

export type OrderDefaults = {
  code?: string;
  orderDate?: string;
  supplierId?: string | null;
  status?: string;
  shippingCostUsd?: number;
  taxesUsd?: number;
  otherCostsUsd?: number;
  exchangeRate?: number;
  notes?: string | null;
};

export function OrderForm({
  action,
  suppliers,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  suppliers: Option[];
  defaults?: OrderDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <Card className="space-y-4">
        <h2 className="font-semibold text-ink">Datos del pedido</h2>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Código *" hint="Ej: IMP-001">
            <Input name="code" defaultValue={defaults.code} required placeholder="IMP-001" />
          </Field>
          <Field label="Fecha *">
            <Input
              name="orderDate"
              type="date"
              required
              defaultValue={defaults.orderDate ?? new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="Proveedor">
            <Select name="supplierId" defaultValue={defaults.supplierId ?? ""}>
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={defaults.status ?? "DRAFT"}>
              <option value="DRAFT">Borrador</option>
              <option value="ORDERED">Pedido</option>
              <option value="SHIPPED">En camino</option>
              <option value="RECEIVED">Recibido</option>
              <option value="CANCELLED">Cancelado</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold text-ink">Costos del pedido (en USD)</h2>
          <p className="mt-1 text-sm text-muted">
            Estos costos se pagan <strong>una sola vez por todo el pedido</strong> y se reparten
            entre los productos <strong>según su peso</strong>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Envío internacional">
            <Input name="shippingCostUsd" type="number" min="0" step="0.01" defaultValue={defaults.shippingCostUsd ?? 0} />
          </Field>
          <Field label="Impuestos">
            <Input name="taxesUsd" type="number" min="0" step="0.01" defaultValue={defaults.taxesUsd ?? 0} />
          </Field>
          <Field label="Otros gastos">
            <Input name="otherCostsUsd" type="number" min="0" step="0.01" defaultValue={defaults.otherCostsUsd ?? 0} />
          </Field>
          <Field label="Dólar (USD → UYU) *" hint="Se guarda en este pedido">
            <Input name="exchangeRate" type="number" min="0.01" step="0.01" required defaultValue={defaults.exchangeRate ?? 40} />
          </Field>
        </div>

        <Field label="Notas">
          <Textarea name="notes" defaultValue={defaults.notes ?? ""} placeholder="Observaciones del pedido..." />
        </Field>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
