/**
 * ===================================================================
 * Migración del catálogo VIEJO (sitio estático) a la base de datos.
 *
 * Lee `js/products.js` y `js/config.js` del proyecto anterior y crea
 * en Postgres: Marcas, Categorías (con su grupo padre), Productos e
 * Imágenes, preservando precios, talles, colores, destacados y agotados.
 *
 * Las imágenes se apuntan temporalmente al sitio viejo (GitHub Pages).
 * En la Fase 1.5 se re-suben a Cloudflare R2 y se reescriben las URLs.
 *
 * Es idempotente: se puede correr varias veces sin duplicar nada.
 *
 * Uso:  npx tsx scripts/migrate-legacy.ts
 * ===================================================================
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { Section, ProductStatus } from "../src/generated/prisma/enums";

// Carpeta del sitio estático anterior.
const LEGACY_DIR = "/home/t4ifi/Andrès/Programacion/LeanWear";
// Base pública donde hoy viven las imágenes (temporal, hasta migrar a R2).
const LEGACY_IMG_BASE = "https://leanwear-uy.github.io";

type LegacyProduct = {
  nombre: string;
  marca: string;
  categoria: string;
  seccion: "stock" | "encargues";
  precio?: number;
  descripcion?: string;
  talles?: string[];
  colores?: string[];
  imagenes?: string[];
  destacado?: boolean;
  agotado?: boolean;
};

type LegacyCategoria = { label: string; grupo: string };

/** Evalúa un archivo JS del sitio viejo y devuelve la constante pedida. */
function loadLegacyConst<T>(file: string, constName: string): T {
  const src = fs.readFileSync(path.join(LEGACY_DIR, file), "utf8");
  const fn = new Function(`${src}\nreturn ${constName};`);
  return fn() as T;
}

/** Mismo slug que usaba el sitio viejo (para no romper URLs). */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const productos = loadLegacyConst<LegacyProduct[]>("js/products.js", "PRODUCTOS");
  const categorias = loadLegacyConst<Record<string, LegacyCategoria>>("js/config.js", "CATEGORIAS");

  console.log(`Leídos ${productos.length} productos del sitio viejo.\n`);

  // --- 1) Categorías padre (grupos: Ropa / Calzado / Accesorios) ---
  const gruposUsados = new Set<string>();
  for (const p of productos) gruposUsados.add(categorias[p.categoria]?.grupo ?? "Otros");

  const grupoIds = new Map<string, string>();
  for (const grupo of gruposUsados) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(grupo) },
      update: {},
      create: { name: grupo, slug: slugify(grupo) },
    });
    grupoIds.set(grupo, cat.id);
  }
  console.log(`✓ Grupos de categoría: ${[...gruposUsados].join(", ")}`);

  // --- 2) Categorías hijas ---
  const catIds = new Map<string, string>();
  for (const slug of new Set(productos.map((p) => p.categoria))) {
    const info = categorias[slug];
    const nombre = info?.label ?? slug;
    const parentId = grupoIds.get(info?.grupo ?? "Otros")!;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name: nombre, parentId },
      create: { name: nombre, slug, parentId },
    });
    catIds.set(slug, cat.id);
  }
  console.log(`✓ Categorías: ${catIds.size}`);

  // --- 3) Marcas ---
  const brandIds = new Map<string, string>();
  for (const nombre of new Set(productos.map((p) => p.marca))) {
    const b = await prisma.brand.upsert({
      where: { slug: slugify(nombre) },
      update: { name: nombre },
      create: { name: nombre, slug: slugify(nombre) },
    });
    brandIds.set(nombre, b.id);
  }
  console.log(`✓ Marcas: ${[...brandIds.keys()].join(", ")}`);

  // --- 4) Productos + imágenes ---
  let creados = 0;
  let imagenes = 0;

  for (const p of productos) {
    // Mismo id/slug que usaba producto.html?id=... para no romper links.
    const slug = slugify(`${p.marca} ${p.nombre}`);

    const producto = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.nombre,
        description: p.descripcion ?? null,
        brandId: brandIds.get(p.marca)!,
        categoryId: catIds.get(p.categoria)!,
        section: p.seccion === "encargues" ? Section.ENCARGUE : Section.STOCK,
        status: ProductStatus.ACTIVE,
        featured: !!p.destacado,
        soldOut: !!p.agotado,
        salePriceUyu: p.precio && p.precio > 0 ? p.precio : null,
        sizes: p.talles ?? [],
        colors: p.colores ?? [],
      },
      create: {
        slug,
        name: p.nombre,
        description: p.descripcion ?? null,
        brandId: brandIds.get(p.marca)!,
        categoryId: catIds.get(p.categoria)!,
        section: p.seccion === "encargues" ? Section.ENCARGUE : Section.STOCK,
        status: ProductStatus.ACTIVE,
        featured: !!p.destacado,
        soldOut: !!p.agotado,
        salePriceUyu: p.precio && p.precio > 0 ? p.precio : null,
        sizes: p.talles ?? [],
        colors: p.colores ?? [],
      },
    });
    creados++;

    // Imágenes: se reemplazan por completo en cada corrida (idempotente).
    await prisma.productImage.deleteMany({ where: { productId: producto.id } });
    const urls = (p.imagenes ?? []).filter(Boolean);
    if (urls.length) {
      await prisma.productImage.createMany({
        data: urls.map((rel, i) => ({
          productId: producto.id,
          url: `${LEGACY_IMG_BASE}/${rel.replace(/^\/+/, "")}`,
          position: i,
          isPrimary: i === 0, // la primera es la principal
          alt: p.nombre,
        })),
      });
      imagenes += urls.length;
    }
  }

  console.log(`✓ Productos: ${creados}`);
  console.log(`✓ Imágenes: ${imagenes}`);

  // --- 5) Configuración de la tienda ---
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "LeanWear",
      instagram: "leanwear.uy",
      contactEmail: "hola@leanwear.com",
      tagline: "Importación de ropa y calzado",
    },
  });
  console.log(`✓ Configuración de tienda creada`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR en la migración:", e);
  process.exit(1);
});
