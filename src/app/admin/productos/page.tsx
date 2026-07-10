/**
 * Listado de productos: tabla densa con buscador.
 * Reemplaza al viejo panel que commiteaba a GitHub: ahora lee de la base.
 */
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { IconPlus, IconSearch } from "@/components/admin/icons";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

const money = (n: number) => "$ " + n.toLocaleString("es-UY");

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  const productos = await prisma.product.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { brand: { name: { contains: term, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { brand: true, category: true, images: { where: { isPrimary: true }, take: 1 } },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Productos"
        description={`${productos.length} ${productos.length === 1 ? "producto" : "productos"}${term ? ` para "${term}"` : ""}`}
      >
        <ButtonLink href="/admin/productos/nuevo">
          <IconPlus className="size-4" />
          Nuevo producto
        </ButtonLink>
      </PageHeader>

      <form className="mb-5">
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
          description={term ? "Probá con otra búsqueda." : "Creá tu primer producto para empezar."}
        >
          {!term && <ButtonLink href="/admin/productos/nuevo">Nuevo producto</ButtonLink>}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-panel/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wider text-faint">
                <th className="px-4 py-3">Producto</th>
                <th className="hidden px-4 py-3 md:table-cell">Categoría</th>
                <th className="hidden px-4 py-3 sm:table-cell">Estado</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-line/60 transition last:border-0 hover:bg-panel-2/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line-2 bg-bg-elev">
                        {p.images[0] && (
                          <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-faint">
                          {p.brand.name} · {p.section === "ENCARGUE" ? "Encargue" : "Stock"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden px-4 py-3 text-muted md:table-cell">{p.category.name}</td>

                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "ACTIVE" && !p.soldOut && <Badge tone="ok">Publicado</Badge>}
                      {p.status === "DRAFT" && <Badge>Borrador</Badge>}
                      {p.status === "ARCHIVED" && <Badge>Archivado</Badge>}
                      {p.soldOut && <Badge tone="bad">Agotado</Badge>}
                      {p.featured && <Badge tone="purple">Destacado</Badge>}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-ink">
                    {p.salePriceUyu ? (
                      money(Number(p.salePriceUyu))
                    ) : (
                      <span className="text-xs font-normal text-muted">Consultar</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/admin/productos/${p.id}/editar`}
                        className="rounded-lg border border-line-2 px-2.5 py-1.5 text-xs text-muted transition hover:border-purple hover:text-ink"
                      >
                        Editar
                      </Link>
                      <DeleteButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
