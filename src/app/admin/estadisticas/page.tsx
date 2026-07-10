/**
 * Estadísticas del negocio.
 *
 * Forma elegida: los indicadores son cifras únicas -> "stat tiles", no gráficos.
 * El único gráfico es una barra de UNA serie (productos por marca), con un solo
 * tono y etiquetas directas; los textos usan colores de texto, no el de la barra.
 */
import Link from "next/link";
import { Card } from "@/components/ui";
import { getStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

const uyu = (n: number) => "$ " + Math.round(n).toLocaleString("es-UY");
const usd = (n: number) => "US$ " + n.toLocaleString("es-UY", { maximumFractionDigits: 2 });

export default async function EstadisticasPage() {
  const s = await getStats();
  const sinDatos = s.totales.pedidos === 0;

  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#f3f1fa]">Estadísticas</h1>
        <p className="mt-1 text-sm text-[#a39ec0]">
          Cotización usada: <strong className="text-[#f3f1fa]">US$ 1 = $ {s.rate}</strong> · se
          cambia en Configuración.
        </p>
      </div>

      {/* ---------------- Indicadores de dinero ---------------- */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Hero
          label="Valor del inventario"
          value={uyu(s.dinero.inventarioVentaUyu)}
          hint={`${s.totales.unidades} unidades en stock, a precio de venta`}
        />
        <Hero
          label="Inversión realizada"
          value={usd(s.dinero.inversionUsd)}
          hint={`${uyu(s.dinero.inversionUyu)} · ${s.totales.pedidos} pedidos de importación`}
        />
        <Hero
          label="Ganancia potencial"
          value={uyu(s.dinero.gananciaPotencialUyu)}
          hint="Si vendés todo el stock actual"
          accent={s.dinero.gananciaPotencialUyu > 0}
        />
        <Hero
          label="Margen promedio"
          value={s.dinero.margenPromedio != null ? `${s.dinero.margenPromedio}%` : "—"}
          hint={
            s.dinero.margenPromedio != null
              ? "Sobre los productos con precio y costo"
              : "Cargá costos para calcularlo"
          }
        />
      </div>

      {sinDatos && (
        <Card className="mt-4 border-[#fbbf24]/30">
          <p className="text-sm text-[#f3f1fa]">
            <span className="mr-2">⚠️</span>
            <strong>Todavía no cargaste ningún pedido de importación.</strong>
          </p>
          <p className="mt-1.5 text-sm text-[#a39ec0]">
            Sin pedidos no hay costo real, así que la inversión, la ganancia y el margen quedan en
            cero.{" "}
            <Link href="/admin/importaciones/nueva" className="text-[#a78bfa] hover:underline">
              Creá tu primer pedido
            </Link>{" "}
            para que estos números cobren sentido.
          </p>
        </Card>
      )}

      {/* ---------------- Catálogo ---------------- */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Mini label="Productos" value={s.totales.productos} />
        <Mini label="Publicados" value={s.totales.activos} />
        <Mini label="Borradores" value={s.totales.borradores} />
        <Mini label="Unidades en stock" value={s.totales.unidades} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ---------------- Poco stock ---------------- */}
        <Card>
          <h2 className="font-semibold text-[#f3f1fa]">Productos con poco stock</h2>
          <p className="mt-1 text-sm text-[#a39ec0]">Solo se controla la sección Stock.</p>

          {s.pocoStock.length === 0 ? (
            <p className="mt-5 text-sm text-[#6c6790]">
              No hay productos en la sección Stock por debajo de su umbral.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {s.pocoStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#2c2647] bg-[#1b1730] px-3.5 py-2.5"
                >
                  <span className="truncate text-sm text-[#f3f1fa]">{p.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-[#fbbf24]">
                    <span aria-hidden>⚠</span>
                    Poco stock: {p.stock} / {p.umbral}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------------- Productos por marca (barra de una serie) ---------------- */}
        <Card>
          <h2 className="font-semibold text-[#f3f1fa]">Productos por marca</h2>
          <p className="mt-1 text-sm text-[#a39ec0]">Cantidad de productos cargados.</p>

          <div className="mt-4 space-y-3">
            {s.porMarca.map((m) => {
              const max = s.porMarca[0]?.count || 1;
              return (
                <div key={m.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#f3f1fa]">{m.name}</span>
                    <span className="text-[#a39ec0] tabular-nums">{m.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-[#1b1730]">
                    <div
                      className="h-full rounded bg-[#8b5cf6]"
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
        <h2 className="font-semibold text-[#f3f1fa]">Datos por completar</h2>
        <p className="mt-1 text-sm text-[#a39ec0]">
          Cuantos más datos tengan tus productos, más precisas son las métricas.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Falta label="Sin precio de venta" value={s.pendientes.sinPrecio} total={s.totales.productos} />
          <Falta label="Sin costo cargado" value={s.pendientes.sinCosto} total={s.totales.productos} />
          <Falta label="Sin peso" value={s.pendientes.sinPeso} total={s.totales.productos} />
        </div>
      </Card>
    </>
  );
}

/* ------------------------------ Piezas ------------------------------ */

function Hero({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-[#6c6790]">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${accent ? "text-[#34d399]" : "text-[#f3f1fa]"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[#6c6790]">{hint}</p>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wider text-[#6c6790]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#f3f1fa]">{value}</p>
    </Card>
  );
}

function Falta({ label, value, total }: { label: string; value: number; total: number }) {
  const ok = value === 0;
  return (
    <div className="rounded-xl border border-[#2c2647] bg-[#1b1730] px-4 py-3">
      <p className="text-xs text-[#6c6790]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${ok ? "text-[#34d399]" : "text-[#f3f1fa]"}`}>
        {ok ? "✓ ninguno" : `${value} de ${total}`}
      </p>
    </div>
  );
}
