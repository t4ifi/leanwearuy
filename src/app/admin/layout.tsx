/**
 * Shell del panel: sidebar fija a la izquierda + área de contenido.
 * Todo lo que cuelga de /admin ya pasó por el proxy de autenticación.
 */
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { AdminNav } from "@/components/admin/nav";
import { IconExternal, IconLogout } from "@/components/admin/icons";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const inicial = email.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      {/* ------------------------------ Sidebar ------------------------------ */}
      <aside className="border-b border-line bg-bg-elev lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6 p-4">
          <div className="flex items-center justify-between px-2 pt-2">
            <Link href="/admin" className="font-head text-lg font-extrabold tracking-tight">
              Lean
              <span className="bg-gradient-to-r from-pink to-purple bg-clip-text text-transparent">
                Wear
              </span>
            </Link>
            <span className="rounded-md border border-line-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">
              Panel
            </span>
          </div>

          <AdminNav />

          <div className="mt-auto space-y-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-panel-2/50 hover:text-ink"
            >
              <IconExternal className="size-[18px]" />
              Ver la tienda
            </Link>

            <div className="my-2 border-t border-line" />

            <div className="flex items-center gap-3 px-3 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-2 to-purple-3 text-xs font-bold text-white">
                {inicial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted">{email}</p>
                <p className="text-[11px] text-faint">Administrador</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="grid size-8 place-items-center rounded-lg text-faint transition hover:bg-panel-2 hover:text-danger"
                >
                  <IconLogout className="size-[18px]" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------ Contenido ------------------------------ */}
      <main className="min-w-0 px-5 py-8 lg:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
