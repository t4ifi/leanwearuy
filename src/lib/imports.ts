/**
 * Lógica de los pedidos de importación.
 *
 * Cada vez que cambia algo (el envío, el régimen de franquicia, o alguna
 * línea de producto) hay que recalcular:
 *   1. el impuesto de aduana, que depende del valor del pedido;
 *   2. el prorrateo por peso de TODOS los costos del pedido.
 */
import { prisma } from "@/lib/prisma";
import { allocateImportCosts, computeProfit, money } from "@/lib/costs";
import { computeCustoms, type CustomsBreakdown } from "@/lib/customs";

type OrderCostFields = {
  shippingCostUsd: unknown;
  otherCostsUsd: unknown;
  taxRatePct: unknown;
  customsBaseUsd: unknown;
  postalFeeUsd: unknown;
  storageUsd: unknown;
  creditUsd: unknown;
};

type ItemCostFields = { quantity: number; unitCostUsd: unknown; unitWeightGrams: number };

/** Costo de los productos del pedido (sin envío ni impuestos). */
export function productsCostUsd(items: ItemCostFields[]): number {
  return money(items.reduce((a, i) => a + Number(i.unitCostUsd) * i.quantity, 0));
}

/**
 * Desglose de aduana de un pedido.
 * Si no se fijó una base imponible a mano, se usa el costo de los productos.
 */
export function customsFor(order: OrderCostFields, items: ItemCostFields[]): CustomsBreakdown {
  const baseUsd =
    order.customsBaseUsd != null ? Number(order.customsBaseUsd) : productsCostUsd(items);

  return computeCustoms({
    baseUsd,
    taxRatePct: Number(order.taxRatePct),
    postalFeeUsd: Number(order.postalFeeUsd),
    storageUsd: Number(order.storageUsd),
    creditUsd: Number(order.creditUsd),
  });
}

/**
 * Los tres "baldes" de costo que se reparten por peso entre los productos:
 *   envío | impuesto de aduana | otros (correo + almacenamiento + gastos − saldo)
 */
export function costBuckets(order: OrderCostFields, items: ItemCostFields[]) {
  const customs = customsFor(order, items);
  return {
    shippingCostUsd: Number(order.shippingCostUsd),
    taxesUsd: customs.taxUsd,
    otherCostsUsd: money(
      customs.postalFeeUsd + customs.storageUsd + Number(order.otherCostsUsd) - customs.creditUsd,
    ),
  };
}

/**
 * Recalcula y GUARDA el impuesto y el prorrateo de todas las líneas.
 * Se llama después de cualquier cambio en el pedido o sus productos.
 */
export async function recalcImportOrder(orderId: string) {
  const order = await prisma.importOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const customs = customsFor(order, order.items);

  // El impuesto depende del valor del pedido: se guarda ya calculado.
  await prisma.importOrder.update({
    where: { id: orderId },
    data: { taxesUsd: customs.taxUsd },
  });

  if (order.items.length === 0) return;

  const alloc = allocateImportCosts(
    order.items.map((i) => ({
      // Usamos el id de la LÍNEA como clave (un producto podría repetirse).
      productId: i.id,
      quantity: i.quantity,
      unitCostUsd: Number(i.unitCostUsd),
      unitWeightGrams: i.unitWeightGrams,
      overrideRealCostUsd: i.overrideRealCostUsd ? Number(i.overrideRealCostUsd) : null,
    })),
    costBuckets(order, order.items),
  );

  await prisma.$transaction(
    alloc.map((a) =>
      prisma.importItem.update({
        where: { id: a.productId },
        data: {
          allocatedShippingUsd: a.allocatedShippingUsd,
          allocatedTaxesUsd: a.allocatedTaxesUsd,
          allocatedOtherUsd: a.allocatedOtherUsd,
          realCostUsd: a.realCostUsd,
        },
      }),
    ),
  );
}

/** Totales de un pedido, listos para mostrar. */
export function summarizeOrder(order: OrderCostFields & { items: ItemCostFields[] }) {
  const productos = productsCostUsd(order.items);
  const customs = customsFor(order, order.items);
  const extras = money(
    Number(order.shippingCostUsd) + customs.totalUsd + Number(order.otherCostsUsd),
  );

  return {
    productosUsd: productos,
    customs,
    extrasUsd: extras,
    totalUsd: money(productos + extras),
    pesoTotalG: order.items.reduce((a, i) => a + i.unitWeightGrams * i.quantity, 0),
    unidades: order.items.reduce((a, i) => a + i.quantity, 0),
  };
}

/** Ganancia de una línea, comparando su costo real con el precio de venta. */
export function lineProfit(params: {
  realCostUsd: number | null;
  salePriceUyu: number | null;
  exchangeRate: number;
}) {
  if (params.realCostUsd == null || !params.salePriceUyu) return null;
  return computeProfit({
    realCostUsd: params.realCostUsd,
    salePriceUyu: params.salePriceUyu,
    exchangeRate: params.exchangeRate,
  });
}
