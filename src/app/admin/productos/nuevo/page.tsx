import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

/** Trae las opciones de los selects. Solo categorías hoja (no los grupos). */
async function getOptions() {
  const [brands, categories, suppliers] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { brands, categories, suppliers };
}

export default async function NuevoProductoPage() {
  const { brands, categories, suppliers } = await getOptions();

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/productos" className="text-sm text-[#a39ec0] hover:text-[#f3f1fa]">
          ← Volver a productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#f3f1fa]">Nuevo producto</h1>
      </div>

      <ProductForm
        action={createProduct}
        brands={brands}
        categories={categories}
        suppliers={suppliers}
        submitLabel="Crear producto"
      />
    </>
  );
}
