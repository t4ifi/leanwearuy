"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import type { ActionState } from "./actions";

export type Option = { id: string; name: string };

export type ProductDefaults = {
  name?: string;
  description?: string | null;
  brandId?: string;
  categoryId?: string;
  supplierId?: string | null;
  section?: string;
  status?: string;
  condition?: string;
  featured?: boolean;
  soldOut?: boolean;
  salePriceUyu?: number | null;
  purchaseCostUsd?: number | null;
  weightGrams?: number | null;
  supplierUrl?: string | null;
  sku?: string | null;
  stock?: number;
  lowStockThreshold?: number;
  sizes?: string[];
  colors?: string[];
};

export function ProductForm({
  action,
  brands,
  categories,
  suppliers,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  brands: Option[];
  categories: Option[];
  suppliers: Option[];
  defaults?: ProductDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const err = (f: string) => state.fieldErrors?.[f];

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-xl border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-4 py-3 text-sm text-[#ff8a8a]">
          {state.error}
        </div>
      )}

      {/* ---------- Datos básicos ---------- */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-[#f3f1fa]">Datos del producto</h2>

        <Field label="Nombre *" error={err("name")}>
          <Input name="name" defaultValue={defaults.name} required placeholder="Jordan 4 Lightning" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marca *" error={err("brandId")}>
            <Select name="brandId" defaultValue={defaults.brandId} required>
              <option value="">Elegir…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Categoría *" error={err("categoryId")}>
            <Select name="categoryId" defaultValue={defaults.categoryId} required>
              <option value="">Elegir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Sección *">
            <Select name="section" defaultValue={defaults.section ?? "ENCARGUE"}>
              <option value="ENCARGUE">Encargue (a pedido)</option>
              <option value="STOCK">Stock (disponible)</option>
            </Select>
          </Field>
        </div>

        <Field label="Descripción" error={err("description")}>
          <Textarea name="description" defaultValue={defaults.description ?? ""} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Talles" hint="Separados por coma. Ej: S, M, L, XL">
            <Input name="sizes" defaultValue={defaults.sizes?.join(", ")} placeholder="S, M, L, XL" />
          </Field>
          <Field label="Colores" hint="Separados por coma">
            <Input name="colors" defaultValue={defaults.colors?.join(", ")} placeholder="Negro, Gris" />
          </Field>
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          <Checkbox name="featured" label="Destacado" defaultChecked={defaults.featured} />
          <Checkbox name="soldOut" label="Agotado" defaultChecked={defaults.soldOut} />
        </div>
      </Card>

      {/* ---------- Precio y costo ---------- */}
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold text-[#f3f1fa]">Precio y costo</h2>
          <p className="mt-1 text-sm text-[#a39ec0]">
            El costo <strong>real</strong> se calcula solo cuando vinculás el producto a un pedido de
            importación (envío prorrateado por peso). Estos campos son de referencia.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Precio de venta (UYU)"
            error={err("salePriceUyu")}
            hint="Vacío o 0 → la web muestra 'Consultar'"
          >
            <Input
              name="salePriceUyu"
              type="number"
              min="0"
              step="1"
              defaultValue={defaults.salePriceUyu ?? ""}
              placeholder="6890"
            />
          </Field>

          <Field label="Costo de compra (USD)" error={err("purchaseCostUsd")}>
            <Input
              name="purchaseCostUsd"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults.purchaseCostUsd ?? ""}
              placeholder="60"
            />
          </Field>

          <Field
            label="Peso (gramos)"
            error={err("weightGrams")}
            hint="Clave: define cuánto envío absorbe"
          >
            <Input
              name="weightGrams"
              type="number"
              min="0"
              step="1"
              defaultValue={defaults.weightGrams ?? ""}
              placeholder="1800"
            />
          </Field>
        </div>
      </Card>

      {/* ---------- Proveedor y stock ---------- */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-[#f3f1fa]">Proveedor y stock</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Proveedor">
            <Select name="supplierId" defaultValue={defaults.supplierId ?? ""}>
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="Link del proveedor"
            error={err("supplierUrl")}
            hint="Kakobuy, Taobao, Weidian, Yupoo…"
          >
            <Input
              name="supplierUrl"
              type="url"
              defaultValue={defaults.supplierUrl ?? ""}
              placeholder="https://kakobuy.com/..."
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Stock" error={err("stock")}>
            <Input name="stock" type="number" min="0" defaultValue={defaults.stock ?? 0} />
          </Field>
          <Field label="Aviso de poco stock" error={err("lowStockThreshold")}>
            <Input name="lowStockThreshold" type="number" min="0" defaultValue={defaults.lowStockThreshold ?? 2} />
          </Field>
          <Field label="SKU" error={err("sku")}>
            <Input name="sku" defaultValue={defaults.sku ?? ""} placeholder="opcional" />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={defaults.status ?? "ACTIVE"}>
              <option value="ACTIVE">Publicado</option>
              <option value="DRAFT">Borrador</option>
              <option value="ARCHIVED">Archivado</option>
            </Select>
          </Field>
        </div>

        <Field label="Condición">
          <Select name="condition" defaultValue={defaults.condition ?? "NEW"} className="sm:max-w-xs">
            <option value="NEW">Nuevo</option>
            <option value="PREOWNED">Usado</option>
          </Select>
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
        <Link
          href="/admin/productos"
          className="rounded-xl border border-[#2c2647] bg-[#1b1730] px-5 py-2.5 text-sm font-semibold text-[#a39ec0] transition hover:text-[#f3f1fa]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
