/**
 * Vista de Proveedor: para reponer stock de un vistazo.
 * Cada producto en grande, con su link al proveedor y los talles que se
 * consiguen. Todo editable desde la misma tarjeta.
 */
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader } from "@/components/ui";
import { IconSearch } from "@/components/admin/icons";
import { SupplierCard } from "./supplier-card";

export const dynamic = "force-dynamic";

export default async function ProveedorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  const [productos, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { brand: { name: { contains: term, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: {
        brand: { select: { name: true } },
        category: { select: { parent: { select: { name: true } } } },
        supplier: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Proveedor"
        description="Repone stock rápido: el link de cada producto y los talles que se consiguen."
      />

      <form className="mb-6">
        <div className="relative max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            name="q"
            defaultValue={term}
            placeholder="Buscar por nombre o marca..."
            className="w-full rounded-lg border border-line-2 bg-panel-2 py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:border-purple"
          />
        </div>
      </form>

      {productos.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description={term ? "Probá con otra búsqueda." : "Cargá productos para verlos acá."}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {productos.map((p) => (
            <SupplierCard
              key={p.id}
              suppliers={suppliers}
              product={{
                id: p.id,
                name: p.name,
                brand: p.brand.name,
                group: p.category.parent?.name ?? null,
                image: p.images[0]?.url ?? null,
                supplierId: p.supplierId,
                supplierName: p.supplier?.name ?? null,
                supplierUrl: p.supplierUrl,
                sizes: p.sizes,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
