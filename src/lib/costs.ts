/**
 * ===================================================================
 * LeanWear — Motor de cálculo de costos, ganancia y margen.
 *
 * REGLA CENTRAL:
 * Un pedido de importación trae varios productos. Cada producto se pesa
 * individualmente, pero el envío internacional se paga UNA sola vez por
 * todo el pedido. Por eso el envío (y los impuestos y otros gastos) se
 * reparte entre los productos EN PROPORCIÓN A SU PESO: lo que más pesa,
 * más envío absorbe.
 *
 * Se compra en USD y se vende en UYU, con un tipo de cambio editable.
 *
 * Funciones puras (sin base de datos) para poder testearlas fácil.
 * ===================================================================
 */

/** Redondea a 2 decimales (centavos), evitando errores de coma flotante. */
export function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Una línea del pedido: un producto, con su cantidad, costo y peso unitario. */
export type ImportLineInput = {
  productId: string;
  quantity: number;
  /** Costo de compra UNITARIO, en USD. */
  unitCostUsd: number;
  /** Peso UNITARIO en gramos (cada prenda se pesa individualmente). */
  unitWeightGrams: number;
  /** Si se quiere pisar el cálculo automático del costo real unitario. */
  overrideRealCostUsd?: number | null;
};

/** Costos que se pagan por el PEDIDO COMPLETO, en USD. */
export type OrderCostsInput = {
  shippingCostUsd: number;
  taxesUsd: number;
  otherCostsUsd: number;
};

export type AllocatedLine = {
  productId: string;
  quantity: number;
  /** Peso total de la línea = unitWeightGrams * quantity. */
  lineWeightGrams: number;
  /** Fracción del peso del pedido que representa esta línea (0..1). */
  weightShare: number;
  /** Costos del pedido asignados a ESTA línea (no unitario). */
  allocatedShippingUsd: number;
  allocatedTaxesUsd: number;
  allocatedOtherUsd: number;
  /** Costo real UNITARIO en USD (compra + prorrateos / cantidad). */
  realCostUsd: number;
  /** Costo real de toda la línea = realCostUsd * quantity. */
  lineTotalCostUsd: number;
  /** true si se usó un valor manual en vez del cálculo. */
  isOverridden: boolean;
};

/**
 * Reparte los costos del pedido entre sus líneas, proporcionalmente al peso,
 * y devuelve el costo real unitario de cada producto.
 *
 * Si el peso total es 0 (todavía no se pesaron), reparte por cantidad para
 * no dividir por cero.
 */
export function allocateImportCosts(
  lines: ImportLineInput[],
  costs: OrderCostsInput,
): AllocatedLine[] {
  if (lines.length === 0) return [];

  const lineWeights = lines.map((l) => l.unitWeightGrams * l.quantity);
  const totalWeight = lineWeights.reduce((a, b) => a + b, 0);
  const totalQty = lines.reduce((a, l) => a + l.quantity, 0);

  return lines.map((line, i) => {
    // El reparto es por peso. Sin pesos cargados, se reparte por cantidad.
    const share =
      totalWeight > 0
        ? lineWeights[i] / totalWeight
        : totalQty > 0
          ? line.quantity / totalQty
          : 0;

    const allocatedShippingUsd = money(costs.shippingCostUsd * share);
    const allocatedTaxesUsd = money(costs.taxesUsd * share);
    const allocatedOtherUsd = money(costs.otherCostsUsd * share);

    const extrasPerUnit =
      line.quantity > 0
        ? (allocatedShippingUsd + allocatedTaxesUsd + allocatedOtherUsd) / line.quantity
        : 0;

    const calculated = money(line.unitCostUsd + extrasPerUnit);
    const isOverridden =
      line.overrideRealCostUsd !== null && line.overrideRealCostUsd !== undefined;
    const realCostUsd = isOverridden ? money(line.overrideRealCostUsd!) : calculated;

    return {
      productId: line.productId,
      quantity: line.quantity,
      lineWeightGrams: lineWeights[i],
      weightShare: share,
      allocatedShippingUsd,
      allocatedTaxesUsd,
      allocatedOtherUsd,
      realCostUsd,
      lineTotalCostUsd: money(realCostUsd * line.quantity),
      isOverridden,
    };
  });
}

/** Convierte dólares a pesos uruguayos con el tipo de cambio dado. */
export function usdToUyu(usd: number, exchangeRate: number): number {
  return money(usd * exchangeRate);
}

export type Profit = {
  /** Costo real del producto, expresado en pesos. */
  costUyu: number;
  /** Ganancia en pesos = precio de venta - costo. */
  profitUyu: number;
  /** Margen sobre la venta, en % (ganancia / precio de venta). */
  marginPct: number;
  /** Markup sobre el costo, en % (ganancia / costo). */
  markupPct: number;
};

/**
 * Calcula ganancia y margen de un producto.
 * `realCostUsd` viene del pedido de importación; `salePriceUyu` es lo que cobrás.
 */
export function computeProfit(params: {
  realCostUsd: number;
  salePriceUyu: number;
  exchangeRate: number;
}): Profit {
  const costUyu = usdToUyu(params.realCostUsd, params.exchangeRate);
  const profitUyu = money(params.salePriceUyu - costUyu);

  const marginPct = params.salePriceUyu > 0 ? money((profitUyu / params.salePriceUyu) * 100) : 0;
  const markupPct = costUyu > 0 ? money((profitUyu / costUyu) * 100) : 0;

  return { costUyu, profitUyu, marginPct, markupPct };
}

/**
 * Sugiere un precio de venta en pesos para alcanzar un margen objetivo.
 * Margen sobre la venta:  precio = costo / (1 - margen/100)
 */
export function suggestSalePriceUyu(params: {
  realCostUsd: number;
  exchangeRate: number;
  targetMarginPct: number;
}): number {
  const costUyu = usdToUyu(params.realCostUsd, params.exchangeRate);
  const m = Math.min(Math.max(params.targetMarginPct, 0), 99.99) / 100;
  return money(costUyu / (1 - m));
}
