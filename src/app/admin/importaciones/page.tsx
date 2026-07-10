/** Listado de pedidos de importación. */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { summarizeOrder } from "@/lib/imports";

export const dynamic = "force-dynamic";

const ESTADOS: Record<string, { label: string; tone: "muted" | "ok" | "warn" | "bad" }> = {
  DRAFT: { label: "Borrador", tone: "muted" },
  ORDERED: { label: "Pedido", tone: "warn" },
  SHIPPED: { label: "En camino", tone: "warn" },
  RECEIVED: { label: "Recibido", tone: "ok" },
  CANCELLED: { label: "Cancelado", tone: "bad" },
};

export default async function ImportacionesPage() {
  const pedidos = await prisma.importOrder.findMany({
    include: { supplier: true, items: true },
    orderBy: { orderDate: "desc" },
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f3f1fa]">Importaciones</h1>
          <p className="mt-1 text-sm text-[#a39ec0]">
            El envío del pedido se reparte entre los productos según su peso.
          </p>
        </div>
        <Link
          href="/admin/importaciones/nueva"
          className="rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          + Nuevo pedido
        </Link>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <p className="text-center text-[#a39ec0]">
            Todavía no cargaste ningún pedido. Creá el primero para empezar a calcular costos reales.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {pedidos.map((o) => {
            const s = summarizeOrder(o);
            const estado = ESTADOS[o.status];
            return (
              <Link key={o.id} href={`/admin/importaciones/${o.id}`}>
                <Card className="flex flex-wrap items-center gap-4 p-4 transition hover:border-[#8b5cf6]">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#f3f1fa]">{o.code}</p>
                    <p className="text-xs text-[#6c6790]">
                      {o.orderDate.toLocaleDateString("es-UY")}
                      {o.supplier && ` · ${o.supplier.name}`}
                      {` · ${s.unidades} u. · ${(s.pesoTotalG / 1000).toFixed(2)} kg`}
                    </p>
                  </div>
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                  <div className="text-right">
                    <p className="font-semibold text-[#f3f1fa]">US$ {s.totalUsd.toLocaleString("es-UY")}</p>
                    <p className="text-xs text-[#6c6790]">
                      productos US$ {s.productosUsd} + extras US$ {s.extrasUsd}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
