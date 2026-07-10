import { getCatalog, getFacets, type Section } from "@/lib/catalog";
import { ProductCard } from "./product-card";
import { ActiveFilters, CategoryBar, Pager, Sidebar, type Params } from "./catalog-nav";

/**
 * Página de catálogo, compartida por Encargues y Stock.
 * Los filtros vienen de la URL; la base devuelve sólo los 16 de la página.
 */
export async function CatalogPage({
  section,
  base,
  params,
}: {
  section: Section;
  base: string;
  params: Params;
}) {
  const page = Number(params.page ?? 1) || 1;

  const [{ items, total, totalPages, page: current }, facets] = await Promise.all([
    getCatalog({
      section,
      cat: params.cat,
      marca: params.marca,
      q: params.q,
      sort: (params.sort as never) ?? "reco",
      page,
    }),
    getFacets(section),
  ]);

  const categorias = facets.grupos.flatMap((g) => g.children);
  const labels = {
    cat: categorias.find((c) => c.slug === params.cat)?.name,
    marca: facets.marcas.find((m) => m.slug === params.marca)?.name,
  };

  return (
    <>
      <CategoryBar base={base} params={params} categorias={categorias} />

      <div className="mx-auto max-w-[1500px] px-5 pb-16 pt-5">
        <div className="grid items-start gap-6 lg:grid-cols-[244px_1fr]">
          <div className="hidden lg:block">
            <Sidebar
              base={base}
              params={params}
              total={total}
              grupos={facets.grupos}
              marcas={facets.marcas}
            />
          </div>

          <section className="min-w-0">
            <ActiveFilters base={base} params={params} labels={labels} />

            {items.length === 0 ? (
              <p className="py-16 text-center text-muted">
                No hay productos que coincidan con el filtro.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}

            <Pager base={base} params={params} page={current} totalPages={totalPages} />
          </section>
        </div>
      </div>
    </>
  );
}
