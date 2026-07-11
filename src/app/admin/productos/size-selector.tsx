"use client";

import { useState } from "react";
import { sizesForGroup } from "@/lib/product-form-constants";

/**
 * Selección de talles con casillas (tildás los que se consiguen).
 * El set de casillas depende del grupo de la categoría (ropa vs calzado).
 * Igual se pueden agregar talles a medida (cm, "Único", etc.).
 *
 * Manda todo en un input oculto "sizes" (coma-separado), así el server
 * lo recibe igual que antes.
 */
export function SizeSelector({ group, initial }: { group: string | null; initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [nuevo, setNuevo] = useState("");

  const preset = sizesForGroup(group);
  const extras = selected.filter((s) => !preset.includes(s)); // talles a medida ya cargados

  const toggle = (s: string) =>
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const addCustom = () => {
    const v = nuevo.trim();
    if (v && !selected.includes(v)) setSelected((c) => [...c, v]);
    setNuevo("");
  };

  return (
    <div>
      <input type="hidden" name="sizes" value={selected.join(",")} />

      {preset.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {preset.map((s) => {
            const on = selected.includes(s);
            return (
              <button
                type="button"
                key={s}
                onClick={() => toggle(s)}
                aria-pressed={on}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  on
                    ? "border-transparent bg-gradient-to-br from-purple-2 to-purple-3 text-white"
                    : "border-line-2 bg-panel-2 text-muted hover:border-purple hover:text-ink"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-faint">
          Elegí una categoría de Ropa o Calzado para ver las casillas de talles, o agregá los tuyos
          abajo.
        </p>
      )}

      {/* Talles a medida ya seleccionados que no están en las casillas */}
      {extras.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {extras.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple/40 bg-purple/10 px-3 py-1.5 text-sm text-purple-2"
            >
              {s}
              <button type="button" onClick={() => toggle(s)} aria-label={`Quitar ${s}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Agregar un talle a medida */}
      <div className="mt-3 flex gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Otro talle (ej: Único, 48, 105cm)"
          className="w-full max-w-[220px] rounded-lg border border-line-2 bg-panel-2 px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-purple"
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-lg border border-line-2 px-3.5 py-2 text-sm text-muted transition hover:border-purple hover:text-ink"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
