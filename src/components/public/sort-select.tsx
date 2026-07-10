"use client";

import { useRouter } from "next/navigation";
import { href, type Params } from "./catalog-nav";

const ORDENES = [
  { id: "reco", label: "Recomendados" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "nombre", label: "Nombre A-Z" },
];

export function SortSelect({ base, params }: { base: string; params: Params }) {
  const router = useRouter();

  return (
    <select
      defaultValue={params.sort ?? "reco"}
      onChange={(e) =>
        router.push(href(base, params, { sort: e.target.value === "reco" ? undefined : e.target.value }))
      }
      className="w-full rounded-lg border border-line-2 bg-panel-2 px-2.5 py-2 text-sm text-ink outline-none focus:border-purple"
    >
      {ORDENES.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
