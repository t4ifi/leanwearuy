/**
 * Detalle del pedido: costos, productos y el prorrateo del envío por peso.
 * Acá se ve el costo REAL de cada prenda y cuánto se gana vendiéndola.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { lineProfit, summarizeOrder } from "@/lib/imports";
import { updateImportOrder } from "../actions";
import { OrderForm } from "../order-form";
import { AddItemForm } from "./add-item-form";
import { RemoveItemButton } from "./remove-item-button";

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

  const [suppliers, productos] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, brand: { select: { name: true } } },
    }),
  ]);

  const s = summarizeOrder(order);
  const rate = Number(order.exchangeRate);
  const pesoTotal = s.pesoTotalG;

  const opciones = productos.map((p) => ({ id: p.id, name: `${p.brand.name} — ${p.name}` }));

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/importaciones" className="text-sm text-[#a39ec0] hover:text-[#f3f1fa]">
          ← Volver a importaciones
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#f3f1fa]">{order.code}</h1>
        <p className="mt-1 text-sm text-[#6c6790]">
          {order.orderDate.toLocaleDateString("es-UY")}
          {order.supplier && ` · ${order.supplier.name}`} · dólar {rate}
        </p>
      </div>

      {/* ---------- Resumen ---------- */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Productos", v: usd(s.productosUsd) },
          { l: "Envío + impuestos", v: usd(s.extrasUsd) },
          { l: "Total del pedido", v: usd(s.totalUsd) },
          { l: "Peso total", v: `${(pesoTotal / 1000).toFixed(2)} kg` },
        ].map((x) => (
          <Card key={x.l} className="p-4">
            <p className="text-xs uppercase tracking-wider text-[#6c6790]">{x.l}</p>
            <p className="mt-1 text-xl font-bold text-[#f3f1fa]">{x.v}</p>
          </Card>
        ))}
      </div>

      {/* ---------- Productos del pedido ---------- */}
      <Card className="mb-6 space-y-5">
        <div>
          <h2 className="font-semibold text-[#f3f1fa]">Productos del pedido</h2>
          <p className="mt-1 text-sm text-[#a39ec0]">
            El envío se reparte por peso: lo que más pesa, más envío absorbe.
          </p>
        </div>

        <AddItemForm orderId={order.id} productos={opciones} />

        {order.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6c6790]">
            Agregá productos para ver el cálculo del costo real.
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-4xl border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#221d36] text-left text-xs uppercase tracking-wider text-[#6c6790]">
                  <th className="p-2 font-medium">Producto</th>
                  <th className="p-2 text-right font-medium">Cant.</th>
                  <th className="p-2 text-right font-medium">Costo c/u</th>
                  <th className="p-2 text-right font-medium">Peso</th>
                  <th className="p-2 text-right font-medium">% peso</th>
                  <th className="p-2 text-right font-medium">Envío asig.</th>
                  <th className="p-2 text-right font-medium">Costo real c/u</th>
                  <th className="p-2 text-right font-medium">Venta</th>
                  <th className="p-2 text-right font-medium">Ganancia</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => {
                  const lineWeight = it.unitWeightGrams * it.quantity;
                  const share = pesoTotal > 0 ? (lineWeight / pesoTotal) * 100 : 0;
                  const real = it.realCostUsd ? Number(it.realCostUsd) : null;
                  const venta = it.product.salePriceUyu ? Number(it.product.salePriceUyu) : null;
                  const prof = lineProfit({ realCostUsd: real, salePriceUyu: venta, exchangeRate: rate });

                  return (
                    <tr key={it.id} className="border-b border-[#221d36]/60">
                      <td className="p-2 text-[#f3f1fa]">{it.product.name}</td>
                      <td className="p-2 text-right text-[#a39ec0]">{it.quantity}</td>
                      <td className="p-2 text-right text-[#a39ec0]">{usd(Number(it.unitCostUsd))}</td>
                      <td className="p-2 text-right text-[#a39ec0]">{lineWeight} g</td>
                      <td className="p-2 text-right text-[#a78bfa]">{share.toFixed(1)}%</td>
                      <td className="p-2 text-right text-[#a39ec0]">
                        {it.allocatedShippingUsd ? usd(Number(it.allocatedShippingUsd)) : "—"}
                      </td>
                      <td className="p-2 text-right font-semibold text-[#f3f1fa]">
                        {real != null ? usd(real) : "—"}
                      </td>
                      <td className="p-2 text-right text-[#a39ec0]">
                        {venta ? uyu(venta) : <span className="text-xs">Consultar</span>}
                      </td>
                      <td className="p-2 text-right">
                        {prof ? (
                          <span className={prof.profitUyu >= 0 ? "text-[#34d399]" : "text-[#ff8a8a]"}>
                            {uyu(prof.profitUyu)}
                            <span className="ml-1 text-xs opacity-70">({prof.marginPct}%)</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[#6c6790]">—</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <RemoveItemButton itemId={it.id} name={it.product.name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {order.items.length > 0 && (
          <p className="text-xs text-[#6c6790]">
            El <strong>costo real</strong> ya incluye el envío, los impuestos y los gastos
            prorrateados por peso. La <strong>ganancia</strong> compara ese costo (convertido a
            pesos con el dólar {rate}) contra el precio de venta del producto.
          </p>
        )}
      </Card>

      {/* ---------- Editar el pedido ---------- */}
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-semibold text-[#f3f1fa]">Editar pedido</h2>
        <Badge>los cambios recalculan el prorrateo</Badge>
      </div>

      <OrderForm
        action={updateImportOrder.bind(null, order.id)}
        suppliers={suppliers}
        submitLabel="Guardar cambios"
        defaults={{
          code: order.code,
          orderDate: order.orderDate.toISOString().slice(0, 10),
          supplierId: order.supplierId,
          status: order.status,
          shippingCostUsd: Number(order.shippingCostUsd),
          taxesUsd: Number(order.taxesUsd),
          otherCostsUsd: Number(order.otherCostsUsd),
          exchangeRate: rate,
          notes: order.notes,
        }}
      />
    </>
  );
}
