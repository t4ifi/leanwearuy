import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
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
      <PageHeader
        title="Nuevo producto"
        description="Después de crearlo vas a poder subirle las fotos."
        back={{ href: "/admin/productos", label: "Volver a productos" }}
      />

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
