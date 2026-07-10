import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { roundPriceUyu, suggestSalePriceUyu } from "@/lib/costs";
import { CreateFromItemForm } from "./form";

export const dynamic = "force-dynamic";

const usd = (n: number) => "US$ " + n.toFixed(2);
const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");

export default async function CrearProductoDesdeItem({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;

  const [item, brands, categories, settings] = await Promise.all([
    prisma.importItem.findUnique({
      where: { id: itemId },
      include: { importOrder: { select: { id: true, code: true, exchangeRate: true } } },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!item || item.importOrder.id !== id) notFound();

  const rate = Number(item.importOrder.exchangeRate);
  const real = item.realCostUsd ? Number(item.realCostUsd) : null;
  const margen = settings ? Number(settings.defaultMarginPct) : 50;
  const ideal =
    real != null ? roundPriceUyu(suggestSalePriceUyu({ realCostUsd: real, exchangeRate: rate, targetMarginPct: margen })) : 0;

  return (
    <>
      <PageHeader
        title="Crear producto desde el item"
        description={`Del pedido ${item.importOrder.code}. El producto queda vinculado a este item.`}
        back={{ href: `/admin/importaciones/${id}`, label: "Volver al pedido" }}
      />

      {real != null && (
        <Card className="mb-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Dato label="Costo real" value={usd(real)} sub={`${uyu(real * rate)} · sin ganancia`} />
            <Dato label="Peso" value={`${item.unitWeightGrams} g`} />
            <Dato label={`Precio ideal (${margen}%)`} value={uyu(ideal)} accent />
          </div>
        </Card>
      )}

      <CreateFromItemForm
        itemId={item.id}
        brands={brands}
        categories={categories}
        defaults={{ name: item.name ?? "", salePriceUyu: ideal }}
      />
    </>
  );
}

function Dato({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line-2 bg-panel-2/50 px-4 py-3">
      <p className="text-xs text-faint">{label}</p>
      <p className={`mt-1 font-head text-xl font-bold tabular-nums ${accent ? "text-purple-2" : "text-ink"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </div>
  );
}
