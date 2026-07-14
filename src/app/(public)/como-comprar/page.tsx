import type { Metadata } from "next";
import { Header } from "@/components/public/header";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description: "Todas las compras se coordinan directamente por Instagram.",
};

export const revalidate = 300;

export default async function ComoComprarPage() {
  const settings = await getSettings();
  const instagram = settings?.instagram ?? "leanwear.uy";
  const demora = settings?.encargueLeadTimeDays ?? "25-30";

  return (
    <>
      <Header active="como-comprar" />

      <main className="mx-auto max-w-[1500px] px-5 pb-16">
        <div className="py-10">
          <h1 className="font-head text-4xl font-extrabold tracking-tight">Cómo comprar</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Todas las compras se coordinan{" "}
            <strong className="text-ink">directamente con nosotros por Instagram</strong>. Escribinos
            por mensaje directo y te ayudamos con tu pedido: consultas, precios, pago y envío.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Escribinos por Instagram">
            <p className="mb-5 text-muted">
              Todo el proceso de compra se maneja por mensaje directo (DM).
            </p>
            <div className="flex flex-col gap-3">
              <LinkRow href={`https://ig.me/m/${instagram}`}>◉ Enviar mensaje directo (DM)</LinkRow>
              <LinkRow href={`https://instagram.com/${instagram}`}>📷 Seguinos en Instagram</LinkRow>
            </div>
          </Card>

          <Card title="Sobre los encargues">
            <ul className="ml-5 list-disc space-y-3 text-muted">
              <li>
                Los encargues tienen una demora aproximada de{" "}
                <strong className="text-ink">{demora} días</strong>.
              </li>
              <li>
                Avisamos por <strong className="text-ink">Instagram</strong> cada vez que se{" "}
                <strong className="text-ink">abren los encargues</strong>.
              </li>
            </ul>
          </Card>

          <Card title="¿Dudas con el talle?">
            <p className="text-muted">
              Si no estás seguro de qué talle pedir, <strong className="text-ink">consultanos</strong>{" "}
              por Instagram y te pasamos las <strong className="text-ink">medidas exactas</strong> de esa
              prenda, para que compres sin problemas.
            </p>
          </Card>

          <div className="lg:col-span-2">
            <Card title="¿No encontrás lo que buscás?">
              <p className="text-muted">
                Pasanos una <strong className="text-ink">foto de cualquier prenda</strong> por
                Instagram y vemos si la conseguimos. Traemos muchísimos productos y{" "}
                <strong className="text-ink">no todos están publicados</strong> en la web.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel-2/40 p-7">
      <h2 className="mb-4 font-head text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function LinkRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="flex items-center gap-3 rounded-xl border border-line-2 bg-panel-2 px-5 py-4 font-medium transition hover:translate-x-1 hover:border-purple"
    >
      {children}
    </a>
  );
}
