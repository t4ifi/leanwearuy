import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
      <div className="mb-6">
        <Link href="/admin/productos" className="text-sm text-[#a39ec0] hover:text-[#f3f1fa]">
          ← Volver a productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#f3f1fa]">{producto.name}</h1>
        <p className="mt-1 text-sm text-[#6c6790]">/{producto.slug}</p>
      </div>

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
