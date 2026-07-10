import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createImportOrder } from "../actions";
import { OrderForm } from "../order-form";

export const dynamic = "force-dynamic";

export default async function NuevoPedidoPage() {
  const [suppliers, settings] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/importaciones" className="text-sm text-muted hover:text-ink">
          ← Volver a importaciones
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Nuevo pedido</h1>
        <p className="mt-1 text-sm text-muted">
          Creá el pedido y después agregale los productos con su peso.
        </p>
      </div>

      <OrderForm
        action={createImportOrder}
        suppliers={suppliers}
        submitLabel="Crear pedido"
        defaults={{
          exchangeRate: settings ? Number(settings.exchangeRateUsdUyu) : 40,
        }}
      />
    </>
  );
}
