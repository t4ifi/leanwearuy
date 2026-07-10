/**
 * Detalle del pedido: costos, productos y el prorrateo del envío por peso.
 * Acá se ve el costo REAL de cada prenda y cuánto se gana vendiéndola.
 *
 * Un pedido puede incluir items que NO están en el catálogo: igual pesan,
 * así que absorben su parte del envío.
 */
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { lineProfit, summarizeOrder } from "@/lib/imports";
import { updateImportOrder } from "../actions";
import { OrderForm } from "../order-form";
import { AddItemForm } from "./add-item-form";
import { RemoveItemButton } from "./remove-item-button";
import { DeleteOrderButton } from "./delete-order-button";

export const dynamic = "force-dynamic";

const usd = (n: number) => "US$ " + n.toFixed(2);
const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.importOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: { product: { select: { id: true, name: true, salePriceUyu: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!order) notFound();

  const [suppliers, productos, settings] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, brand: { select: { name: true } } },
    }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  const franchise = {
    franchiseTaxPct: settings ? Number(settings.franchiseTaxPct) : 22,
    franchisePostalFeeUsd: settings ? Number(settings.franchisePostalFeeUsd) : 2.6,
    standardTaxPct: settings ? Number(settings.standardTaxPct) : 60,
    standardPostalFeeUsd: settings ? Number(settings.standardPostalFeeUsd) : 4.5,
  };

  const s = summarizeOrder(order);
  const rate = Number(order.exchangeRate);
  const pesoTotal = s.pesoTotalG;
  const opciones = productos.map((p) => ({ id: p.id, name: `${p.brand.name} — ${p.name}` }));
  const c = s.customs;

  return (
    <>
      <PageHeader
        title={order.code}
        description={`${order.orderDate.toLocaleDateString("es-UY")}${order.supplier ? ` · ${order.supplier.name}` : ""} · dólar ${rate}`}
        back={{ href: "/admin/importaciones", label: "Volver a importaciones" }}
      >
        <DeleteOrderButton id={order.id} code={order.code} />
      </PageHeader>

      {/* ---------- Resumen ---------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Productos" value={usd(s.productosUsd)} />
        <Stat label="Envío + aduana + gastos" value={usd(s.extrasUsd)} />
        <Stat label="Total del pedido" value={usd(s.totalUsd)} />
        <Stat label="Peso total" value={`${(pesoTotal / 1000).toFixed(2)} kg`} />
      </div>

      {/* ---------- Aduana ---------- */}
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Aduana (Correo Uruguayo)</h2>
          <Badge tone={order.usesFranchise ? "ok" : "warn"}>
            {order.usesFranchise ? "Con franquicia" : "Sin franquicia"}
          </Badge>
        </div>

        <p className="mt-1.5 text-sm text-muted">
          Impuesto del <strong>{Number(order.taxRatePct)}%</strong> sobre{" "}
          {order.customsBaseUsd != null
            ? `una base fija de ${usd(c.baseUsd)}`
            : `el costo de los productos (${usd(c.baseUsd)})`}
          .
        </p>

        <dl className="mt-5 max-w-md space-y-2 text-sm">
          <Linea label="Impuesto (IVA o Tributos)" value={usd(c.taxUsd)} />
          <Linea label="Servicio de Correo Uruguayo" value={usd(c.postalFeeUsd)} />
          <Linea label="Costo de Almacenamiento" value={usd(c.storageUsd)} />
          <Linea label="Saldo a favor" value={c.creditUsd > 0 ? `− ${usd(c.creditUsd)}` : usd(0)} />
          <div className="flex justify-between border-t border-line pt-2.5 font-semibold text-ink">
            <dt>Total</dt>
            <dd className="tabular-nums">{usd(c.totalUsd)}</dd>
          </div>
        </dl>

        {!order.usesFranchise && (
          <p className="mt-4 text-xs text-amber-400">
            ⚠ Sin franquicia pagás {franchise.standardTaxPct}% en vez de {franchise.franchiseTaxPct}%.
            Con esta base te habrías ahorrado{" "}
            {usd(((franchise.standardTaxPct - franchise.franchiseTaxPct) / 100) * c.baseUsd)}.
          </p>
        )}
      </Card>

      {/* ---------- Productos del pedido ---------- */}
      <Card className="mt-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Productos del pedido</h2>
          <p className="mt-1 text-sm text-muted">
            El envío se reparte por peso: lo que más pesa, más envío absorbe. Podés agregar items que
            no están en el catálogo.
          </p>
        </div>

        <AddItemForm orderId={order.id} productos={opciones} />

        {order.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-faint">
            Agregá productos para ver el cálculo del costo real.
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-4xl border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wider text-faint">
                  <th className="p-2">Producto</th>
                  <th className="p-2 text-right">Cant.</th>
                  <th className="p-2 text-right">Costo c/u</th>
                  <th className="p-2 text-right">Peso</th>
                  <th className="p-2 text-right">% peso</th>
                  <th className="p-2 text-right">Envío asig.</th>
                  <th className="p-2 text-right">Costo real c/u</th>
                  <th className="p-2 text-right">Venta</th>
                  <th className="p-2 text-right">Ganancia</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => {
                  const nombre = it.product?.name ?? it.name ?? "(sin nombre)";
                  const lineWeight = it.unitWeightGrams * it.quantity;
                  const share = pesoTotal > 0 ? (lineWeight / pesoTotal) * 100 : 0;
                  const real = it.realCostUsd ? Number(it.realCostUsd) : null;
                  const venta = it.product?.salePriceUyu ? Number(it.product.salePriceUyu) : null;
                  const prof = lineProfit({ realCostUsd: real, salePriceUyu: venta, exchangeRate: rate });

                  return (
                    <tr key={it.id} className="border-b border-line/60 last:border-0">
                      <td className="p-2">
                        <span className="text-ink">{nombre}</span>
                        {!it.product && (
                          <span className="ml-2">
                            <Badge>Fuera del catálogo</Badge>
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right tabular-nums text-muted">{it.quantity}</td>
                      <td className="p-2 text-right tabular-nums text-muted">{usd(Number(it.unitCostUsd))}</td>
                      <td className="p-2 text-right tabular-nums text-muted">{lineWeight} g</td>
                      <td className="p-2 text-right tabular-nums text-purple-2">{share.toFixed(1)}%</td>
                      <td className="p-2 text-right tabular-nums text-muted">
                        {it.allocatedShippingUsd ? usd(Number(it.allocatedShippingUsd)) : "—"}
                      </td>
                      <td className="p-2 text-right font-semibold tabular-nums text-ink">
                        {real != null ? usd(real) : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums text-muted">
                        {venta ? uyu(venta) : <span className="text-xs">—</span>}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {prof ? (
                          <span className={prof.profitUyu >= 0 ? "text-stock" : "text-danger"}>
                            {uyu(prof.profitUyu)}
                            <span className="ml-1 text-xs opacity-70">({prof.marginPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-xs text-faint">—</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <RemoveItemButton itemId={it.id} name={nombre} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {order.items.length > 0 && (
          <p className="text-xs text-faint">
            El <strong>costo real</strong> ya incluye el envío, los impuestos y los gastos prorrateados
            por peso. La <strong>ganancia</strong> compara ese costo (convertido a pesos con el dólar{" "}
            {rate}) contra el precio de venta. Los items fuera del catálogo no tienen precio de venta.
          </p>
        )}
      </Card>

      {/* ---------- Editar el pedido ---------- */}
      <div className="mb-3 mt-8 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-ink">Editar pedido</h2>
        <Badge tone="purple">los cambios recalculan el prorrateo</Badge>
      </div>

      <OrderForm
        action={updateImportOrder.bind(null, order.id)}
        suppliers={suppliers}
        franchise={franchise}
        submitLabel="Guardar cambios"
        defaults={{
          code: order.code,
          orderDate: order.orderDate.toISOString().slice(0, 10),
          supplierId: order.supplierId,
          status: order.status,
          shippingCostUsd: Number(order.shippingCostUsd),
          otherCostsUsd: Number(order.otherCostsUsd),
          exchangeRate: rate,
          usesFranchise: order.usesFranchise,
          taxRatePct: Number(order.taxRatePct),
          customsBaseUsd: order.customsBaseUsd != null ? Number(order.customsBaseUsd) : null,
          postalFeeUsd: Number(order.postalFeeUsd),
          storageUsd: Number(order.storageUsd),
          creditUsd: Number(order.creditUsd),
          notes: order.notes,
        }}
      />
    </>
  );
}

function Linea({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}
