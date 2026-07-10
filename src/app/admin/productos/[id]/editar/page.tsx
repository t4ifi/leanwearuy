import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../product-form";
import { ImageManager } from "../../image-manager";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [producto, brands, categories, suppliers] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!producto) notFound();

  // `updateProduct` recibe el id primero: lo fijamos con bind para que la
  // Server Action quede con la firma que espera useActionState.
  const action = updateProduct.bind(null, producto.id);

  return (
    <>
      <PageHeader
        title={producto.name}
        description={`/producto/${producto.slug}`}
        back={{ href: "/admin/productos", label: "Volver a productos" }}
      />

      <div className="mb-5">
        <ImageManager
          productId={producto.id}
          images={producto.images.map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary }))}
        />
      </div>

      <ProductForm
        action={action}
        brands={brands}
        categories={categories}
        suppliers={suppliers}
        submitLabel="Guardar cambios"
        defaults={{
          name: producto.name,
          description: producto.description,
          brandId: producto.brandId,
          categoryId: producto.categoryId,
          supplierId: producto.supplierId,
          section: producto.section,
          status: producto.status,
          condition: producto.condition,
          featured: producto.featured,
          soldOut: producto.soldOut,
          salePriceUyu: producto.salePriceUyu ? Number(producto.salePriceUyu) : null,
          purchaseCostUsd: producto.purchaseCostUsd ? Number(producto.purchaseCostUsd) : null,
          weightGrams: producto.weightGrams,
          supplierUrl: producto.supplierUrl,
          sku: producto.sku,
          stock: producto.stock,
          lowStockThreshold: producto.lowStockThreshold,
          sizes: producto.sizes,
          colors: producto.colors,
        }}
      />
    </>
  );
}
