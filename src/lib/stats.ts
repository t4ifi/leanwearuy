/**
 * Métricas del negocio para el panel.
 *
 * El costo real de un producto sale de su ÚLTIMO pedido de importación
 * (ya trae el envío prorrateado por peso). Si nunca vino en un pedido,
 * se usa el costo de compra de referencia de su ficha. Si no tiene
 * ninguno de los dos, queda como "sin costo" y no ensucia los promedios.
 */
import { prisma } from "@/lib/prisma";
import { money, usdToUyu } from "@/lib/costs";

export type Stats = Awaited<ReturnType<typeof getStats>>;

export async function getStats() {
  const [settings, productos, pedidos] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
    prisma.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        section: true,
        stock: true,
        lowStockThreshold: true,
        salePriceUyu: true,
        purchaseCostUsd: true,
        weightGrams: true,
        brand: { select: { name: true } },
        importItems: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { realCostUsd: true, overrideRealCostUsd: true },
        },
      },
    }),
    prisma.importOrder.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        shippingCostUsd: true,
        taxesUsd: true,
        otherCostsUsd: true,
        items: { select: { unitCostUsd: true, quantity: true } },
      },
    }),
  ]);

  const rate = settings ? Number(settings.exchangeRateUsdUyu) : 40;

  /** Costo real en USD, o null si todavía no se cargó. */
  const costoUsd = (p: (typeof productos)[number]): number | null => {
    const item = p.importItems[0];
    if (item) {
      const v = item.overrideRealCostUsd ?? item.realCostUsd;
      if (v != null) return Number(v);
    }
    return p.purchaseCostUsd != null ? Number(p.purchaseCostUsd) : null;
  };

  let inventarioVentaUyu = 0;
  let inventarioCostoUyu = 0;
  let unidades = 0;
  const margenes: number[] = [];

  const sinPrecio: typeof productos = [];
  const sinCosto: typeof productos = [];
  const sinPeso: typeof productos = [];
  const pocoStock: { name: string; slug: string; id: string; stock: number; umbral: number }[] = [];

  for (const p of productos) {
    const venta = p.salePriceUyu != null ? Number(p.salePriceUyu) : 0;
    const costo = costoUsd(p);

    if (venta <= 0) sinPrecio.push(p);
    if (costo == null) sinCosto.push(p);
    if (p.weightGrams == null) sinPeso.push(p);

    if (p.stock > 0) {
      unidades += p.stock;
      inventarioVentaUyu += venta * p.stock;
      if (costo != null) inventarioCostoUyu += usdToUyu(costo, rate) * p.stock;
    }

    if (p.section === "STOCK" && p.stock <= p.lowStockThreshold) {
      pocoStock.push({ id: p.id, name: p.name, slug: p.slug, stock: p.stock, umbral: p.lowStockThreshold });
    }

    if (venta > 0 && costo != null) {
      const costoUyuUnit = usdToUyu(costo, rate);
      margenes.push(((venta - costoUyuUnit) / venta) * 100);
    }
  }

  // Inversión = lo pagado por los productos + envío + impuestos + gastos.
  const inversionUsd = pedidos.reduce((acc, o) => {
    const prods = o.items.reduce((a, i) => a + Number(i.unitCostUsd) * i.quantity, 0);
    return acc + prods + Number(o.shippingCostUsd) + Number(o.taxesUsd) + Number(o.otherCostsUsd);
  }, 0);

  const porMarca = Object.entries(
    productos.reduce<Record<string, number>>((acc, p) => {
      acc[p.brand.name] = (acc[p.brand.name] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    rate,
    totales: {
      productos: productos.length,
      activos: productos.filter((p) => p.status === "ACTIVE").length,
      borradores: productos.filter((p) => p.status === "DRAFT").length,
      pedidos: pedidos.length,
      unidades,
    },
    dinero: {
      inventarioVentaUyu: money(inventarioVentaUyu),
      inventarioCostoUyu: money(inventarioCostoUyu),
      gananciaPotencialUyu: money(inventarioVentaUyu - inventarioCostoUyu),
      inversionUsd: money(inversionUsd),
      inversionUyu: usdToUyu(inversionUsd, rate),
      margenPromedio: margenes.length
        ? money(margenes.reduce((a, b) => a + b, 0) / margenes.length)
        : null,
    },
    pendientes: {
      sinPrecio: sinPrecio.length,
      sinCosto: sinCosto.length,
      sinPeso: sinPeso.length,
    },
    pocoStock,
    porMarca,
  };
}
