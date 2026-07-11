import Link from "next/link";
import { SortSelect } from "./sort-select";

export type Params = {
  cat?: string;
  marca?: string;
  q?: string;
  sort?: string;
  page?: string;
  tab?: string; // qué pestaña del sidebar se ve: "marcas" o (por defecto) categorías
};

/**
 * Arma un enlace conservando los filtros actuales y pisando los que se pasen.
 * Al cambiar cualquier filtro se vuelve a la página 1.
 */
export function href(base: string, params: Params, overrides: Params): string {
  const merged = { ...params, ...overrides };
  if (!("page" in overrides)) delete merged.page; // filtro nuevo -> página 1

  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== "1") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/* --------------------------- Barra de categorías --------------------------- */

export function CategoryBar({
  base,
  params,
  categorias,
}: {
  base: string;
  params: Params;
  categorias: { slug: string; name: string }[];
}) {
  const tabs = [{ slug: "", name: "All" }, ...categorias];

  return (
    <div className="sticky top-16 z-40 border-b border-line bg-bg/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-5 [scrollbar-width:none]">
        {tabs.map((t) => {
          const activo = (params.cat ?? "") === t.slug;
          return (
            <Link
              key={t.slug || "all"}
              href={href(base, params, { cat: t.slug || undefined })}
              className={`relative whitespace-nowrap px-3.5 py-3 text-sm transition ${
                activo ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {t.name}
              {activo && (
                <span className="absolute inset-x-3.5 bottom-0 h-0.5 rounded bg-gradient-to-r from-pink to-purple" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- Sidebar -------------------------------- */

export function Sidebar({
  base,
  params,
  total,
  grupos,
  marcas,
}: {
  base: string;
  params: Params;
  total: number;
  grupos: { id: string; name: string; children: { slug: string; name: string; _count: { products: number } }[] }[];
  marcas: { slug: string; name: string; _count: { products: number } }[];
}) {
  // Se muestra la lista de marcas si estás en esa pestaña o si ya hay una marca filtrada.
  const verMarcas = params.tab === "marcas" || !!params.marca;

  return (
    <aside className="sticky top-[7.5rem] max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-2xl border border-line bg-panel-2/40 p-2">
      <div className="flex gap-1 px-2 pt-2">
        <TabLink href={href(base, params, { tab: undefined, marca: undefined })} active={!verMarcas}>
          Categorías
        </TabLink>
        <TabLink href={href(base, params, { tab: "marcas" })} active={verMarcas}>
          Marcas
        </TabLink>
      </div>

      <div className="px-3 pb-2 pt-3">
        <p className="text-xs text-faint">
          {total} {total === 1 ? "resultado encontrado" : "resultados encontrados"}
        </p>
        <div className="mt-2">
          <label className="mb-1 block text-xs text-faint">Ordenar por</label>
          <SortSelect base={base} params={params} />
        </div>
      </div>

      {!verMarcas ? (
        <div className="px-1.5">
          <Link
            href={href(base, params, { cat: undefined })}
            className={`mb-2 block rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              !params.cat
                ? "border-transparent bg-gradient-to-br from-purple-2 to-purple-3 text-white"
                : "border-line-2 bg-panel-2 text-ink"
            }`}
          >
            Todos los productos
          </Link>

          {grupos.map((g) => (
            <div key={g.id} className="mb-1">
              <p className="px-2.5 py-2 text-sm font-semibold text-ink">{g.name}</p>
              <div className="flex flex-col">
                {g.children.map((c) => (
                  <FacetLink
                    key={c.slug}
                    href={href(base, params, { cat: c.slug })}
                    active={params.cat === c.slug}
                    count={c._count.products}
                  >
                    {c.name}
                  </FacetLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-1.5">
          <Link
            href={href(base, params, { marca: "" })}
            className={`mb-2 block rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              !params.marca
                ? "border-transparent bg-gradient-to-br from-purple-2 to-purple-3 text-white"
                : "border-line-2 bg-panel-2 text-ink"
            }`}
          >
            Todas las marcas
          </Link>
          {marcas.map((m) => (
            <FacetLink
              key={m.slug}
              href={href(base, params, { marca: m.slug })}
              active={params.marca === m.slug}
              count={m._count.products}
            >
              {m.name}
            </FacetLink>
          ))}
        </div>
      )}
    </aside>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex-1 border-b-2 pb-2.5 text-center text-sm font-semibold transition ${
        active ? "border-purple text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function FacetLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2 rounded-lg py-1.5 pl-5 pr-3 text-sm transition hover:bg-panel-2 ${
        active ? "text-purple-2" : "text-muted hover:text-ink"
      }`}
    >
      {children}
      <span className="text-xs text-faint">{count}</span>
    </Link>
  );
}

/* ------------------------------ Filtros activos ------------------------------ */

export function ActiveFilters({
  base,
  params,
  labels,
}: {
  base: string;
  params: Params;
  labels: { cat?: string; marca?: string };
}) {
  const chips: { key: keyof Params; text: string }[] = [];
  if (params.cat && labels.cat) chips.push({ key: "cat", text: labels.cat });
  if (params.marca && labels.marca) chips.push({ key: "marca", text: labels.marca });
  if (params.q) chips.push({ key: "q", text: `“${params.q}”` });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-faint">Filtros activos:</span>
      {chips.length === 0 && <span className="text-sm text-faint">ninguno</span>}
      {chips.map((c) => (
        <Link
          key={c.key}
          href={href(base, params, { [c.key]: undefined })}
          className="flex items-center gap-2 rounded-full border border-line-2 bg-panel-2 py-1.5 pl-3.5 pr-2.5 text-sm text-ink"
        >
          {c.text} <span className="text-muted">✕</span>
        </Link>
      ))}
      {chips.length > 0 && (
        <Link href={base} className="text-sm text-purple-2 hover:underline">
          Limpiar todo
        </Link>
      )}
    </div>
  );
}

/* -------------------------------- Paginación -------------------------------- */

export function Pager({
  base,
  params,
  page,
  totalPages,
}: {
  base: string;
  params: Params;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  // Ventana de números con "…" cuando hay muchas páginas.
  const nums: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) nums.push(i);
    if (page < totalPages - 2) nums.push("…");
    nums.push(totalPages);
  }

  return (
    <nav aria-label="Paginación" className="mt-9 flex flex-wrap items-center justify-center gap-1.5">
      <PageLink base={base} params={params} to={page - 1} disabled={page === 1}>
        ‹
      </PageLink>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`d${i}`} className="px-1.5 text-faint">…</span>
        ) : (
          <PageLink key={n} base={base} params={params} to={n} active={n === page}>
            {n}
          </PageLink>
        ),
      )}
      <PageLink base={base} params={params} to={page + 1} disabled={page === totalPages}>
        ›
      </PageLink>
    </nav>
  );
}

function PageLink({
  base,
  params,
  to,
  active,
  disabled,
  children,
}: {
  base: string;
  params: Params;
  to: number;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    "grid h-9 min-w-9 place-items-center rounded-xl border px-2.5 text-sm font-semibold transition";

  if (disabled) {
    return <span className={`${cls} border-line-2 bg-panel-2 text-muted opacity-40`}>{children}</span>;
  }
  if (active) {
    return (
      <span className={`${cls} border-transparent bg-gradient-to-br from-purple-2 to-purple-3 text-white`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href(base, params, { page: String(to) })}
      className={`${cls} border-line-2 bg-panel-2 text-muted hover:border-purple hover:text-ink`}
    >
      {children}
    </Link>
  );
}
