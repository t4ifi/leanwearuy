/**
 * Panel de administración (protegido por el middleware).
 * Server Component: consulta la base directamente, sin API intermedia.
 */
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [productos, conPrecio, destacados, agotados, marcas, categorias, imagenes] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { salePriceUyu: { not: null } } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { soldOut: true } }),
      prisma.brand.count(),
      prisma.category.count(),
      prisma.productImage.count(),
    ]);
  return { productos, conPrecio, destacados, agotados, marcas, categorias, imagenes };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#221d36] bg-[#16132599] p-5">
      <p className="text-xs uppercase tracking-wider text-[#6c6790]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#f3f1fa]">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  const stats = await getStats();

  return (
    <main className="min-h-dvh bg-[#0a0912] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#f3f1fa]">
              Lean<span className="text-[#a78bfa]">Wear</span>
              <span className="ml-3 rounded-full border border-[#2c2647] px-3 py-1 text-xs font-normal text-[#6c6790]">
                Panel
              </span>
            </h1>
            <p className="mt-1 text-sm text-[#a39ec0]">
              Conectado como {session?.user?.email}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="rounded-full border border-[#2c2647] bg-[#1b1730] px-4 py-2 text-sm text-[#a39ec0] transition hover:border-[#8b5cf6] hover:text-[#f3f1fa]">
              Salir
            </button>
          </form>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Productos" value={stats.productos} />
          <Stat label="Con precio" value={stats.conPrecio} />
          <Stat label="Destacados" value={stats.destacados} />
          <Stat label="Agotados" value={stats.agotados} />
          <Stat label="Marcas" value={stats.marcas} />
          <Stat label="Categorías" value={stats.categorias} />
          <Stat label="Imágenes" value={stats.imagenes} />
        </div>

        <p className="mt-8 text-sm text-[#6c6790]">
          Próximo: ABM de productos, importaciones y estadísticas.
        </p>
      </div>
    </main>
  );
}
