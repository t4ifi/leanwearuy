import { Card } from "@/components/ui";
import { breakEvenUyu, roundPriceUyu, computeProfit, suggestSalePriceUyu } from "@/lib/costs";

const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");
const usd = (n: number) => "US$ " + n.toFixed(2);

/**
 * Muestra el costo real de un producto y a cuánto habría que venderlo.
 * Sólo aparece cuando el producto ya vino en un pedido de importación:
 * antes de eso no hay costo real que usar.
 */
export function PriceAdvisor({
  realCostUsd,
  exchangeRate,
  currentPriceUyu,
  targetMarginPct,
}: {
  realCostUsd: number;
  exchangeRate: number;
  currentPriceUyu: number | null;
  targetMarginPct: number;
}) {
  const costoUyu = breakEvenUyu(realCostUsd, exchangeRate);
  const ideal = roundPriceUyu(
    suggestSalePriceUyu({ realCostUsd, exchangeRate, targetMarginPct }),
  );

  const actual =
    currentPriceUyu && currentPriceUyu > 0
      ? computeProfit({ realCostUsd, salePriceUyu: currentPriceUyu, exchangeRate })
      : null;

  const pierdePlata = actual != null && actual.profitUyu < 0;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Costo real y precio ideal</h2>
        <p className="mt-1 text-sm text-muted">
          Calculado con el último pedido de importación, con el envío y la aduana ya prorrateados por
          peso. Dólar a {exchangeRate}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Dato label="Costo real" value={usd(realCostUsd)} sub={`${uyu(costoUyu)} · sin ganancia`} />
        <Dato
          label={`Precio ideal (${targetMarginPct}% margen)`}
          value={uyu(ideal)}
          sub="Copialo al precio de venta"
          accent
        />
        <Dato
          label="Con tu precio actual"
          value={actual ? uyu(actual.profitUyu) : "—"}
          sub={actual ? `margen ${actual.marginPct}%` : "Sin precio cargado"}
          tone={actual ? (pierdePlata ? "bad" : "ok") : undefined}
        />
      </div>

      {pierdePlata && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          ⚠ A este precio estás <strong>perdiendo plata</strong>: no cubrís el costo de{" "}
          {uyu(costoUyu)}.
        </p>
      )}
    </Card>
  );
}

function Dato({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  tone?: "ok" | "bad";
}) {
  const color =
    tone === "bad" ? "text-danger" : tone === "ok" ? "text-stock" : accent ? "text-purple-2" : "text-ink";

  return (
    <div className="rounded-lg border border-line-2 bg-panel-2/50 px-4 py-3">
      <p className="text-xs text-faint">{label}</p>
      <p className={`mt-1 font-head text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-faint">{sub}</p>
    </div>
  );
}
