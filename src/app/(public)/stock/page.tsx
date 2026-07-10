import type { Metadata } from "next";
import { Header } from "@/components/public/header";
import { CatalogPage } from "@/components/public/catalog-page";
import type { Params } from "@/components/public/catalog-nav";

export const metadata: Metadata = {
  title: "Stock disponible",
  description: "Prendas y calzado importado disponibles para entrega inmediata.",
};

export const revalidate = 60;

export default async function StockPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  return (
    <>
      <Header active="stock" />
      <CatalogPage section="STOCK" base="/stock" params={params} />
    </>
  );
}
