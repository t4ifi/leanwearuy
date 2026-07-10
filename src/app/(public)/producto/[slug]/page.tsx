import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/public/header";
import { ProductCard, formatPrice, tidyName } from "@/components/public/product-card";
import { getProduct, getRelated, getSettings } from "@/lib/catalog";
import { Gallery } from "./gallery";
import { Options } from "./options";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Producto no encontrado" };

  return {
    title: p.name,
    description: p.description ?? `${p.name} — ${p.brand.name}. Consultá por Instagram.`,
    openGraph: {
      title: `${p.name} · LeanWear`,
      images: p.images[0] ? [p.images[0].url] : [],
    },
  };
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!p) notFound();

  const related = await getRelated(p);
  const instagram = settings?.instagram ?? "leanwear.uy";
  const dm = `https://ig.me/m/${instagram}`;

  const esEncargue = p.section === "ENCARGUE";
  const estado = p.soldOut ? "Agotado" : esEncargue ? "A pedido" : "Disponible";
  const seccionHref = esEncargue ? "/" : "/stock";
  const seccionLabel = esEncargue ? "Encargues" : "Stock";
  const urls = p.images.map((i) => i.url);
  const precio = p.salePriceUyu ? Number(p.salePriceUyu) : 0;

  return (
    <>
      <Header active={esEncargue ? "encargues" : "stock"} />

      <div className="mx-auto max-w-[1500px] px-5 pb-14">
        <nav className="flex flex-wrap items-center gap-2.5 py-5 text-sm text-faint">
          <Link href={seccionHref} className="text-muted hover:text-ink">
            ← Volver a {seccionLabel}
          </Link>
          <span className="opacity-40">/</span>
          <Link
            href={`${seccionHref}?cat=${p.category.slug}`}
            className="text-muted hover:text-ink"
          >
            {p.category.name}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-muted">{p.name}</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="lg:sticky lg:top-24">
            <Gallery images={urls} alt={p.name} badge={estado} />
          </div>

          <div className="min-w-0">
            <h1 className="font-head text-3xl font-bold leading-tight tracking-tight text-pretty">
              {tidyName(p.name)}
            </h1>

            <div className="mt-3.5 flex flex-wrap gap-2">
              <Tag>{p.category.name}</Tag>
              <Tag>{p.brand.name}</Tag>
              {p.featured && <Tag className="text-purple-2">★ Destacado</Tag>}
            </div>

            <p className="mt-5 text-3xl font-extrabold">
              {precio > 0 ? formatPrice(precio) : (
                <span className="text-2xl">Consultar por Instagram</span>
              )}
            </p>

            <div className="mt-6 space-y-3.5">
              <Options sizes={p.sizes} colors={p.colors} />
            </div>

            <a
              href={dm}
              target="_blank"
              rel="noopener"
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-br from-purple-2 to-purple-3 py-4 font-semibold text-white shadow-[0_18px_50px_-22px_rgba(124,58,237,0.8)] transition hover:-translate-y-0.5"
            >
              ◉ Consultar por Instagram
            </a>
          </div>
        </div>

        {/* ---------- Descripción y ficha ---------- */}
        <section className="mt-14 max-w-3xl">
          <h2 className="font-head text-xl font-bold">Descripción</h2>
          <p className="mt-3 text-muted">
            {p.description ?? "Sin descripción. Consultá por Instagram para más detalles."}
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-4">
            <Spec label="Marca" value={p.brand.name} />
            <Spec label="Categoría" value={p.category.name} />
            <Spec label="Disponibilidad" value={estado} />
            <Spec label="Talles" value={p.sizes.join(", ") || "Consultar"} />
          </dl>
        </section>

        {/* ---------- Fotos reales ---------- */}
        {urls.length > 0 && (
          <section className="mt-14">
            <h2 className="font-head text-xl font-bold">Fotos reales del producto</h2>
            <p className="mt-1 text-sm text-muted">
              Imágenes reales de la prenda{urls.length > 1 && ` · ${urls.length} fotos`}.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-6">
              {urls.map((src) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-xl border border-line bg-bg-elev"
                >
                  <Image src={src} alt={p.name} fill sizes="200px" className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Relacionados ---------- */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-head text-xl font-bold">También te puede gustar</h2>
            <p className="mt-1 text-sm text-muted">Estilos parecidos que te pueden interesar</p>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border border-line-2 bg-panel-2 px-3 py-1 text-xs text-muted ${className}`}>
      {children}
    </span>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2/40 px-4 py-3">
      <dt className="text-[11px] uppercase tracking-widest text-faint">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
