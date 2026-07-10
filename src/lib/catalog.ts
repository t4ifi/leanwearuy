/**
 * Consultas del catálogo público.
 *
 * El filtrado, el orden y la paginación se hacen en la base (no en el
 * navegador): la página carga sólo los 16 productos que va a mostrar.
 * Los filtros viajan en la URL, así los enlaces se pueden compartir
 * y Google los puede indexar.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const POR_PAGINA = 16; // 4 filas x 4 columnas

export type Section = "STOCK" | "ENCARGUE";
export type Sort = "reco" | "precio-asc" | "precio-desc" | "nombre";

export type CatalogQuery = {
  section: Section;
  cat?: string; // slug de categoría
  marca?: string; // slug de marca
  q?: string;
  sort?: Sort;
  page?: number;
};

/** Orden por defecto: agrupado por marca (A-Z); dentro, destacados arriba y agotados al final. */
function orderBy(sort: Sort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "precio-asc":
      return [{ salePriceUyu: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "precio-desc":
      return [{ salePriceUyu: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    case "nombre":
      return [{ name: "asc" }];
    default:
      return [
        { brand: { name: "asc" } }, // 1) agrupa por marca
        { soldOut: "asc" }, // 2) los agotados, últimos
        { featured: "desc" }, // 3) los destacados, primeros
        { createdAt: "desc" },
      ];
  }
}

function whereFor(qy: CatalogQuery): Prisma.ProductWhereInput {
  const term = qy.q?.trim();
  return {
    status: "ACTIVE", // los borradores no salen en la web
    section: qy.section,
    ...(qy.cat ? { category: { slug: qy.cat } } : {}),
    ...(qy.marca ? { brand: { slug: qy.marca } } : {}),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { brand: { name: { contains: term, mode: "insensitive" as const } } },
            { category: { name: { contains: term, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}

/** Productos de una página, ya filtrados y ordenados. */
export async function getCatalog(qy: CatalogQuery) {
  const page = Math.max(1, qy.page ?? 1);
  const where = whereFor(qy);

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderBy(qy.sort ?? "reco"),
      skip: (page - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: {
        id: true,
        slug: true,
        name: true,
        salePriceUyu: true,
        featured: true,
        soldOut: true,
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA));
  return { items, total, page: Math.min(page, totalPages), totalPages };
}

/** Categorías (agrupadas por su padre) y marcas, con cantidad de productos. */
export async function getFacets(section: Section) {
  const base = { status: "ACTIVE" as const, section };

  const [grupos, marcas] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        children: {
          orderBy: { name: "asc" },
          select: {
            slug: true,
            name: true,
            _count: { select: { products: { where: base } } },
          },
        },
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true, _count: { select: { products: { where: base } } } },
    }),
  ]);

  return {
    // Solo mostramos categorías y grupos que tengan productos en esta sección.
    grupos: grupos
      .map((g) => ({ ...g, children: g.children.filter((c) => c._count.products > 0) }))
      .filter((g) => g.children.length > 0),
    marcas: marcas.filter((m) => m._count.products > 0),
  };
}

/** Producto completo para la página de detalle. */
export async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      brand: true,
      category: { include: { parent: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
    },
  });
}

/** "También te puede gustar": misma categoría primero, después misma marca. */
export async function getRelated(product: { id: string; categoryId: string; brandId: string }) {
  const [mismaCategoria, mismaMarca] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
      take: 8,
      orderBy: { featured: "desc" },
      select: relatedSelect,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", brandId: product.brandId, id: { not: product.id } },
      take: 8,
      orderBy: { featured: "desc" },
      select: relatedSelect,
    }),
  ]);

  // Unimos sin repetir, priorizando los de la misma categoría.
  const vistos = new Set<string>();
  return [...mismaCategoria, ...mismaMarca]
    .filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id)))
    .slice(0, 8);
}

const relatedSelect = {
  id: true,
  slug: true,
  name: true,
  salePriceUyu: true,
  featured: true,
  soldOut: true,
  brand: { select: { name: true } },
  images: { where: { isPrimary: true }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

/** Configuración de la tienda (Instagram, nombre, etc.). */
export async function getSettings() {
  return prisma.storeSettings.findUnique({ where: { id: "default" } });
}
