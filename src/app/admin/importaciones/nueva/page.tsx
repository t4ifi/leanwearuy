import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { createImportOrder } from "../actions";
import { OrderForm } from "../order-form";

export const dynamic = "force-dynamic";

export default async function NuevoPedidoPage() {
  const [suppliers, settings] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  const franchise = {
    franchiseTaxPct: settings ? Number(settings.franchiseTaxPct) : 22,
    franchisePostalFeeUsd: settings ? Number(settings.franchisePostalFeeUsd) : 2.6,
    standardTaxPct: settings ? Number(settings.standardTaxPct) : 60,
    standardPostalFeeUsd: settings ? Number(settings.standardPostalFeeUsd) : 4.5,
  };

  return (
    <>
      <PageHeader
        title="Nuevo pedido"
        description="Creá el pedido y después agregale los productos con su peso."
        back={{ href: "/admin/importaciones", label: "Volver a importaciones" }}
      />

      <OrderForm
        action={createImportOrder}
        suppliers={suppliers}
        franchise={franchise}
        submitLabel="Crear pedido"
        defaults={{
          exchangeRate: settings ? Number(settings.exchangeRateUsdUyu) : 40,
          usesFranchise: true,
          taxRatePct: franchise.franchiseTaxPct,
          postalFeeUsd: franchise.franchisePostalFeeUsd,
        }}
      />
    </>
  );
}
