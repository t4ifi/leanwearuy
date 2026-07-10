import type { Metadata } from "next";
import { Header } from "@/components/public/header";
import { CatalogPage } from "@/components/public/catalog-page";
import type { Params } from "@/components/public/catalog-nav";

export const metadata: Metadata = {
  title: "Encargues",
  description: "Prendas y calzado importado a pedido. Consultá por Instagram.",
};

// El catálogo cambia cuando editás productos en el panel.
export const revalidate = 60;

export default async function EncarguesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  return (
    <>
      <Header active="encargues" />
      <CatalogPage section="ENCARGUE" base="/" params={params} />
    </>
  );
}
