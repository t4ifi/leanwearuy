/**
 * Lógica de los pedidos de importación.
 *
 * Cada vez que cambia algo del pedido (el envío, los impuestos, o alguna
 * línea de producto) hay que recalcular el prorrateo: el envío se reparte
 * entre los productos según su peso, y de ahí sale el costo real de cada uno.
 */
import { prisma } from "@/lib/prisma";
import { allocateImportCosts, computeProfit, money } from "@/lib/costs";

/**
 * Recalcula y GUARDA el prorrateo de todas las líneas de un pedido.
 * Se llama después de cualquier cambio en el pedido o sus productos.
 */
export async function recalcImportOrder(orderId: string) {
  const order = await prisma.importOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.items.length === 0) return;

  const alloc = allocateImportCosts(
    order.items.map((i) => ({
      // Usamos el id de la LÍNEA como clave (un producto podría repetirse).
      productId: i.id,
      quantity: i.quantity,
      unitCostUsd: Number(i.unitCostUsd),
      unitWeightGrams: i.unitWeightGrams,
      overrideRealCostUsd: i.overrideRealCostUsd ? Number(i.overrideRealCostUsd) : null,
    })),
    {
      shippingCostUsd: Number(order.shippingCostUsd),
      taxesUsd: Number(order.taxesUsd),
      otherCostsUsd: Number(order.otherCostsUsd),
    },
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
export function summarizeOrder(order: {
  shippingCostUsd: unknown;
  taxesUsd: unknown;
  otherCostsUsd: unknown;
  items: { quantity: number; unitCostUsd: unknown; unitWeightGrams: number }[];
}) {
  const productosUsd = order.items.reduce(
    (a, i) => a + Number(i.unitCostUsd) * i.quantity,
    0,
  );
  const pesoTotalG = order.items.reduce((a, i) => a + i.unitWeightGrams * i.quantity, 0);
  const extrasUsd =
    Number(order.shippingCostUsd) + Number(order.taxesUsd) + Number(order.otherCostsUsd);

  return {
    productosUsd: money(productosUsd),
    extrasUsd: money(extrasUsd),
    totalUsd: money(productosUsd + extrasUsd),
    pesoTotalG,
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
