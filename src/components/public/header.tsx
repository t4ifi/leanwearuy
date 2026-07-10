import Link from "next/link";
import { IconEncargues, IconSearch, IconStock, IconChat } from "./icons";

/**
 * Header público: logo, buscador y navegación.
 * El buscador es un formulario GET: manda `?q=` a la página de Encargues,
 * así funciona incluso sin JavaScript y la búsqueda queda en la URL.
 */
export function Header({ active }: { active?: "stock" | "encargues" | "como-comprar" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-5 px-5">
        <Link href="/" className="shrink-0 font-head text-xl font-extrabold tracking-tight">
          Lean
          <span className="bg-gradient-to-r from-pink via-purple-2 to-purple bg-clip-text text-transparent">
            Wear
          </span>
        </Link>

        <form
          action="/"
          className="mx-auto flex max-w-lg flex-1 items-center gap-2 rounded-full border border-line-2 bg-panel-2 py-1.5 pl-4 pr-1.5 transition focus-within:border-purple"
        >
          <IconSearch className="size-4 shrink-0 text-faint" />
          <input
            name="q"
            type="search"
            placeholder="Buscar marcas, prendas, zapatillas..."
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-2 to-purple-3 text-white"
          >
            <IconSearch className="size-4" />
          </button>
        </form>

        <nav className="flex shrink-0 items-center gap-1">
          <NavLink href="/stock" active={active === "stock"} tone="stock">
            <IconStock className="size-4" />
            <span className="hidden sm:inline">Stock</span>
          </NavLink>
          <NavLink href="/" active={active === "encargues"}>
            <IconEncargues className="size-4" />
            <span className="hidden sm:inline">Encargues</span>
          </NavLink>
          <NavLink href="/como-comprar" active={active === "como-comprar"}>
            <IconChat className="size-4" />
            <span className="hidden sm:inline">Cómo comprar</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  tone,
  children,
}: {
  href: string;
  active?: boolean;
  tone?: "stock";
  children: React.ReactNode;
}) {
  const color = tone === "stock" ? "text-stock" : active ? "text-ink" : "text-muted";
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition hover:bg-panel-2 ${color} ${
        active ? "bg-panel-2" : ""
      }`}
    >
      {children}
    </Link>
  );
}
