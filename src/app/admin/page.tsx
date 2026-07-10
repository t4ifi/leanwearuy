/**
 * Inicio del panel: lo que necesitás ver apenas entrás.
 * Métricas del catálogo, qué datos faltan, últimos productos y pedidos.
 */
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, PageHeader, Stat } from "@/components/ui";
import { IconPlus, IconTruck } from "@/components/admin/icons";
import { summarizeOrder } from "@/lib/imports";

export const dynamic = "force-dynamic";

const money = (n: number) => "$ " + n.toLocaleString("es-UY");

async function getData() {
  const [
    productos,
    activos,
    borradores,
    sinPrecio,
    sinPeso,
    destacados,
    agotados,
    marcas,
    imagenes,
    ultimos,
    pedidos,
    pocoStock,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { salePriceUyu: null } }),
    prisma.product.count({ where: { weightGrams: null } }),
    prisma.product.count({ where: { featured: true } }),
    prisma.product.count({ where: { soldOut: true } }),
    prisma.brand.count(),
    prisma.productImage.count(),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
    }),
    prisma.importOrder.findMany({
      take: 4,
      orderBy: { orderDate: "desc" },
      include: { supplier: true, items: true },
    }),
    prisma.product.count({ where: { section: "STOCK", stock: { lte: 2 } } }),
  ]);

  return {
    productos, activos, borradores, sinPrecio, sinPeso,
    destacados, agotados, marcas, imagenes, ultimos, pedidos, pocoStock,
  };
}

export default async function AdminHome() {
  const d = await getData();
  const pendientes = [
    { label: "sin precio", n: d.sinPrecio },
    { label: "sin peso", n: d.sinPeso },
  ].filter((x) => x.n > 0);

  return (
    <>
      <PageHeader title="Inicio" description="Todo lo que pasa con tu catálogo, de un vistazo.">
        <ButtonLink href="/admin/importaciones/nueva" variant="secondary">
          <IconTruck className="size-4" />
          Nuevo pedido
        </ButtonLink>
        <ButtonLink href="/admin/productos/nuevo">
          <IconPlus className="size-4" />
          Nuevo producto
        </ButtonLink>
      </PageHeader>

      {/* ---------------- Métricas ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Productos" value={d.productos} hint={`${d.activos} publicados · ${d.borradores} borradores`} />
        <Stat label="Marcas" value={d.marcas} hint={`${d.imagenes} imágenes`} />
        <Stat label="Destacados" value={d.destacados} />
        <Stat
          label="Agotados"
          value={d.agotados}
          tone={d.agotados > 0 ? "warn" : undefined}
          hint={d.pocoStock > 0 ? `${d.pocoStock} con poco stock` : undefined}
        />
      </div>

      {/* ---------------- Qué falta hacer ---------------- */}
      {(pendientes.length > 0 || d.pedidos.length === 0) && (
        <Card className="mt-5 border-purple/25">
          <h2 className="text-sm font-semibold text-ink">Próximos pasos</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {d.pedidos.length === 0 && (
              <Paso href="/admin/importaciones/nueva" cta="Crear pedido">
                Cargá tu primer <strong>pedido de importación</strong> para conocer el costo real de
                cada prenda y tu margen.
              </Paso>
            )}
            {pendientes.map((p) => (
              <Paso key={p.label} href="/admin/productos" cta="Completar">
                Tenés <strong>{p.n} productos {p.label}</strong>. Sin eso, las estadísticas quedan
                incompletas.
              </Paso>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ---------------- Últimos productos ---------------- */}
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold text-ink">Últimos productos</h2>
            <Link href="/admin/productos" className="text-xs text-purple-2 hover:underline">
              Ver todos
            </Link>
          </div>

          <ul>
            {d.ultimos.map((p) => (
              <li key={p.id} className="border-b border-line/60 last:border-0">
                <Link
                  href={`/admin/productos/${p.id}/editar`}
                  className="flex items-center gap-3 px-6 py-3 transition hover:bg-panel-2/40"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line-2 bg-bg-elev">
                    {p.images[0] && (
                      <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{p.name}</p>
                    <p className="text-xs text-faint">{p.brand.name}</p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
                    {p.salePriceUyu ? money(Number(p.salePriceUyu)) : "Consultar"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* ---------------- Últimos pedidos ---------------- */}
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold text-ink">Últimos pedidos</h2>
            <Link href="/admin/importaciones" className="text-xs text-purple-2 hover:underline">
              Ver todos
            </Link>
          </div>

          {d.pedidos.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-faint">
              Todavía no cargaste pedidos de importación.
            </p>
          ) : (
            <ul>
              {d.pedidos.map((o) => {
                const s = summarizeOrder(o);
                return (
                  <li key={o.id} className="border-b border-line/60 last:border-0">
                    <Link
                      href={`/admin/importaciones/${o.id}`}
                      className="flex items-center gap-3 px-6 py-3 transition hover:bg-panel-2/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{o.code}</p>
                        <p className="text-xs text-faint">
                          {o.orderDate.toLocaleDateString("es-UY")} · {s.unidades} u. ·{" "}
                          {(s.pesoTotalG / 1000).toFixed(2)} kg
                        </p>
                      </div>
                      <Badge tone={o.status === "RECEIVED" ? "ok" : "muted"}>
                        {o.status === "RECEIVED" ? "Recibido" : "En curso"}
                      </Badge>
                      <span className="shrink-0 text-sm tabular-nums text-muted">
                        US$ {s.totalUsd}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Paso({ href, cta, children }: { href: string; cta: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-2 bg-panel-2/50 px-4 py-3">
      <span className="text-muted">{children}</span>
      <Link
        href={href}
        className="shrink-0 rounded-lg border border-line-2 px-3 py-1.5 text-xs text-muted transition hover:border-purple hover:text-ink"
      >
        {cta}
      </Link>
    </li>
  );
}
