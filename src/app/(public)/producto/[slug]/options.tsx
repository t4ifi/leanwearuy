"use client";

import { useState } from "react";

/**
 * Selector de talle y color. Instagram no permite pre-cargar un mensaje,
 * así que mostramos la selección abajo para que el cliente la copie al DM.
 */
export function Options({ sizes, colors }: { sizes: string[]; colors: string[] }) {
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");

  const partes = [color && `Color: ${color}`, size && `Talle: ${size}`].filter(Boolean);

  return (
    <>
      {colors.length > 0 && (
        <Block label="Color">
          {colors.map((c) => (
            <Chip key={c} active={c === color} onClick={() => setColor(c)}>
              {c}
            </Chip>
          ))}
        </Block>
      )}

      <Block label="Talle">
        {sizes.length > 0 ? (
          sizes.map((s) => (
            <Chip key={s} active={s === size} onClick={() => setSize(s)}>
              {s}
            </Chip>
          ))
        ) : (
          <span className="rounded-lg border border-line-2 bg-panel-2 px-3.5 py-2 text-sm">Consultar</span>
        )}
      </Block>

      {partes.length > 0 && (
        <p className="text-sm text-purple-2">Tu selección → {partes.join(" · ")}</p>
      )}
    </>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel-2/40 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-faint">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3.5 py-2 text-sm transition ${
        active
          ? "border-transparent bg-gradient-to-br from-purple-2 to-purple-3 text-white"
          : "border-line-2 bg-panel-2 text-ink hover:border-purple"
      }`}
    >
      {children}
    </button>
  );
}
