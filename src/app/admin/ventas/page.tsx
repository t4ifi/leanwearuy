/**
 * Ventas: registrar lo vendido y ver cuánto se ganó.
 * La ganancia sale de comparar el precio cobrado con el costo real
 * (guardado al momento de la venta).
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { SaleForm, type SaleProduct } from "./sale-form";
import { DeleteSaleButton } from "./delete-sale-button";

export const dynamic = "force-dynamic";

const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");

export default async function VentasPage() {
  const [products, sales, settings] = await Promise.all([
    prisma.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        salePriceUyu: true,
        purchaseCostUsd: true,
        brand: { select: { name: true } },
        importItems: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            realCostUsd: true,
            overrideRealCostUsd: true,
            importOrder: { select: { exchangeRate: true } },
          },
        },
      },
    }),
    prisma.sale.findMany({ orderBy: { date: "desc" } }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  const rateDefault = settings ? Number(settings.exchangeRateUsdUyu) : 40;

  // Productos con su costo real en pesos, para autocompletar el formulario.
  const saleProducts: SaleProduct[] = products.map((p) => {
    const it = p.importItems[0];
    const costUsd = it
      ? Number(it.overrideRealCostUsd ?? it.realCostUsd ?? 0)
      : p.purchaseCostUsd
        ? Number(p.purchaseCostUsd)
        : 0;
    const rate = it ? Number(it.importOrder.exchangeRate) : rateDefault;
    return {
      id: p.id,
      name: `${p.brand.name} — ${p.name}`,
      priceUyu: p.salePriceUyu ? Number(p.salePriceUyu) : 0,
      costUyu: costUsd * rate,
    };
  });

  // --- Totales ---
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  let ingresos = 0, costo = 0, unidades = 0;
  let ingresosMes = 0, gananciaMes = 0, ventasMes = 0;

  for (const s of sales) {
    const rev = Number(s.unitPriceUyu) * s.quantity;
    const cst = Number(s.unitCostUyu) * s.quantity;
    ingresos += rev;
    costo += cst;
    unidades += s.quantity;
    if (s.date >= inicioMes) {
      ingresosMes += rev;
      gananciaMes += rev - cst;
      ventasMes++;
    }
  }
  const ganancia = ingresos - costo;

  return (
    <>
      <PageHeader title="Ventas" description="Registrá lo que vendés y mirá cuánto ganás." />

      {/* --- Este mes --- */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">Este mes</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ingresos del mes" value={uyu(ingresosMes)} hint={`${ventasMes} ventas`} />
        <Stat label="Ganancia del mes" value={uyu(gananciaMes)} tone={gananciaMes >= 0 ? "ok" : undefined} />
        <Stat
          label="Margen del mes"
          value={ingresosMes > 0 ? `${Math.round((gananciaMes / ingresosMes) * 100)}%` : "—"}
        />
      </div>

      {/* --- Histórico --- */}
      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-faint">Total histórico</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ingresos totales" value={uyu(ingresos)} hint={`${unidades} unidades vendidas`} />
        <Stat label="Ganancia total" value={uyu(ganancia)} tone={ganancia >= 0 ? "ok" : undefined} />
        <Stat label="Ventas registradas" value={sales.length} />
      </div>

      {/* --- Registrar --- */}
      <div className="mt-6">
        <SaleForm products={saleProducts} />
      </div>

      {/* --- Historial --- */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Últimas ventas</h2>

        {sales.length === 0 ? (
          <EmptyState title="Todavía no registraste ventas" description="Cargá tu primera venta arriba." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-panel/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wider text-faint">
                  <th className="px-4 py-3">Producto</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3 text-right">Cobrado</th>
                  <th className="px-4 py-3 text-right">Ganancia</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 100).map((s) => {
                  const rev = Number(s.unitPriceUyu) * s.quantity;
                  const gan = rev - Number(s.unitCostUyu) * s.quantity;
                  return (
                    <tr key={s.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3">
                        {s.productId ? (
                          <Link
                            href={`/admin/productos/${s.productId}/editar`}
                            className="text-ink hover:text-purple-2"
                          >
                            {s.productName}
                          </Link>
                        ) : (
                          <span className="text-ink">{s.productName}</span>
                        )}
                        {s.customer && <p className="text-xs text-faint">{s.customer}</p>}
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">
                        {s.date.toLocaleDateString("es-UY")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">{s.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">{uyu(rev)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={gan >= 0 ? "text-stock" : "text-danger"}>{uyu(gan)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteSaleButton id={s.id} name={s.productName} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
