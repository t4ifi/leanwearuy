"use client";

import { useActionState } from "react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { createProductFromItem, type ActionState } from "../../../../actions";
import type { Option } from "@/app/admin/productos/product-form";

/**
 * Formulario para convertir un item del pedido en un producto del catálogo.
 * El nombre, el costo y el peso ya vienen del item; sólo falta lo que un
 * item suelto no tiene: marca, categoría y (opcional) el precio de venta.
 */
export function CreateFromItemForm({
  itemId,
  brands,
  categories,
  defaults,
}: {
  itemId: string;
  brands: Option[];
  categories: Option[];
  defaults: { name: string; salePriceUyu: number };
}) {
  const action = createProductFromItem.bind(null, itemId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction}>
      <Card className="space-y-4">
        {state.error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error}
          </div>
        )}

        <Field label="Nombre *">
          <Input name="name" defaultValue={defaults.name} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marca *">
            <Select name="brandId" required defaultValue="">
              <option value="">Elegir…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Categoría *">
            <Select name="categoryId" required defaultValue="">
              <option value="">Elegir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sección">
            <Select name="section" defaultValue="ENCARGUE">
              <option value="ENCARGUE">Encargue (a pedido)</option>
              <option value="STOCK">Stock (disponible)</option>
            </Select>
          </Field>
        </div>

        <Field
          label="Precio de venta (UYU)"
          hint="Pre-cargado con el precio ideal. Vacío o 0 → la web muestra 'Consultar'."
        >
          <Input
            name="salePriceUyu"
            type="number"
            min="0"
            step="1"
            defaultValue={defaults.salePriceUyu > 0 ? defaults.salePriceUyu : ""}
            className="sm:max-w-xs"
          />
        </Field>

        <p className="text-xs text-faint">
          El producto se crea como <strong>borrador</strong> (no aparece en la web) y hereda el peso y
          el costo de este item. Después le agregás las fotos y lo publicás.
        </p>

        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear producto y vincular"}
        </Button>
      </Card>
    </form>
  );
}
