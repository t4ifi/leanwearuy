import { prisma } from "@/lib/prisma";
import { ButtonLink, Card, PageHeader, Stat } from "@/components/ui";
import { IconPlus } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

async function getStats() {
  const [productos, activos, conPrecio, sinPrecio, destacados, agotados, marcas, imagenes, pedidos] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { salePriceUyu: { not: null } } }),
      prisma.product.count({ where: { salePriceUyu: null } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { soldOut: true } }),
      prisma.brand.count(),
      prisma.productImage.count(),
      prisma.importOrder.count(),
    ]);
  return { productos, activos, conPrecio, sinPrecio, destacados, agotados, marcas, imagenes, pedidos };
}

export default async function AdminHome() {
  const s = await getStats();

  return (
    <>
      <PageHeader title="Inicio" description="Resumen del catálogo.">
        <ButtonLink href="/admin/productos/nuevo">
          <IconPlus className="size-4" />
          Nuevo producto
        </ButtonLink>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Productos" value={s.productos} hint={`${s.activos} publicados`} />
        <Stat label="Con precio" value={s.conPrecio} hint={`${s.sinPrecio} a consultar`} />
        <Stat label="Destacados" value={s.destacados} />
        <Stat label="Agotados" value={s.agotados} tone={s.agotados > 0 ? "warn" : undefined} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Marcas" value={s.marcas} />
        <Stat label="Imágenes" value={s.imagenes} />
        <Stat label="Pedidos de importación" value={s.pedidos} />
      </div>

      {s.pedidos === 0 && (
        <Card className="mt-6 border-purple/25">
          <h2 className="text-sm font-semibold text-ink">Empezá a medir tu negocio</h2>
          <p className="mt-1.5 text-sm text-muted">
            Cargá tu primer pedido de importación con el envío y los pesos de cada prenda. El sistema
            calcula el costo real de cada producto y te muestra la ganancia y el margen.
          </p>
          <div className="mt-5">
            <ButtonLink href="/admin/importaciones/nueva" variant="secondary">
              Crear pedido de importación
            </ButtonLink>
          </div>
        </Card>
      )}
    </>
  );
}
