"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBox, IconChart, IconHome, IconSettings, IconTruck } from "./icons";

const NAV = [
  { href: "/admin", label: "Inicio", Icon: IconHome, exact: true },
  { href: "/admin/productos", label: "Productos", Icon: IconBox },
  { href: "/admin/importaciones", label: "Importaciones", Icon: IconTruck },
  { href: "/admin/estadisticas", label: "Estadísticas", Icon: IconChart },
  { href: "/admin/configuracion", label: "Configuración", Icon: IconSettings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "bg-panel-2 font-medium text-ink"
                : "text-muted hover:bg-panel-2/50 hover:text-ink"
            }`}
          >
            {/* Barrita morada del ítem activo */}
            <span
              className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-purple transition-opacity ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            <Icon className={`size-[18px] shrink-0 ${active ? "text-purple-2" : ""}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
