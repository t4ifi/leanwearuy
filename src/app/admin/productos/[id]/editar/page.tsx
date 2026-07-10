import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { PriceAdvisor } from "@/components/admin/price-advisor";
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

  const [producto, brands, categories, suppliers, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        // El último pedido en el que vino: de ahí sale el costo real.
        importItems: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { importOrder: { select: { exchangeRate: true } } },
        },
      },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!producto) notFound();

  // Costo real: el del último pedido (ya trae envío y aduana prorrateados).
  const item = producto.importItems[0];
  const realCostUsd = item
    ? Number(item.overrideRealCostUsd ?? item.realCostUsd ?? 0) || null
    : null;
  const rate = item
    ? Number(item.importOrder.exchangeRate)
    : settings
      ? Number(settings.exchangeRateUsdUyu)
      : 40;
  const margen = settings ? Number(settings.defaultMarginPct) : 50;

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

      {realCostUsd != null && (
        <div className="mb-5">
          <PriceAdvisor
            realCostUsd={realCostUsd}
            exchangeRate={rate}
            currentPriceUyu={producto.salePriceUyu ? Number(producto.salePriceUyu) : null}
            targetMarginPct={margen}
          />
        </div>
      )}

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
