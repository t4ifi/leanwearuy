/** Listado de pedidos de importación. */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { IconPlus } from "@/components/admin/icons";
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
      <PageHeader
        title="Importaciones"
        description="El envío del pedido se reparte entre los productos según su peso."
      >
        <ButtonLink href="/admin/importaciones/nueva">
          <IconPlus className="size-4" />
          Nuevo pedido
        </ButtonLink>
      </PageHeader>

      {pedidos.length === 0 ? (
        <EmptyState
          title="Todavía no cargaste ningún pedido"
          description="Creá el primero para empezar a calcular el costo real de cada producto."
        >
          <ButtonLink href="/admin/importaciones/nueva">Nuevo pedido</ButtonLink>
        </EmptyState>
      ) : (
        <div className="space-y-2.5">
          {pedidos.map((o) => {
            const s = summarizeOrder(o);
            const estado = ESTADOS[o.status];
            return (
              <Link key={o.id} href={`/admin/importaciones/${o.id}`} className="block">
                <Card className="flex flex-wrap items-center gap-4 p-4 transition hover:border-purple">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{o.code}</p>
                    <p className="text-xs text-faint">
                      {o.orderDate.toLocaleDateString("es-UY")}
                      {o.supplier && ` · ${o.supplier.name}`}
                      {` · ${s.unidades} u. · ${(s.pesoTotalG / 1000).toFixed(2)} kg`}
                    </p>
                  </div>
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-ink">
                      US$ {s.totalUsd.toLocaleString("es-UY")}
                    </p>
                    <p className="text-xs text-faint">
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
