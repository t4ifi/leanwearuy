"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import type { ActionState } from "./actions";
import type { Option } from "../productos/product-form";

export type FranchiseSettings = {
  franchiseTaxPct: number;
  franchisePostalFeeUsd: number;
  standardTaxPct: number;
  standardPostalFeeUsd: number;
};

export type OrderDefaults = {
  code?: string;
  orderDate?: string;
  supplierId?: string | null;
  status?: string;
  shippingCostUsd?: number;
  otherCostsUsd?: number;
  exchangeRate?: number;
  usesFranchise?: boolean;
  taxRatePct?: number;
  customsBaseUsd?: number | null;
  postalFeeUsd?: number;
  storageUsd?: number;
  creditUsd?: number;
  notes?: string | null;
};

export function OrderForm({
  action,
  suppliers,
  franchise,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  suppliers: Option[];
  franchise: FranchiseSettings;
  defaults?: OrderDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  const usaFranquiciaInicial = defaults.usesFranchise ?? true;
  const [usaFranquicia, setUsaFranquicia] = useState(usaFranquiciaInicial);
  const [tasa, setTasa] = useState(String(defaults.taxRatePct ?? franchise.franchiseTaxPct));
  const [correo, setCorreo] = useState(
    String(defaults.postalFeeUsd ?? franchise.franchisePostalFeeUsd),
  );

  /** Al cambiar el régimen, se aplican las tasas correspondientes. */
  function cambiarRegimen(activa: boolean) {
    setUsaFranquicia(activa);
    setTasa(String(activa ? franchise.franchiseTaxPct : franchise.standardTaxPct));
    setCorreo(String(activa ? franchise.franchisePostalFeeUsd : franchise.standardPostalFeeUsd));
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      {/* ---------------- Datos ---------------- */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Datos del pedido</h2>

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

      {/* ---------------- Envío ---------------- */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Envío y gastos (USD)</h2>
          <p className="mt-1 text-sm text-muted">
            Se pagan <strong>una sola vez por todo el pedido</strong> y se reparten entre los
            productos <strong>según su peso</strong>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Envío internacional">
            <Input name="shippingCostUsd" type="number" min="0" step="0.01" defaultValue={defaults.shippingCostUsd ?? 0} />
          </Field>
          <Field label="Otros gastos">
            <Input name="otherCostsUsd" type="number" min="0" step="0.01" defaultValue={defaults.otherCostsUsd ?? 0} />
          </Field>
          <Field label="Dólar (USD → UYU) *" hint="Se guarda en este pedido">
            <Input name="exchangeRate" type="number" min="0.01" step="0.01" required defaultValue={defaults.exchangeRate ?? 40} />
          </Field>
        </div>
      </Card>

      {/* ---------------- Aduana ---------------- */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Aduana (Uruguay)</h2>
          <p className="mt-1 text-sm text-muted">
            El impuesto se calcula solo sobre el valor del pedido. Con franquicia pagás mucho menos.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-2 bg-panel-2/50 p-4">
          <input
            type="checkbox"
            name="usesFranchise"
            checked={usaFranquicia}
            onChange={(e) => cambiarRegimen(e.target.checked)}
            className="mt-0.5 size-4 accent-purple"
          />
          <span>
            <span className="text-sm font-medium text-ink">Uso franquicia</span>
            <span className="mt-0.5 block text-xs text-muted">
              Con franquicia: {franchise.franchiseTaxPct}% + US$ {franchise.franchisePostalFeeUsd} de
              correo. Sin franquicia: {franchise.standardTaxPct}% + US$ {franchise.standardPostalFeeUsd}.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Impuesto (%)" hint="Se aplica sobre la base imponible">
            <Input
              name="taxRatePct"
              type="number"
              min="0"
              step="0.01"
              required
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
            />
          </Field>
          <Field label="Servicio de Correo Uruguayo (USD)">
            <Input
              name="postalFeeUsd"
              type="number"
              min="0"
              step="0.01"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Field>
          <Field
            label="Base imponible (USD)"
            hint="Vacío = el costo de los productos del pedido"
          >
            <Input
              name="customsBaseUsd"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults.customsBaseUsd ?? ""}
              placeholder="automático"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Costo de almacenamiento (USD)">
            <Input name="storageUsd" type="number" min="0" step="0.01" defaultValue={defaults.storageUsd ?? 0} />
          </Field>
          <Field label="Saldo a favor (USD)" hint="Se descuenta del total">
            <Input name="creditUsd" type="number" min="0" step="0.01" defaultValue={defaults.creditUsd ?? 0} />
          </Field>
        </div>
      </Card>

      <Card>
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
