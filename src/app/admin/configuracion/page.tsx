import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import {
  createBrand,
  createCategory,
  createSupplier,
  deleteBrand,
  deleteCategory,
  deleteSupplier,
  updateSettings,
} from "./actions";
import { ActionForm, DeletableRow, Field, Input, InlineCreate, Select } from "./forms";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [settings, brands, grupos, categorias, suppliers] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { name: "asc" } }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
      include: { parent: true, _count: { select: { products: true } } },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { importOrders: true } } },
    }),
  ]);

  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink">Configuración</h1>
        <p className="mt-1 text-sm text-muted">
          Todo esto se cambia sin tocar código. Los datos de contacto se usan en el sitio público.
        </p>
      </div>

      {/* ---------------- Tienda ---------------- */}
      <Card className="mb-5">
        <h2 className="mb-4 font-semibold text-ink">Datos de la tienda</h2>

        <ActionForm action={updateSettings} submitLabel="Guardar configuración">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre de la tienda">
              <Input name="storeName" defaultValue={settings?.storeName ?? "LeanWear"} required />
            </Field>
            <Field label="Frase / descripción">
              <Input name="tagline" defaultValue={settings?.tagline ?? ""} placeholder="Importación de ropa y calzado" />
            </Field>
            <Field label="Instagram" hint="Sin la @. Se usa para el DM y el botón flotante.">
              <Input name="instagram" defaultValue={settings?.instagram ?? ""} placeholder="leanwear.uy" />
            </Field>
            <Field label="Email de contacto">
              <Input name="contactEmail" type="email" defaultValue={settings?.contactEmail ?? ""} />
            </Field>
          </div>

          <div className="mt-5 rounded-xl border border-line-2 bg-panel-2/50 p-4">
            <p className="mb-4 text-sm font-medium text-ink">Moneda y cálculos</p>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Símbolo">
                <Input name="currencySymbol" defaultValue={settings?.currencySymbol ?? "$"} required />
              </Field>
              <Field label="Dólar (USD → UYU)" hint="Se usa en las estadísticas">
                <Input
                  name="exchangeRateUsdUyu"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={settings ? Number(settings.exchangeRateUsdUyu) : 40}
                  required
                />
              </Field>
              <Field label="Margen sugerido (%)">
                <Input
                  name="defaultMarginPct"
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  defaultValue={settings ? Number(settings.defaultMarginPct) : 50}
                  required
                />
              </Field>
              <Field label="Demora de encargues" hint="Se muestra en Cómo comprar">
                <Input name="encargueLeadTimeDays" defaultValue={settings?.encargueLeadTimeDays ?? "25-30"} />
              </Field>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line-2 bg-panel-2/50 p-4">
            <p className="text-sm font-medium text-ink">Aduana de Uruguay</p>
            <p className="mb-4 mt-1 text-xs text-muted">
              Valores que se aplican por defecto al crear un pedido. Se pueden ajustar en cada uno.
            </p>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Impuesto CON franquicia (%)">
                <Input
                  name="franchiseTaxPct"
                  type="number" min="0" step="0.01" required
                  defaultValue={settings ? Number(settings.franchiseTaxPct) : 22}
                />
              </Field>
              <Field label="Correo CON franquicia (USD)">
                <Input
                  name="franchisePostalFeeUsd"
                  type="number" min="0" step="0.01" required
                  defaultValue={settings ? Number(settings.franchisePostalFeeUsd) : 2.6}
                />
              </Field>
              <Field label="Impuesto SIN franquicia (%)">
                <Input
                  name="standardTaxPct"
                  type="number" min="0" step="0.01" required
                  defaultValue={settings ? Number(settings.standardTaxPct) : 60}
                />
              </Field>
              <Field label="Correo SIN franquicia (USD)">
                <Input
                  name="standardPostalFeeUsd"
                  type="number" min="0" step="0.01" required
                  defaultValue={settings ? Number(settings.standardPostalFeeUsd) : 4.5}
                />
              </Field>
            </div>
          </div>
        </ActionForm>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------------- Marcas ---------------- */}
        <Card>
          <h2 className="font-semibold text-ink">Marcas</h2>
          <p className="mt-1 text-sm text-muted">No se pueden borrar si tienen productos.</p>

          <InlineCreate action={createBrand} placeholder="Nombre de la marca" />

          <ul className="mt-4 space-y-2">
            {brands.map((b) => (
              <DeletableRow
                key={b.id}
                id={b.id}
                label={b.name}
                sub={`${b._count.products} productos`}
                onDelete={deleteBrand}
              />
            ))}
          </ul>
        </Card>

        {/* ---------------- Categorías ---------------- */}
        <Card>
          <h2 className="font-semibold text-ink">Categorías</h2>
          <p className="mt-1 text-sm text-muted">Cada una pertenece a un grupo del menú.</p>

          <InlineCreate
            action={createCategory}
            placeholder="Nombre de la categoría"
            extra={
              <Select name="parentId" required defaultValue="" className="min-w-36 flex-1">
                <option value="">Grupo…</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            }
          />

          <ul className="mt-4 space-y-2">
            {categorias.map((c) => (
              <DeletableRow
                key={c.id}
                id={c.id}
                label={c.name}
                sub={`${c.parent?.name ?? "—"} · ${c._count.products} productos`}
                onDelete={deleteCategory}
              />
            ))}
          </ul>
        </Card>

        {/* ---------------- Proveedores ---------------- */}
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-ink">Proveedores</h2>
          <p className="mt-1 text-sm text-muted">Kakobuy, Taobao, Weidian, Yupoo…</p>

          <InlineCreate
            action={createSupplier}
            placeholder="Nombre del proveedor"
            extra={<Input name="url" type="url" placeholder="https://..." className="min-w-48 flex-1" />}
          />

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {suppliers.map((s) => (
              <DeletableRow
                key={s.id}
                id={s.id}
                label={s.name}
                sub={`${s._count.importOrders} pedidos`}
                onDelete={deleteSupplier}
              />
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
