/**
 * Layout del panel: barra superior con navegación y salir.
 * Todo lo que cuelga de /admin ya pasó por el proxy de autenticación.
 */
import Link from "next/link";
import { auth, signOut } from "@/auth";

const NAV = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/importaciones", label: "Importaciones" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-dvh bg-[#0a0912]">
      <header className="sticky top-0 z-50 border-b border-[#221d36] bg-[#0a0912]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5">
          <Link href="/admin" className="text-lg font-extrabold tracking-tight text-[#f3f1fa]">
            Lean
            <span className="bg-gradient-to-r from-[#ff6fd1] to-[#8b5cf6] bg-clip-text text-transparent">
              Wear
            </span>
          </Link>

          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-[#a39ec0] transition hover:bg-[#1b1730] hover:text-[#f3f1fa]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-[#6c6790] sm:block">{session?.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-full border border-[#2c2647] bg-[#1b1730] px-3.5 py-1.5 text-sm text-[#a39ec0] transition hover:border-[#8b5cf6] hover:text-[#f3f1fa]">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
