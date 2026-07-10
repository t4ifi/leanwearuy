/**
 * Listado de productos del panel, con buscador.
 * Reemplaza al viejo panel que commiteaba a GitHub: ahora lee de la base.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
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
    include: {
      brand: true,
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f3f1fa]">Productos</h1>
          <p className="mt-1 text-sm text-[#a39ec0]">
            {productos.length} {productos.length === 1 ? "producto" : "productos"}
            {term && ` para "${term}"`}
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          + Nuevo producto
        </Link>
      </div>

      <form className="mb-5">
        <input
          name="q"
          defaultValue={term}
          placeholder="Buscar por nombre o marca..."
          className="w-full max-w-md rounded-xl border border-[#2c2647] bg-[#1b1730] px-4 py-2.5 text-[#f3f1fa] outline-none placeholder:text-[#6c6790] focus:border-[#8b5cf6]"
        />
      </form>

      {productos.length === 0 ? (
        <Card>
          <p className="text-center text-[#a39ec0]">No hay productos que coincidan.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {productos.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]?.url ?? "/next.svg"}
                alt=""
                className="size-14 shrink-0 rounded-lg border border-[#2c2647] bg-[#0e0c18] object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#f3f1fa]">{p.name}</p>
                <p className="text-xs text-[#6c6790]">
                  {p.brand.name} · {p.category.name} ·{" "}
                  {p.section === "ENCARGUE" ? "Encargue" : "Stock"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {p.featured && <Badge tone="warn">Destacado</Badge>}
                {p.soldOut && <Badge tone="bad">Agotado</Badge>}
                {p.status === "DRAFT" && <Badge>Borrador</Badge>}
                {p.status === "ARCHIVED" && <Badge>Archivado</Badge>}
                {p.weightGrams == null && <Badge>Sin peso</Badge>}
              </div>

              <p className="w-28 text-right font-semibold text-[#f3f1fa]">
                {p.salePriceUyu ? money(Number(p.salePriceUyu)) : (
                  <span className="text-sm font-normal text-[#a39ec0]">Consultar</span>
                )}
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/admin/productos/${p.id}/editar`}
                  className="rounded-lg border border-[#2c2647] px-3 py-1.5 text-xs text-[#a39ec0] transition hover:border-[#8b5cf6] hover:text-[#f3f1fa]"
                >
                  Editar
                </Link>
                <DeleteButton id={p.id} name={p.name} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
