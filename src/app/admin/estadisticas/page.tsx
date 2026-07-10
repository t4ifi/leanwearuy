/**
 * Estadísticas del negocio.
 *
 * Forma elegida: los indicadores son cifras únicas -> "stat tiles", no gráficos.
 * El único gráfico es una barra de UNA serie (productos por marca), con un solo
 * tono y etiquetas directas; los textos usan colores de texto, no el de la barra.
 */
import { ButtonLink, Card, PageHeader, Stat } from "@/components/ui";
import { getStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");
const usd = (n: number) => "US$ " + n.toLocaleString("es-UY", { maximumFractionDigits: 2 });

export default async function EstadisticasPage() {
  const s = await getStats();

  return (
    <>
      <PageHeader
        title="Estadísticas"
        description={`Cotización usada: US$ 1 = $ ${s.rate}. Se cambia en Configuración.`}
      />

      {/* ---------------- Dinero ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Valor del inventario"
          value={uyu(s.dinero.inventarioVentaUyu)}
          hint={`${s.totales.unidades} unidades, a precio de venta`}
        />
        <Stat
          label="Inversión realizada"
          value={usd(s.dinero.inversionUsd)}
          hint={`${uyu(s.dinero.inversionUyu)} · ${s.totales.pedidos} pedidos`}
        />
        <Stat
          label="Ganancia potencial"
          value={uyu(s.dinero.gananciaPotencialUyu)}
          hint="Si vendés todo el stock actual"
          tone={s.dinero.gananciaPotencialUyu > 0 ? "ok" : undefined}
        />
        <Stat
          label="Margen promedio"
          value={s.dinero.margenPromedio != null ? `${s.dinero.margenPromedio}%` : "—"}
          hint={
            s.dinero.margenPromedio != null
              ? "Productos con precio y costo"
              : "Cargá costos para calcularlo"
          }
        />
      </div>

      {s.totales.pedidos === 0 && (
        <Card className="mt-4 border-amber-400/30">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-amber-400">⚠</span>
            <div>
              <p className="text-sm font-semibold text-ink">
                Todavía no cargaste ningún pedido de importación
              </p>
              <p className="mt-1.5 text-sm text-muted">
                Sin pedidos no hay costo real, así que la inversión, la ganancia y el margen quedan
                en cero.
              </p>
              <div className="mt-4">
                <ButtonLink href="/admin/importaciones/nueva" variant="secondary">
                  Crear el primer pedido
                </ButtonLink>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ---------------- Catálogo ---------------- */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Productos" value={s.totales.productos} />
        <Stat label="Publicados" value={s.totales.activos} />
        <Stat label="Borradores" value={s.totales.borradores} />
        <Stat label="Unidades en stock" value={s.totales.unidades} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ---------------- Poco stock ---------------- */}
        <Card>
          <h2 className="text-sm font-semibold text-ink">Productos con poco stock</h2>
          <p className="mt-1 text-sm text-muted">Solo se controla la sección Stock.</p>

          {s.pocoStock.length === 0 ? (
            <p className="mt-6 text-sm text-faint">
              No hay productos en Stock por debajo de su umbral.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {s.pocoStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line-2 bg-panel-2 px-3.5 py-2.5"
                >
                  <span className="truncate text-sm text-ink">{p.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-amber-400">
                    <span aria-hidden>⚠</span>
                    Poco stock: {p.stock} / {p.umbral}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------------- Productos por marca ---------------- */}
        <Card>
          <h2 className="text-sm font-semibold text-ink">Productos por marca</h2>
          <p className="mt-1 text-sm text-muted">Cantidad de productos cargados.</p>

          <div className="mt-5 space-y-3.5">
            {s.porMarca.map((m) => {
              const max = s.porMarca[0]?.count || 1;
              return (
                <div key={m.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-ink">{m.name}</span>
                    <span className="tabular-nums text-muted">{m.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full bg-purple"
                      style={{ width: `${(m.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ---------------- Datos que faltan ---------------- */}
      <Card className="mt-5">
        <h2 className="text-sm font-semibold text-ink">Datos por completar</h2>
        <p className="mt-1 text-sm text-muted">
          Cuantos más datos tengan tus productos, más precisas son las métricas.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Falta label="Sin precio de venta" value={s.pendientes.sinPrecio} total={s.totales.productos} />
          <Falta label="Sin costo cargado" value={s.pendientes.sinCosto} total={s.totales.productos} />
          <Falta label="Sin peso" value={s.pendientes.sinPeso} total={s.totales.productos} />
        </div>
      </Card>
    </>
  );
}

function Falta({ label, value, total }: { label: string; value: number; total: number }) {
  const ok = value === 0;
  return (
    <div className="rounded-lg border border-line-2 bg-panel-2 px-4 py-3">
      <p className="text-xs text-faint">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${ok ? "text-stock" : "text-ink"}`}>
        {ok ? "✓ ninguno" : `${value} de ${total}`}
      </p>
    </div>
  );
}
