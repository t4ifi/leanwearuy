"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { VENTA_SUELTA } from "@/lib/sales-constants";
import { createSale, type SaleState } from "./actions";

export type SaleProduct = {
  id: string;
  name: string;
  priceUyu: number; // precio de venta cargado
  costUyu: number; // costo real por unidad, en pesos
};

const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");

export function SaleForm({ products }: { products: SaleProduct[] }) {
  const [state, formAction, pending] = useActionState<SaleState, FormData>(createSale, {});

  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [qty, setQty] = useState("1");

  const suelta = productId === VENTA_SUELTA;

  // Al elegir un producto, autocompletamos su precio y su costo.
  useEffect(() => {
    if (suelta || productId === "") return;
    const p = products.find((x) => x.id === productId);
    if (p) {
      setPrice(p.priceUyu > 0 ? String(p.priceUyu) : "");
      setCost(p.costUyu > 0 ? String(Math.round(p.costUyu)) : "");
    }
  }, [productId, products, suelta]);

  // Ganancia estimada en vivo.
  const gan =
    (Number(price) || 0) - (Number(cost) || 0);
  const ganTotal = gan * (Number(qty) || 1);

  // Al registrar bien, limpiamos.
  useEffect(() => {
    if (state.ok) {
      setProductId("");
      setPrice("");
      setCost("");
      setQty("1");
    }
  }, [state.ok]);

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-ink">Registrar una venta</h2>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Producto *">
            <Select
              name="productId"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Elegir producto…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value={VENTA_SUELTA}>➕ Venta suelta (fuera del catálogo)</option>
            </Select>
          </Field>

          <Field label="Fecha *">
            <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>

        {suelta && (
          <div className="rounded-lg border border-purple/30 bg-purple/5 p-4">
            <Field label="Nombre de lo vendido *">
              <Input name="productName" placeholder="Ej: Remera random" required className="sm:max-w-md" />
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Cantidad">
            <Input name="quantity" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="Precio de venta c/u (UYU) *">
            <Input
              name="unitPriceUyu"
              type="number"
              min="0"
              step="1"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="6890"
            />
          </Field>
          <Field label="Costo real c/u (UYU)" hint="Se autocompleta; editalo si hace falta">
            <Input
              name="unitCostUyu"
              type="number"
              min="0"
              step="1"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente (opcional)">
            <Input name="customer" placeholder="Nombre / @usuario" />
          </Field>
          <Field label="Notas (opcional)">
            <Textarea name="notes" className="min-h-0" rows={1} />
          </Field>
        </div>

        {/* Ganancia estimada en vivo */}
        {Number(price) > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-line-2 bg-panel-2/50 px-4 py-3 text-sm">
            <span className="text-muted">Ganancia de esta venta</span>
            <span className={ganTotal >= 0 ? "font-semibold text-stock" : "font-semibold text-danger"}>
              {uyu(ganTotal)}
              {gan >= 0 && Number(price) > 0 && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({Math.round((gan / Number(price)) * 100)}% margen)
                </span>
              )}
            </span>
          </div>
        )}

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.ok && <p className="text-sm text-stock">✓ Venta registrada.</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar venta"}
        </Button>
      </form>
    </Card>
  );
}
