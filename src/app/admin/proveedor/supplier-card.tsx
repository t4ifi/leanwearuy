"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Field, Input, Select } from "@/components/ui";
import { IconExternal, IconPencil } from "@/components/admin/icons";
import { updateSupplierInfo, type SupplierState } from "./actions";

export type SupplierProduct = {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  supplierId: string | null;
  supplierName: string | null;
  supplierUrl: string | null;
  sizes: string[];
};

export function SupplierCard({
  product,
  suppliers,
}: {
  product: SupplierProduct;
  suppliers: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const action = updateSupplierInfo.bind(null, product.id);
  const [state, formAction, pending] = useActionState<SupplierState, FormData>(action, {});

  // Al guardar bien, salimos del modo edición.
  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state.ok]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
      {/* ---------- Imagen ---------- */}
      <div className="relative aspect-square bg-bg-elev">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-purple/40">◆</div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-line-2 bg-bg/80 px-2.5 py-1 text-xs text-muted backdrop-blur">
          {product.brand}
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-line-2 bg-bg/80 px-3 py-1.5 text-xs text-muted backdrop-blur transition hover:border-purple hover:text-ink"
          >
            <IconPencil className="size-3.5" />
            Editar
          </button>
        )}
      </div>

      {/* ---------- Cuerpo ---------- */}
      <div className="p-5">
        <h3 className="font-head text-lg font-semibold text-ink">{product.name}</h3>

        {editing ? (
          <form action={formAction} className="mt-4 space-y-4">
            <Field label="Proveedor">
              <Select name="supplierId" defaultValue={product.supplierId ?? ""}>
                <option value="">Sin proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Link para reponer" hint="Kakobuy, Taobao, Weidian, Yupoo…">
              <Input
                name="supplierUrl"
                type="url"
                defaultValue={product.supplierUrl ?? ""}
                placeholder="https://kakobuy.com/..."
              />
            </Field>

            <Field label="Talles que se consiguen" hint="Separados por coma">
              <Input name="sizes" defaultValue={product.sizes.join(", ")} placeholder="S, M, L, XL" />
            </Field>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-gradient-to-br from-purple-2 to-purple-3 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {pending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-line-2 px-4 py-2 text-sm text-muted transition hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Link del proveedor */}
            {product.supplierUrl ? (
              <Link
                href={product.supplierUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 rounded-lg border border-purple/40 bg-purple/10 px-4 py-2.5 text-sm font-medium text-purple-2 transition hover:bg-purple/20"
              >
                <IconExternal className="size-4" />
                Ver en {product.supplierName ?? "el proveedor"}
              </Link>
            ) : (
              <p className="rounded-lg border border-dashed border-line-2 px-4 py-2.5 text-center text-sm text-faint">
                Sin link cargado
              </p>
            )}

            {/* Talles */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">
                Talles que se consiguen
              </p>
              {product.sizes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-line-2 bg-panel-2 px-2.5 py-1 text-sm text-ink"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint">Sin talles cargados</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
