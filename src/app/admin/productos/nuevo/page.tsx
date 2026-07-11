import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

/** Opciones de los selects: categorías hoja (con su grupo) y los grupos padre. */
async function getOptions() {
  const [brands, cats, groups, suppliers] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, parent: { select: { name: true } } },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const categories = cats.map((c) => ({ id: c.id, name: c.name, group: c.parent?.name ?? "Otros" }));
  return { brands, categories, groups, suppliers };
}

export default async function NuevoProductoPage() {
  const { brands, categories, groups, suppliers } = await getOptions();

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
        groups={groups}
        suppliers={suppliers}
        submitLabel="Crear producto"
      />
    </>
  );
}
