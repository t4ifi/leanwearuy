/**
 * Inicio del panel: métricas rápidas del catálogo.
 * Server Component: consulta la base directamente, sin API intermedia.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

async function getStats() {
  const [productos, activos, conPrecio, sinPrecio, destacados, agotados, marcas, imagenes, pocoStock] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { salePriceUyu: { not: null } } }),
      prisma.product.count({ where: { salePriceUyu: null } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { soldOut: true } }),
      prisma.brand.count(),
      prisma.productImage.count(),
      prisma.product.count({ where: { section: "STOCK", stock: { lte: 2 } } }),
    ]);
  return { productos, activos, conPrecio, sinPrecio, destacados, agotados, marcas, imagenes, pocoStock };
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-[#6c6790]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#f3f1fa]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#6c6790]">{hint}</p>}
    </Card>
  );
}

export default async function AdminHome() {
  const s = await getStats();

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f3f1fa]">Inicio</h1>
          <p className="mt-1 text-sm text-[#a39ec0]">Resumen del catálogo.</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Productos" value={s.productos} hint={`${s.activos} publicados`} />
        <Stat label="Con precio" value={s.conPrecio} hint={`${s.sinPrecio} a consultar`} />
        <Stat label="Destacados" value={s.destacados} />
        <Stat label="Agotados" value={s.agotados} />
        <Stat label="Marcas" value={s.marcas} />
        <Stat label="Imágenes" value={s.imagenes} />
        <Stat label="Poco stock" value={s.pocoStock} hint="en sección Stock" />
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold text-[#f3f1fa]">Próximamente</h2>
        <p className="mt-1 text-sm text-[#a39ec0]">
          Módulo de importaciones con costo real por producto (prorrateo del envío por peso),
          ganancia, margen y estadísticas del negocio.
        </p>
      </Card>
    </>
  );
}
