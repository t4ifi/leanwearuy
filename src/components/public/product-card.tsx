import Image from "next/image";
import Link from "next/link";

export type CardProduct = {
  slug: string;
  name: string;
  salePriceUyu: unknown; // Prisma Decimal
  featured: boolean;
  soldOut: boolean;
  images: { url: string }[];
};

/** Precio formateado, o "Consultar" si no tiene precio cargado. */
export function formatPrice(value: unknown): string {
  const n = value == null ? 0 : Number(value);
  return n > 0 ? `$ ${n.toLocaleString("es-UY")}` : "Consultar";
}

/**
 * Evita que un ")" quede colgando solo al cortar el renglón:
 * pega los paréntesis a su palabra con espacios que no cortan.
 */
export function tidyName(name: string): string {
  return name.replace(/\(\s+/g, "( ").replace(/\s+\)/g, " )");
}

export function ProductCard({ p }: { p: CardProduct }) {
  const img = p.images[0]?.url;

  return (
    <Link
      href={`/producto/${p.slug}`}
      className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:-translate-y-1 hover:border-line-2 hover:shadow-[0_18px_50px_-22px_rgba(124,58,237,0.6)]"
    >
      <div className="relative aspect-square overflow-hidden bg-bg-elev">
        {img ? (
          <Image
            src={img}
            alt={p.name}
            fill
            sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw"
            className="object-contain transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center text-purple">◆</div>
        )}

        {p.soldOut ? (
          <Badge className="text-danger">Agotado</Badge>
        ) : p.featured ? (
          <Badge className="text-purple-2">Destacado</Badge>
        ) : null}
      </div>

      <div className="p-3.5">
        <p className="line-clamp-2 min-h-[2.4em] text-sm leading-snug text-ink text-pretty">
          {tidyName(p.name)}
        </p>
        <p className="mt-2.5 font-bold">{formatPrice(p.salePriceUyu)}</p>
      </div>
    </Link>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`absolute left-2.5 top-2.5 rounded-full border border-line-2 bg-bg/80 px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${className}`}
    >
      {children}
    </span>
  );
}
